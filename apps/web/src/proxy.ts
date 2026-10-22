import { NextResponse, type NextRequest } from "next/server";

const TOKEN_COOKIE = "lh_token";
const ADMIN_COOKIE = "lh_admin";
// Signed-in users are sent home from these.
const AUTH_PAGES = ["/login", "/signup"];
const ADMIN_AUTH_PAGES = ["/admin/login"];
// Reachable with or without a session.
const OPEN_PAGES = ["/accept-invite", "/reset-password", "/admin/reset"];

const matches = (pathname: string, paths: string[]) =>
  paths.some((p) => pathname === p || pathname.startsWith(`${p}/`));

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const go = (path: string) => NextResponse.redirect(new URL(path, request.url));

  if (matches(pathname, OPEN_PAGES)) return NextResponse.next();

  // Platform admin console: its own cookie and sign-in page.
  if (matches(pathname, ["/admin"])) {
    const hasAdmin = request.cookies.has(ADMIN_COOKIE);
    if (matches(pathname, ADMIN_AUTH_PAGES)) return hasAdmin ? go("/admin") : NextResponse.next();
    return hasAdmin ? NextResponse.next() : go("/admin/login");
  }

  const hasToken = request.cookies.has(TOKEN_COOKIE);
  if (matches(pathname, AUTH_PAGES)) return hasToken ? go("/") : NextResponse.next();
  return hasToken ? NextResponse.next() : go("/login");
}

export const config = {
  matcher: ["/((?!_next/|favicon.ico|logout|admin/logout).*)"],
};
