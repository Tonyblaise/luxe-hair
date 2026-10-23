import { getCloudflareContext } from "@opennextjs/cloudflare";
import { verify } from "hono/jwt";
import { SIGNUP_OPEN } from "@luxe-hair/shared";
import { NextResponse, type NextRequest } from "next/server";

const TOKEN_COOKIE = "lh_token";
const ADMIN_COOKIE = "lh_admin";
// Signed-in users are sent home from these.
const AUTH_PAGES = ["/login", "/signup", "/forgot-password"];
const ADMIN_AUTH_PAGES = ["/admin/login"];
// Reachable with or without a session.
const OPEN_PAGES = ["/welcome", "/accept-invite", "/reset-password", "/admin/reset"];

const matches = (pathname: string, paths: string[]) =>
  paths.some((p) => pathname === p || pathname.startsWith(`${p}/`));

/**
 * True only for a correctly signed, unexpired admin-console token. Salon tokens and forged or
 * stale cookies fail here, so no /admin page or action runs for them; the API still re-checks
 * every request, including revocation (tokens_valid_after).
 */
async function isAdminSession(token: string | undefined) {
  if (!token) return false;
  try {
    const { env } = await getCloudflareContext({ async: true });
    const claims = await verify(token, env.JWT_SECRET, "HS256");
    return claims.purpose === "platform";
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const go = (path: string) => NextResponse.redirect(new URL(path, request.url));

  if (matches(pathname, OPEN_PAGES)) return NextResponse.next();

  // Platform admin console: platform admins only, with their own cookie and sign-in page.
  if (matches(pathname, ["/admin"])) {
    const cookie = request.cookies.get(ADMIN_COOKIE)?.value;
    const isAdmin = await isAdminSession(cookie);
    if (matches(pathname, ADMIN_AUTH_PAGES)) return isAdmin ? go("/admin") : NextResponse.next();
    if (isAdmin) return NextResponse.next();
    const response = go("/admin/login");
    if (cookie) response.cookies.delete(ADMIN_COOKIE);
    return response;
  }

  if (!SIGNUP_OPEN && matches(pathname, ["/signup"])) return go("/login");

  const hasToken = request.cookies.has(TOKEN_COOKIE);
  // Home is the dashboard when signed in, the landing page otherwise.
  if (pathname === "/" && !hasToken) return NextResponse.rewrite(new URL("/welcome", request.url));
  if (matches(pathname, AUTH_PAGES)) return hasToken ? go("/") : NextResponse.next();
  return hasToken ? NextResponse.next() : go("/login");
}

export const config = {
  matcher: ["/((?!_next/|favicon.ico|logout|admin/logout).*)"],
};
