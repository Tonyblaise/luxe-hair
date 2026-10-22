import { prisma } from "@luxe-hair/db";
import {
  EXPENSE_CATEGORIES,
  addDays,
  expenseCreateSchema,
  idParamSchema,
  monthStart,
  todayDate,
} from "@luxe-hair/shared";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { readReceipt, saveReceipt } from "../lib/uploads";
import { validate } from "../lib/validate";
import { requireAuth } from "../middleware/auth";
import type { AppEnv } from "../types";

const LOG_LIMIT = 100;

/** Posts this month's recurring expenses that are due and not yet posted. Idempotent. */
async function postDueRecurring(companyId: string, today: Date) {
  const start = monthStart(today);
  const due = await prisma.recurringExpense.findMany({
    where: { companyId, autoPostDay: { lte: today.getUTCDate() } },
    include: { expenses: { where: { date: { gte: start } }, select: { id: true }, take: 1 } },
  });
  const missing = due.filter((r) => r.expenses.length === 0);
  if (missing.length === 0) return;
  await prisma.expense.createMany({
    data: missing.map((r) => ({
      companyId,
      date: addDays(start, r.autoPostDay - 1),
      description: r.name,
      category: r.category,
      amount: r.amount,
      isRecurring: true,
      recurringExpenseId: r.id,
    })),
  });
}

export const expenseRoutes = new Hono<AppEnv>()
  .use(requireAuth)

  .get("/", validate("query", z.object({ category: z.enum(EXPENSE_CATEGORIES).optional() })), async (c) => {
    const companyId = c.get("companyId");
    const today = todayDate();
    await postDueRecurring(companyId, today);
    const { category } = c.req.valid("query");
    const month = { gte: monthStart(today), lte: today };

    const [byCategory, recurring, log] = await Promise.all([
      prisma.expense.groupBy({ by: ["category"], where: { companyId, date: month }, _sum: { amount: true } }),
      prisma.recurringExpense.findMany({ where: { companyId }, orderBy: { amount: "desc" } }),
      prisma.expense.findMany({
        where: { companyId, ...(category ? { category } : {}) },
        orderBy: [{ date: "desc" }, { createdDate: "desc" }],
        take: LOG_LIMIT,
      }),
    ]);

    return c.json({
      month: today.toISOString(),
      byCategory: EXPENSE_CATEGORIES.map((cat) => ({
        category: cat,
        total: byCategory.find((g) => g.category === cat)?._sum.amount ?? 0,
      })),
      recurring: recurring.map((r) => ({ id: r.id, name: r.name, amount: r.amount, category: r.category })),
      log: log.map((e) => ({
        id: e.id,
        date: e.date.toISOString(),
        description: e.description,
        category: e.category,
        amount: e.amount,
        isRecurring: e.isRecurring,
        hasReceipt: Boolean(e.receiptPath),
      })),
    });
  })

  .post("/", validate("form", expenseCreateSchema), async (c) => {
    const companyId = c.get("companyId");
    const input = c.req.valid("form");
    const body = await c.req.parseBody();
    const file = body["receipt"];
    const receiptPath = file instanceof File && file.size > 0 ? await saveReceipt(companyId, file) : null;

    const expense = await prisma.$transaction(async (tx) => {
      const recurring = input.repeatsMonthly
        ? await tx.recurringExpense.create({
            data: { companyId, name: input.description, amount: input.amount, category: input.category, autoPostDay: 1 },
          })
        : null;
      return tx.expense.create({
        data: {
          companyId,
          date: todayDate(),
          description: input.description,
          category: input.category,
          amount: input.amount,
          hasReceipt: Boolean(receiptPath),
          receiptPath,
          isRecurring: Boolean(recurring),
          recurringExpenseId: recurring?.id ?? null,
        },
      });
    });
    return c.json({ id: expense.id, amount: expense.amount }, 201);
  })

  .get("/:id/receipt", validate("param", idParamSchema), async (c) => {
    const expense = await prisma.expense.findFirst({
      where: { id: c.req.valid("param").id, companyId: c.get("companyId") },
    });
    if (!expense?.receiptPath) throw new HTTPException(404, { message: "Receipt not found" });
    const { body, type } = await readReceipt(expense.receiptPath);
    return c.body(body, 200, { "Content-Type": type, "Cache-Control": "private, max-age=3600" });
  });
