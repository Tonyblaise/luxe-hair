import { prisma } from "@luxe-hair/db";
import { idParamSchema, inventoryAdjustSchema, productSchema } from "@luxe-hair/shared";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validate } from "../lib/validate";
import { requireAuth } from "../middleware/auth";
import type { AppEnv } from "../types";

const notFound = () => new HTTPException(404, { message: "Product not found" });

async function assertNameFree(companyId: string, name: string, exceptId?: string) {
  const clash = await prisma.inventoryProduct.findFirst({
    where: { companyId, name: { equals: name, mode: "insensitive" }, NOT: exceptId ? { id: exceptId } : undefined },
  });
  if (clash) throw new HTTPException(409, { message: "A product with this name already exists." });
}

export const inventoryRoutes = new Hono<AppEnv>()
  .use(requireAuth)

  .get("/", async (c) => {
    const products = await prisma.inventoryProduct.findMany({
      where: { companyId: c.get("companyId") },
      orderBy: [{ type: "asc" }, { name: "asc" }],
    });
    return c.json(
      products.map((p) => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
        type: p.type,
        unitCost: p.unitCost,
        price: p.price,
        onHand: p.quantityInStock,
        reorderAt: p.reorderPoint,
        low: p.quantityInStock <= p.reorderPoint,
      })),
    );
  })

  .post("/", validate("json", productSchema), async (c) => {
    const companyId = c.get("companyId");
    const input = c.req.valid("json");
    await assertNameFree(companyId, input.name);
    const product = await prisma.inventoryProduct.create({ data: { ...input, brand: input.brand ?? null, companyId } });
    return c.json({ id: product.id, name: product.name }, 201);
  })

  .patch("/:id", validate("param", idParamSchema), validate("json", productSchema), async (c) => {
    const companyId = c.get("companyId");
    const { id } = c.req.valid("param");
    const input = c.req.valid("json");
    const existing = await prisma.inventoryProduct.findFirst({ where: { id, companyId } });
    if (!existing) throw notFound();
    if (input.name.toLowerCase() !== existing.name.toLowerCase()) await assertNameFree(companyId, input.name, id);
    await prisma.inventoryProduct.update({ where: { id }, data: { ...input, brand: input.brand ?? null } });
    return c.json({ id, name: input.name });
  })

  .delete("/:id", validate("param", idParamSchema), async (c) => {
    const { count } = await prisma.inventoryProduct.deleteMany({
      where: { id: c.req.valid("param").id, companyId: c.get("companyId") },
    });
    if (count === 0) throw notFound();
    return c.json({ ok: true });
  })

  .patch("/:id/adjust", validate("param", idParamSchema), validate("json", inventoryAdjustSchema), async (c) => {
    const { id } = c.req.valid("param");
    const { delta } = c.req.valid("json");
    // Conditional increment keeps concurrent taps from driving stock below zero.
    const { count } = await prisma.inventoryProduct.updateMany({
      where: { id, companyId: c.get("companyId"), quantityInStock: { gte: Math.max(0, -delta) } },
      data: { quantityInStock: { increment: delta } },
    });
    if (count === 0) {
      const exists = await prisma.inventoryProduct.count({ where: { id, companyId: c.get("companyId") } });
      throw exists
        ? new HTTPException(400, { message: "Stock can't go below zero." })
        : notFound();
    }
    const product = await prisma.inventoryProduct.findUniqueOrThrow({ where: { id } });
    return c.json({ onHand: product.quantityInStock });
  });
