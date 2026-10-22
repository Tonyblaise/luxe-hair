import { prisma } from "@luxe-hair/db";
import { idParamSchema, serviceCreateSchema, serviceUpdateSchema } from "@luxe-hair/shared";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validate } from "../lib/validate";
import { requireAuth } from "../middleware/auth";
import type { AppEnv } from "../types";

const notFound = () => new HTTPException(404, { message: "Service not found" });

async function assertNameFree(companyId: string, name: string, exceptId?: string) {
  const clash = await prisma.service.findFirst({
    where: { companyId, name: { equals: name, mode: "insensitive" }, NOT: exceptId ? { id: exceptId } : undefined },
  });
  if (clash) throw new HTTPException(409, { message: "A service with this name already exists." });
}

// companyId always comes from the verified token, never from the request.
export const serviceRoutes = new Hono<AppEnv>()
  .use(requireAuth)

  .get("/", async (c) => {
    const services = await prisma.service.findMany({
      where: { companyId: c.get("companyId") },
      orderBy: { name: "asc" },
      include: { _count: { select: { employeeServices: true, sales: true, appointments: true } } },
    });
    return c.json(
      services.map(({ _count, companyId: _, ...s }) => ({
        ...s,
        employeeCount: _count.employeeServices,
        inUse: _count.sales + _count.appointments > 0,
      })),
    );
  })

  .post("/", validate("json", serviceCreateSchema), async (c) => {
    const companyId = c.get("companyId");
    const input = c.req.valid("json");
    await assertNameFree(companyId, input.name);
    const service = await prisma.service.create({ data: { ...input, companyId } });
    return c.json(service, 201);
  })

  .patch("/:id", validate("param", idParamSchema), validate("json", serviceUpdateSchema), async (c) => {
    const { id } = c.req.valid("param");
    const companyId = c.get("companyId");
    const existing = await prisma.service.findFirst({ where: { id, companyId } });
    if (!existing) throw notFound();

    const merged = serviceCreateSchema.safeParse({ ...existing, ...c.req.valid("json") });
    if (!merged.success) {
      throw new HTTPException(400, { message: merged.error.issues[0]?.message ?? "Invalid service" });
    }
    if (merged.data.name !== existing.name) await assertNameFree(companyId, merged.data.name, id);

    const service = await prisma.service.update({ where: { id }, data: merged.data });
    return c.json(service);
  })

  .delete("/:id", validate("param", idParamSchema), async (c) => {
    const { id } = c.req.valid("param");
    const companyId = c.get("companyId");
    const service = await prisma.service.findFirst({
      where: { id, companyId },
      include: { _count: { select: { sales: true, appointments: true } } },
    });
    if (!service) throw notFound();
    if (service._count.sales + service._count.appointments > 0) {
      throw new HTTPException(409, { message: "This service has sales or appointments, so it can't be deleted." });
    }
    await prisma.$transaction([
      prisma.employeeService.deleteMany({ where: { serviceId: id, companyId } }),
      prisma.service.delete({ where: { id } }),
    ]);
    return c.json({ ok: true });
  });
