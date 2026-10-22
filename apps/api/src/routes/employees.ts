import { prisma } from "@luxe-hair/db";
import { employeeCreateSchema, employeeUpdateSchema, idParamSchema, todayDate, weekStart } from "@luxe-hair/shared";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { computeWeek } from "../lib/payouts";
import { validate } from "../lib/validate";
import { requireAuth } from "../middleware/auth";
import type { AppEnv } from "../types";

/** Rejects adding or reactivating an employee beyond the company plan's limit. */
async function assertWithinPlan(companyId: string) {
  const company = await prisma.company.findUniqueOrThrow({ where: { id: companyId }, include: { plan: true } });
  const limit = company.plan?.employeeLimit;
  if (limit == null) return;
  const active = await prisma.employee.count({ where: { companyId, status: "active" } });
  if (active >= limit) {
    throw new HTTPException(400, {
      message: `Your ${company.plan!.name} plan allows up to ${limit} active employees. Deactivate someone or upgrade your plan.`,
    });
  }
}

export const employeeRoutes = new Hono<AppEnv>()
  .use(requireAuth)

  .get("/", async (c) => {
    const companyId = c.get("companyId");
    const today = todayDate();
    const [employees, services, week, appts] = await Promise.all([
      prisma.employee.findMany({
        where: { companyId },
        orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
        include: { employeeServices: { select: { serviceId: true } } },
      }),
      prisma.service.findMany({ where: { companyId }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
      computeWeek(companyId, weekStart(today)),
      prisma.appointment.groupBy({ by: ["employeeId"], where: { companyId, date: today }, _count: true }),
    ]);

    return c.json({
      services,
      employees: employees.map((e) => {
        const payout = week.find((p) => p.employeeId === e.id);
        return {
          id: e.id,
          firstName: e.firstName,
          lastName: e.lastName,
          role: e.role,
          employmentType: e.employmentType,
          phone: e.phone ?? "",
          status: e.status,
          scheduleDays: e.scheduleDays,
          serviceIds: e.employeeServices.map((l) => l.serviceId),
          stats: {
            salesThisWeek: payout?.serviceSales ?? 0,
            payoutThisWeek: payout?.total ?? 0,
            appointmentsToday: appts.find((a) => a.employeeId === e.id)?._count ?? 0,
          },
        };
      }),
    });
  })

  .post("/", validate("json", employeeCreateSchema), async (c) => {
    await assertWithinPlan(c.get("companyId"));
    const employee = await prisma.employee.create({
      data: { ...c.req.valid("json"), companyId: c.get("companyId"), scheduleDays: [] },
    });
    return c.json({ id: employee.id }, 201);
  })

  .patch("/:id", validate("param", idParamSchema), validate("json", employeeUpdateSchema), async (c) => {
    const companyId = c.get("companyId");
    const { id } = c.req.valid("param");
    const { serviceIds, phone, ...fields } = c.req.valid("json");

    const employee = await prisma.employee.findFirst({ where: { id, companyId } });
    if (!employee) throw new HTTPException(404, { message: "Employee not found" });
    if (fields.status === "active" && employee.status !== "active") await assertWithinPlan(companyId);

    if (serviceIds) {
      const owned = await prisma.service.count({ where: { companyId, id: { in: serviceIds } } });
      if (owned !== new Set(serviceIds).size) throw new HTTPException(400, { message: "Unknown service" });
    }

    await prisma.$transaction(async (tx) => {
      await tx.employee.update({
        where: { id },
        data: { ...fields, ...(phone !== undefined ? { phone: phone || null } : {}) },
      });
      if (serviceIds) {
        await tx.employeeService.deleteMany({ where: { companyId, employeeId: id, serviceId: { notIn: serviceIds } } });
        await tx.employeeService.createMany({
          data: serviceIds.map((serviceId) => ({ companyId, employeeId: id, serviceId })),
          skipDuplicates: true,
        });
      }
    });
    return c.json({ ok: true });
  });
