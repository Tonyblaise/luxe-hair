import "server-only";
import type { AppType } from "@luxe-hair/api";
import { hc } from "hono/client";
import { cookies } from "next/headers";
import { unwrap, type AnyResponse, type SuccessBodyOf } from "./api";

/** Platform-admin session; separate from the salon `lh_token` cookie. */
export const ADMIN_COOKIE = "lh_admin";
const SEVEN_DAYS_SECONDS = 7 * 24 * 60 * 60;
const API_URL = process.env.API_URL ?? "http://localhost:4000";

export async function getAdminToken() {
  return (await cookies()).get(ADMIN_COOKIE)?.value;
}

export async function setAdminToken(token: string) {
  (await cookies()).set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SEVEN_DAYS_SECONDS,
  });
}

export async function clearAdminToken() {
  (await cookies()).delete(ADMIN_COOKIE);
}

export async function adminApi() {
  const token = await getAdminToken();
  return hc<AppType>(API_URL, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    init: { cache: "no-store" },
  }).platform;
}

export const adminUnwrap = <R extends AnyResponse>(res: R) => unwrap(res, "/admin/logout");

export async function adminUnwrapAll<T extends readonly Promise<AnyResponse>[]>(
  ...requests: T
): Promise<{ -readonly [K in keyof T]: SuccessBodyOf<Awaited<T[K]>> }> {
  const responses = await Promise.all(requests);
  const bodies: unknown[] = [];
  for (const res of responses) bodies.push(await adminUnwrap(res));
  return bodies as { -readonly [K in keyof T]: SuccessBodyOf<Awaited<T[K]>> };
}
