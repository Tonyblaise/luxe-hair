import { sign, verify } from "hono/jwt";
import { env } from "../env";

const DAY = 24 * 60 * 60;
const TOKEN_LIFETIME_SECONDS = 90 * DAY;
const PLATFORM_LIFETIME_SECONDS = 7 * DAY;
const RESET_LIFETIME_SECONDS = 60 * 60;

/** Salon sign-in tokens have no purpose; every other kind is single-purpose and rejected by requireAuth. */
export type TokenPurpose = "invite" | "reset" | "platform" | "admin-reset";

export type TokenClaims = {
  sub: string;
  company_id: string;
  role: string;
  iat: number;
  exp: number;
  purpose?: TokenPurpose;
};

const now = () => Math.floor(Date.now() / 1000);

function issue(sub: string, companyId: string, role: string, lifetime: number, purpose?: TokenPurpose) {
  const iat = now();
  const claims: TokenClaims = { sub, company_id: companyId, role, iat, exp: iat + lifetime, ...(purpose ? { purpose } : {}) };
  return sign(claims, env.jwtSecret, "HS256");
}

type SalonUser = { id: string; companyId: string; role: string };

export const issueToken = (u: SalonUser) => issue(u.id, u.companyId, u.role, TOKEN_LIFETIME_SECONDS);
export const issueInviteToken = (u: SalonUser, days = 7) => issue(u.id, u.companyId, u.role, days * DAY, "invite");
export const issueResetToken = (u: SalonUser) => issue(u.id, u.companyId, u.role, RESET_LIFETIME_SECONDS, "reset");
export const issuePlatformToken = (adminId: string) => issue(adminId, "", "platform_admin", PLATFORM_LIFETIME_SECONDS, "platform");
export const issueAdminResetToken = (adminId: string) => issue(adminId, "", "platform_admin", RESET_LIFETIME_SECONDS, "admin-reset");

export async function verifyToken(token: string) {
  return (await verify(token, env.jwtSecret, "HS256")) as TokenClaims;
}

/** Whole-second boundary after which older tokens (any purpose) are rejected. */
export const nextSecond = () => new Date(Math.ceil((Date.now() + 1) / 1000) * 1000);

export const issuedBefore = (claims: TokenClaims, validAfter: Date) =>
  claims.iat < Math.floor(validAfter.getTime() / 1000);

/** Waits until `boundary` so a token issued next is not already invalid. */
export const waitUntil = (boundary: Date) =>
  new Promise((r) => setTimeout(r, Math.max(0, boundary.getTime() - Date.now())));
