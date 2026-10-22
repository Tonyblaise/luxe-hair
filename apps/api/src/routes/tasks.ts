import { prisma, type Prisma } from "@luxe-hair/db";
import {
  addDays,
  addMonthsSameDay,
  idParamSchema,
  parseISODate,
  taskCreateSchema,
  taskUpdateSchema,
  todayDate,
} from "@luxe-hair/shared";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { validate } from "../lib/validate";
import { requireAuth } from "../middleware/auth";
import type { AppEnv } from "../types";

const FILTERS = ["open", "today", "overdue", "upcoming", "done"] as const;
type Filter = (typeof FILTERS)[number];

function filterWhere(filter: Filter, today: Date): Prisma.TaskWhereInput {
  switch (filter) {
    case "open":
      return { status: "open" };
    case "today":
      return { status: "open", dueDate: today };
    case "overdue":
      return { status: "open", dueDate: { lt: today } };
    case "upcoming":
      return { status: "open", dueDate: { gt: today } };
    case "done":
      return { status: "done" };
  }
}

function nextDue(due: Date, repeat: "daily" | "weekly" | "monthly") {
  if (repeat === "daily") return addDays(due, 1);
  if (repeat === "weekly") return addDays(due, 7);
  return addMonthsSameDay(due, 1);
}

const serialize = (t: Prisma.TaskGetPayload<object>) => ({
  id: t.id,
  title: t.title,
  type: t.type,
  assignedTo: t.assignedTo,
  dueDate: t.dueDate.toISOString(),
  dueTime: t.dueTime,
  repeat: t.repeat,
  status: t.status,
});

export const taskRoutes = new Hono<AppEnv>()
  .use(requireAuth)

  .get("/", validate("query", z.object({ filter: z.enum(FILTERS).default("open") })), async (c) => {
    const companyId = c.get("companyId");
    const today = todayDate();
    const { filter } = c.req.valid("query");
    const [tasks, ...counts] = await Promise.all([
      prisma.task.findMany({
        where: { companyId, ...filterWhere(filter, today) },
        orderBy: filter === "done" ? [{ dueDate: "desc" }] : [{ dueDate: "asc" }, { dueTime: "asc" }],
        take: filter === "done" ? 50 : 200,
      }),
      ...FILTERS.map((f) => prisma.task.count({ where: { companyId, ...filterWhere(f, today) } })),
    ]);
    return c.json({
      tasks: tasks.map(serialize),
      counts: Object.fromEntries(FILTERS.map((f, i) => [f, counts[i]!])) as Record<Filter, number>,
    });
  })

  .post("/", validate("json", taskCreateSchema), async (c) => {
    const { dueDate, ...input } = c.req.valid("json");
    const task = await prisma.task.create({
      data: { ...input, dueDate: parseISODate(dueDate), companyId: c.get("companyId") },
    });
    return c.json(serialize(task), 201);
  })

  .patch("/:id", validate("param", idParamSchema), validate("json", taskUpdateSchema), async (c) => {
    const companyId = c.get("companyId");
    const task = await prisma.task.findFirst({ where: { id: c.req.valid("param").id, companyId } });
    if (!task) throw new HTTPException(404, { message: "Task not found" });
    const { done } = c.req.valid("json");

    let next: string | null = null;
    await prisma.$transaction(async (tx) => {
      await tx.task.update({ where: { id: task.id }, data: { status: done ? "done" : "open" } });
      if (done && task.status === "open" && task.repeat !== "none") {
        const { id: _id, createdDate: _c, modifiedDate: _m, ...rest } = task;
        const created = await tx.task.create({
          data: { ...rest, status: "open", dueDate: nextDue(task.dueDate, task.repeat) },
        });
        next = created.dueDate.toISOString();
      }
    });
    return c.json({ ok: true, title: task.title, next });
  })

  .delete("/:id", validate("param", idParamSchema), async (c) => {
    const { count } = await prisma.task.deleteMany({
      where: { id: c.req.valid("param").id, companyId: c.get("companyId") },
    });
    if (count === 0) throw new HTTPException(404, { message: "Task not found" });
    return c.json({ ok: true });
  });
