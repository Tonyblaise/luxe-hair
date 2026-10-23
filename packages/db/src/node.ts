import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma-node/client";

export * from "./generated/prisma-node/client";

/** Long-lived client for Node scripts (seed); the app uses `withPrisma` from ./index instead. */
export const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
