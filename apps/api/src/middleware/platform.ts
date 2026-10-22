import { prisma, type PlatformAdmin } from "@luxe-hair/db";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { issuedBefore, verifyToken, type TokenClaims } from "../lib/jwt";

export type PlatformEnv = { Variables: { admin: PlatformAdmin } };

const unauthorized = () => new HTTPException(401, { message: "Unauthorized" });

/** Accepts only platform-admin session tokens; salon tokens (and every other purpose) get 401. */
export const requirePlatformAdmin = createMiddleware<PlatformEnv>(async (c, next) => {
  const header = c.req.header("Authorization");
  if (!header?.startsWith("Bearer ")) throw unauthorized();
  let claims: TokenClaims;
  try {
    claims = await verifyToken(header.slice("Bearer ".length));
  } catch {
    throw unauthorized();
  }
  if (claims.purpose !== "platform") throw unauthorized();

  const admin = await prisma.platformAdmin.findUnique({ where: { id: claims.sub } });
  if (!admin || issuedBefore(claims, admin.tokensValidAfter)) throw unauthorized();
  c.set("admin", admin);
  await next();
});
