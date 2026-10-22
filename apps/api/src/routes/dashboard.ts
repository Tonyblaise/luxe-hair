import { prisma } from "@luxe-hair/db";
import { EXPENSE_CATEGORIES, monthStart, todayDate, weekStart } from "@luxe-hair/shared";
import { Hono } from "hono";
import { computeWeek } from "../lib/payouts";
import { requireAuth } from "../middleware/auth";
import type { AppEnv } from "../types";
import { lowStockWhere } from "./meta";

export const dashboardRoutes = new Hono<AppEnv>()
  .use(requireAuth)

  .get("/", async (c) => {
    const companyId = c.get("companyId");
    const today = todayDate();
    const month = { gte: monthStart(today), lte: today };
    const week = weekStart(today);

    const [todaySales, monthSales, monthExpenses, byCategory, appointments, tasks, lowStock, payouts] =
      await Promise.all([
        prisma.sale.aggregate({ where: { companyId, date: today }, _count: true, _sum: { amount: true } }),
        prisma.sale.aggregate({ where: { companyId, date: month }, _sum: { amount: true } }),
        prisma.expense.aggregate({ where: { companyId, date: month }, _count: true, _sum: { amount: true } }),
        prisma.expense.groupBy({ by: ["category"], where: { companyId, date: month }, _sum: { amount: true } }),
        prisma.appointment.findMany({
          where: { companyId, date: today },
          orderBy: { time: "asc" },
          include: { client: true, service: true, employee: true },
        }),
        prisma.task.findMany({
          where: { companyId, status: "open", dueDate: { lte: today } },
          orderBy: [{ dueDate: "asc" }, { dueTime: "asc" }],
          take: 5,
        }),
        prisma.inventoryProduct.findMany({ where: lowStockWhere(companyId), orderBy: { name: "asc" } }),
        computeWeek(companyId, week),
      ]);

    const unpaid = payouts.filter((p) => p.status === "pending");
    const owed = unpaid.reduce((sum, p) => sum + p.total, 0);
    const monthRevenue = monthSales._sum.amount ?? 0;
    const monthExpenseTotal = monthExpenses._sum.amount ?? 0;

    return c.json({
      today: today.toISOString(),
      weekStart: week.toISOString(),
      kpis: {
        todayRevenue: todaySales._sum.amount ?? 0,
        todayCount: todaySales._count,
        monthRevenue,
        monthExpenses: monthExpenseTotal,
        monthExpenseCount: monthExpenses._count,
        commissionsOwed: owed,
        estProfit: monthRevenue - monthExpenseTotal - owed,
      },
      appointments: appointments.map((a) => ({
        id: a.id,
        time: a.time,
        status: a.status,
        client: `${a.client.firstName} ${a.client.lastName}`.trim(),
        service: a.service.name,
        employee: a.employee.firstName,
      })),
      tasks: tasks.map((t) => ({
        id: t.id,
        title: t.title,
        type: t.type,
        assignedTo: t.assignedTo,
        dueDate: t.dueDate.toISOString(),
        dueTime: t.dueTime,
        repeat: t.repeat,
        status: t.status,
      })),
      payouts: {
        owed,
        top: unpaid.slice(0, 4).map((p) => ({ employeeId: p.employeeId, name: p.name, total: p.total })),
      },
      expensesByCategory: EXPENSE_CATEGORIES.map((category) => ({
        category,
        total: byCategory.find((g) => g.category === category)?._sum.amount ?? 0,
      })),
      lowStock: lowStock.map((p) => ({ id: p.id, name: p.name, onHand: p.quantityInStock, reorderAt: p.reorderPoint })),
    });
  });
