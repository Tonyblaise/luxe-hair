import { AsyncLocalStorage } from "node:async_hooks";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

export * from "./generated/prisma/client";
export { deleteCompanyData } from "./company";

const scope = new AsyncLocalStorage<PrismaClient>();

/**
 * Runs `fn` with a Prisma client of its own. A Worker can't reuse a socket opened by another
 * request, so every request connects (through Hyperdrive, which keeps the real connections warm).
 */
export async function withPrisma<T>(connectionString: string, fn: () => Promise<T>): Promise<T> {
  const client = new PrismaClient({ adapter: new PrismaPg({ connectionString, max: 5 }) });
  try {
    return await scope.run(client, fn);
  } finally {
    await client.$disconnect();
  }
}

/** The current request's client; only usable inside `withPrisma`. */
export const prisma = new Proxy({} as PrismaClient, {
  get(_, key) {
    const client = scope.getStore();
    if (!client) throw new Error("prisma was used outside withPrisma()");
    const value = Reflect.get(client, key, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
