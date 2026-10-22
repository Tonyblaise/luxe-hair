import { prisma } from "@luxe-hair/db";
import {
  EXPENSE_CATEGORIES,
  addMonths,
  commissionFor,
  monthEnd,
  monthKey,
  monthStart,
  parseMonthKey,
  reportsQuerySchema,
  todayDate,
  type ExpenseCategory,
} from "@luxe-hair/shared";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validate } from "../lib/validate";
import { requireAuth } from "../middleware/auth";
import type { AppEnv } from "../types";

const MAX_MONTHS = 24;

export const reportRoutes = new Hono<AppEnv>()
  .use(requireAuth)

  .get("/", validate("query", reportsQuerySchema), async (c) => {
    const companyId = c.get("companyId");
    const today = todayDate();
    const q = c.req.valid("query");
    let from = parseMonthKey(q.from);
    let to = parseMonthKey(q.to);
    if (from > to) [from, to] = [to, from];
    if (to > monthStart(today)) to = monthStart(today);
    const months: Date[] = [];
    for (let m = from; m <= to; m = addMonths(m, 1)) months.push(m);
    if (months.length === 0 || months.length > MAX_MONTHS) {
      throw new HTTPException(400, { message: `Pick between 1 and ${MAX_MONTHS} months.` });
    }
    const end = to.getTime() === monthStart(today).getTime() ? today : monthEnd(to);

    const [salesByMonth, expensesByMonth, byEmployeeService, employees, services] = await Promise.all([
      prisma.$queryRaw<{ month: string; total: number; count: number }[]>`
        SELECT to_char(date, 'YYYY-MM') AS month, SUM(amount)::int AS total, COUNT(*)::int AS count
        FROM sales WHERE company_id = ${companyId} AND date BETWEEN ${from} AND ${end}
        GROUP BY 1`,
      prisma.$queryRaw<{ month: string; category: ExpenseCategory; total: number }[]>`
        SELECT to_char(date, 'YYYY-MM') AS month, category::text AS category, SUM(amount)::int AS total
        FROM expenses WHERE company_id = ${companyId} AND date BETWEEN ${from} AND ${end}
        GROUP BY 1, 2`,
      prisma.sale.groupBy({
        by: ["employeeId", "serviceId"],
        where: { companyId, date: { gte: from, lte: end } },
        _count: true,
        _sum: { amount: true },
      }),
      prisma.employee.findMany({ where: { companyId }, select: { id: true, firstName: true, lastName: true } }),
      prisma.service.findMany({ where: { companyId } }),
    ]);

    const serviceById = new Map(services.map((s) => [s.id, s]));

    const monthRows = months.map((m) => {
      const key = monthKey(m);
      const sales = salesByMonth.find((r) => r.month === key);
      const categories = Object.fromEntries(
        EXPENSE_CATEGORIES.map((cat) => [
          cat,
          expensesByMonth.find((r) => r.month === key && r.category === cat)?.total ?? 0,
        ]),
      ) as Record<ExpenseCategory, number>;
      return {
        month: key,
        partial: key === monthKey(today),
        sales: sales?.total ?? 0,
        appointments: sales?.count ?? 0,
        expenses: Object.values(categories).reduce((a, b) => a + b, 0),
        categories,
      };
    });

    const employeeRows = employees
      .map((e) => {
        const groups = byEmployeeService.filter((g) => g.employeeId === e.id);
        const sales = groups.reduce((s, g) => s + (g._sum.amount ?? 0), 0);
        const appointments = groups.reduce((s, g) => s + g._count, 0);
        // Percentage commission is linear in amount, so it can be applied to each group's sum.
        const commission = groups.reduce((s, g) => {
          const svc = serviceById.get(g.serviceId)!;
          return s + (svc.commissionType === "percent" ? commissionFor(svc, g._sum.amount ?? 0) : svc.commission * g._count);
        }, 0);
        return {
          id: e.id,
          name: `${e.firstName} ${e.lastName}`,
          sales,
          appointments,
          avgTicket: appointments ? Math.round(sales / appointments) : 0,
          commission,
        };
      })
      .filter((e) => e.appointments > 0)
      .sort((a, b) => b.sales - a.sales);

    const totalSales = monthRows.reduce((s, m) => s + m.sales, 0);
    const serviceRows = services
      .map((s) => {
        const groups = byEmployeeService.filter((g) => g.serviceId === s.id);
        const sales = groups.reduce((t, g) => t + (g._sum.amount ?? 0), 0);
        return {
          id: s.id,
          name: s.name,
          price: s.price,
          booked: groups.reduce((t, g) => t + g._count, 0),
          sales,
          share: totalSales ? sales / totalSales : 0,
        };
      })
      .filter((s) => s.booked > 0)
      .sort((a, b) => b.sales - a.sales);

    return c.json({ today: today.toISOString(), months: monthRows, employees: employeeRows, services: serviceRows });
  });
