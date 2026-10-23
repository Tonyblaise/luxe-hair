import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { withPrisma } from "@luxe-hair/db";
import { appointmentRoutes } from "./routes/appointments";
import { authRoutes } from "./routes/auth";
import { dashboardRoutes } from "./routes/dashboard";
import { employeeRoutes } from "./routes/employees";
import { expenseRoutes } from "./routes/expenses";
import { inventoryRoutes } from "./routes/inventory";
import { metaRoutes } from "./routes/meta";
import { payoutRoutes } from "./routes/payouts";
import { platformRoutes } from "./routes/platform";
import { reportRoutes } from "./routes/reports";
import { saleRoutes } from "./routes/sales";
import { serviceRoutes } from "./routes/services";
import { taskRoutes } from "./routes/tasks";
import { teamRoutes } from "./routes/team";
import { withBindings } from "./env";
import type { AppEnv } from "./types";

const PRISMA_ERRORS: Record<string, [409, string]> = {
  P2002: [409, "A record with this value already exists"],
  P2003: [409, "This record is still referenced by other records"],
};

export const app = new Hono<AppEnv>()
  .use(logger())
  .use(secureHeaders())
  // Per request: bindings for `env`, and a database client of its own (see withPrisma).
  .use((c, next) => withBindings(c.env, () => withPrisma(c.env.HYPERDRIVE.connectionString, next)))
  .get("/health", (c) => c.json({ ok: true }))
  .route("/auth", authRoutes)
  .route("/meta", metaRoutes)
  .route("/dashboard", dashboardRoutes)
  .route("/appointments", appointmentRoutes)
  .route("/sales", saleRoutes)
  .route("/services", serviceRoutes)
  .route("/tasks", taskRoutes)
  .route("/employees", employeeRoutes)
  .route("/team", teamRoutes)
  .route("/inventory", inventoryRoutes)
  .route("/expenses", expenseRoutes)
  .route("/payouts", payoutRoutes)
  .route("/reports", reportRoutes)
  .route("/platform", platformRoutes);

app.onError((err, c) => {
  if (err instanceof HTTPException) return c.json({ error: err.message }, err.status);
  const prismaError = PRISMA_ERRORS[(err as { code?: string }).code ?? ""];
  if (prismaError) return c.json({ error: prismaError[1] }, prismaError[0]);
  console.error(err);
  return c.json({ error: "Internal server error" }, 500);
});

app.notFound((c) => c.json({ error: "Not found" }, 404));

export type AppType = typeof app;
