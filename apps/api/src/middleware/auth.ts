import { prisma } from "@luxe-hair/db";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { issuedBefore, verifyToken, type TokenClaims } from "../lib/jwt";
import type { AppEnv } from "../types";

const unauthorized = () => new HTTPException(401, { message: "Unauthorized" });
export const suspended = () => new HTTPException(403, { message: "This salon's account is suspended." });

export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  const header = c.req.header("Authorization");
  if (!header?.startsWith("Bearer ")) throw unauthorized();

  let claims: TokenClaims;
  try {
    claims = await verifyToken(header.slice("Bearer ".length));
  } catch {
    throw unauthorized();
  }
  if (claims.purpose) throw unauthorized();

  const user = await prisma.user.findUnique({
    where: { id: claims.sub },
    include: { company: { select: { status: true } } },
  });
  if (!user || user.deletedAt || !user.encryptedPassword) throw unauthorized();
  if (user.bannedUntil && user.bannedUntil > new Date()) throw unauthorized();
  if (issuedBefore(claims, user.tokensValidAfter)) throw unauthorized();
  if (user.company.status === "suspended") throw suspended();

  const { company: _, ...plain } = user;
  c.set("user", plain);
  c.set("companyId", user.companyId);
  await next();
});

/** Owners and managers run the team; everyone else gets 403. */
export const requireManager = createMiddleware<AppEnv>(async (c, next) => {
  const member = await prisma.teamMember.findUnique({ where: { userId: c.get("user").id } });
  if (!member || (member.role !== "owner" && member.role !== "manager")) {
    throw new HTTPException(403, { message: "Only the owner or a manager can do that." });
  }
  await next();
});
