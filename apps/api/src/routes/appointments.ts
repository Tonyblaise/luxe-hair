import { prisma } from "@luxe-hair/db";
import { appointmentStatusSchema, idParamSchema } from "@luxe-hair/shared";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validate } from "../lib/validate";
import { requireAuth } from "../middleware/auth";
import type { AppEnv } from "../types";

export const appointmentRoutes = new Hono<AppEnv>()
  .use(requireAuth)

  .patch("/:id/status", validate("param", idParamSchema), validate("json", appointmentStatusSchema), async (c) => {
    const { count } = await prisma.appointment.updateMany({
      where: { id: c.req.valid("param").id, companyId: c.get("companyId") },
      data: { status: c.req.valid("json").status },
    });
    if (count === 0) throw new HTTPException(404, { message: "Appointment not found" });
    return c.json({ ok: true });
  });
