import { prisma } from "@luxe-hair/db";
import { idParamSchema, inventoryAdjustSchema } from "@luxe-hair/shared";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validate } from "../lib/validate";
import { requireAuth } from "../middleware/auth";
import type { AppEnv } from "../types";

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
        : new HTTPException(404, { message: "Product not found" });
    }
    const product = await prisma.inventoryProduct.findUniqueOrThrow({ where: { id } });
    return c.json({ onHand: product.quantityInStock });
  });
