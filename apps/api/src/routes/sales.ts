import { prisma, type Prisma } from "@luxe-hair/db";
import {
  idParamSchema,
  parseISODate,
  saleCreateSchema,
  salesQuerySchema,
  todayDate,
  weekStart,
} from "@luxe-hair/shared";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validate } from "../lib/validate";
import { requireAuth } from "../middleware/auth";
import type { AppEnv } from "../types";

const LIST_LIMIT = 200;

function periodWhere(period: "today" | "week" | "all"): Prisma.SaleWhereInput {
  const today = todayDate();
  if (period === "today") return { date: today };
  if (period === "week") return { date: { gte: weekStart(today), lte: today } };
  return {};
}

export const saleRoutes = new Hono<AppEnv>()
  .use(requireAuth)

  .get("/", validate("query", salesQuerySchema), async (c) => {
    const companyId = c.get("companyId");
    const where = { companyId, ...periodWhere(c.req.valid("query").period) };
    const [rows, totals] = await Promise.all([
      prisma.sale.findMany({
        where,
        orderBy: [{ date: "desc" }, { createdDate: "desc" }],
        take: LIST_LIMIT,
        include: {
          service: { select: { name: true } },
          employee: { select: { firstName: true, lastName: true } },
          client: { select: { firstName: true, lastName: true } },
        },
      }),
      prisma.sale.aggregate({ where, _count: true, _sum: { amount: true } }),
    ]);
    return c.json({
      count: totals._count,
      revenue: totals._sum.amount ?? 0,
      truncated: totals._count > rows.length,
      sales: rows.map((s) => ({
        id: s.id,
        date: s.date.toISOString(),
        amount: s.amount,
        tipAmount: s.tipAmount,
        paymentMethod: s.paymentMethod,
        service: s.service.name,
        employee: `${s.employee.firstName} ${s.employee.lastName}`,
        client: s.client ? `${s.client.firstName} ${s.client.lastName}`.trim() : null,
      })),
    });
  })

  .get("/options", async (c) => {
    const companyId = c.get("companyId");
    const [services, employees] = await Promise.all([
      prisma.service.findMany({ where: { companyId }, orderBy: { name: "asc" }, select: { id: true, name: true, price: true } }),
      prisma.employee.findMany({
        where: { companyId, status: "active" },
        orderBy: { firstName: "asc" },
        include: { employeeServices: { select: { serviceId: true } } },
      }),
    ]);
    return c.json({
      services,
      employees: employees.map((e) => ({
        id: e.id,
        firstName: e.firstName,
        name: `${e.firstName} ${e.lastName}`,
        serviceIds: e.employeeServices.map((l) => l.serviceId),
      })),
    });
  })

  .post("/", validate("json", saleCreateSchema), async (c) => {
    const companyId = c.get("companyId");
    const input = c.req.valid("json");
    const [service, employee] = await Promise.all([
      prisma.service.findFirst({ where: { id: input.serviceId, companyId } }),
      prisma.employee.findFirst({ where: { id: input.employeeId, companyId } }),
    ]);
    if (!service || !employee) throw new HTTPException(400, { message: "Pick a service and an employee from this salon." });

    let clientId: string | null = null;
    if (input.clientName) {
      const [firstName = "", ...rest] = input.clientName.split(/\s+/);
      const lastName = rest.join(" ");
      const existing = await prisma.client.findFirst({
        where: {
          companyId,
          firstName: { equals: firstName, mode: "insensitive" },
          lastName: { equals: lastName, mode: "insensitive" },
        },
      });
      clientId = existing?.id ?? (await prisma.client.create({ data: { companyId, firstName, lastName } })).id;
    }

    const sale = await prisma.sale.create({
      data: {
        companyId,
        serviceId: service.id,
        employeeId: employee.id,
        clientId,
        date: parseISODate(input.date),
        amount: input.amount,
        tipAmount: input.tipAmount,
        paymentMethod: input.paymentMethod,
      },
    });
    return c.json(sale, 201);
  })

  .delete("/:id", validate("param", idParamSchema), async (c) => {
    const { count } = await prisma.sale.deleteMany({
      where: { id: c.req.valid("param").id, companyId: c.get("companyId") },
    });
    if (count === 0) throw new HTTPException(404, { message: "Sale not found" });
    return c.json({ ok: true });
  });
