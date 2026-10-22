import { prisma } from "@luxe-hair/db";

/** The single platform settings row, created with defaults on first use. */
export const getSettings = () => prisma.platformSettings.upsert({ where: { id: 1 }, create: { id: 1 }, update: {} });
