import { prisma } from "@luxe-hair/db";
import { addDays, todayDate, weekStart } from "@luxe-hair/shared";
import { Hono } from "hono";
import { z } from "zod";
import { computeWeek } from "../lib/payouts";
import { validate } from "../lib/validate";
import { requireAuth, requireManager } from "../middleware/auth";
import type { AppEnv } from "../types";

export const payoutRoutes = new Hono<AppEnv>()
  .use(requireAuth)

  .get("/", async (c) => {
    const companyId = c.get("companyId");
    const week = weekStart(todayDate());
    const [rows, services] = await Promise.all([
      computeWeek(companyId, week),
      prisma.service.findMany({ where: { companyId }, orderBy: { name: "asc" } }),
    ]);
    const sum = (f: (r: (typeof rows)[number]) => number) => rows.reduce((s, r) => s + f(r), 0);
    return c.json({
      weekStart: week.toISOString(),
      totals: {
        serviceSales: sum((r) => r.serviceSales),
        commissions: sum((r) => r.serviceCommission + r.retailCommission),
        tips: sum((r) => r.tips),
        owed: sum((r) => (r.status === "pending" ? r.total : 0)),
      },
      rows,
      rates: services.map((s) => ({
        id: s.id,
        name: s.name,
        price: s.price,
        commissionType: s.commissionType,
        commission: s.commission,
      })),
    });
  })

  .post("/pay", requireManager, validate("json", z.object({ employeeIds: z.array(z.uuid()).max(200).optional() })), async (c) => {
    const companyId = c.get("companyId");
    const week = weekStart(todayDate());
    const { employeeIds } = c.req.valid("json");
    const due = (await computeWeek(companyId, week)).filter(
      (r) => r.status === "pending" && (!employeeIds || employeeIds.includes(r.employeeId)),
    );

    await prisma.$transaction(async (tx) => {
      for (const r of due) {
        const data = {
          serviceSales: r.serviceSales,
          serviceCommission: r.serviceCommission,
          retailCommission: r.retailCommission,
          tips: r.tips,
          totalPayout: r.total,
          status: "paid" as const,
          payDay: "Sunday",
        };
        await tx.payout.upsert({
          where: { companyId_employeeId_weekStart: { companyId, employeeId: r.employeeId, weekStart: week } },
          create: { ...data, companyId, employeeId: r.employeeId, weekStart: week, weekEnd: addDays(week, 6) },
          update: data,
        });
        await tx.expense.create({
          data: {
            companyId,
            date: todayDate(),
            category: "payroll",
            description: `Commission payout · ${r.name}`,
            amount: r.total,
          },
        });
      }
    });

    return c.json({
      paid: due.length,
      total: due.reduce((s, r) => s + r.total, 0),
      name: due.length === 1 ? due[0]!.name : null,
    });
  });
