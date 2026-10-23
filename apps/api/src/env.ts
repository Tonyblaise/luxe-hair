import { AsyncLocalStorage } from "node:async_hooks";
import type { Bindings } from "./types";

const scope = new AsyncLocalStorage<Bindings>();

/** Makes the Worker's bindings readable through `env` while `fn` runs (set per request in app.ts). */
export const withBindings = <T>(bindings: Bindings, fn: () => Promise<T>) => scope.run(bindings, fn);

function bindings() {
  const current = scope.getStore();
  if (!current) throw new Error("env was read outside a request");
  return current;
}

// Secrets come from `wrangler secret put` in production and apps/web/.dev.vars locally, never
// from .env files (OpenNext bundles those into the Worker).
export const env = {
  get jwtSecret() {
    const secret = bindings().JWT_SECRET;
    if (!secret) throw new Error("Missing JWT_SECRET binding");
    return secret;
  },
  get webOrigin() {
    return bindings().WEB_ORIGIN ?? "http://localhost:3000";
  },
  get resendApiKey() {
    return bindings().RESEND_API_KEY;
  },
  get emailFrom() {
    return bindings().EMAIL_FROM ?? "Luxe Hair <onboarding@resend.dev>";
  },
};
