import { prisma } from "@luxe-hair/db";
import { todayDate } from "@luxe-hair/shared";
import { Hono } from "hono";
import { requireAuth } from "../middleware/auth";
import type { AppEnv } from "../types";

export const lowStockWhere = (companyId: string) => ({
  companyId,
  quantityInStock: { lte: prisma.inventoryProduct.fields.reorderPoint },
});

export const metaRoutes = new Hono<AppEnv>()
  .use(requireAuth)

  .get("/nav-counts", async (c) => {
    const companyId = c.get("companyId");
    const [tasks, lowStock] = await Promise.all([
      prisma.task.count({ where: { companyId, status: "open", dueDate: { lte: todayDate() } } }),
      prisma.inventoryProduct.count({ where: lowStockWhere(companyId) }),
    ]);
    return c.json({ tasks, lowStock });
  });
