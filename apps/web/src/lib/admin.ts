import "server-only";
import { cookies } from "next/headers";
import { apiClient, unwrap, type AnyResponse, type SuccessBodyOf } from "./api";

/** Platform-admin session; separate from the salon `lh_token` cookie. */
export const ADMIN_COOKIE = "lh_admin";
const SEVEN_DAYS_SECONDS = 7 * 24 * 60 * 60;

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
  return apiClient(await getAdminToken()).platform;
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
