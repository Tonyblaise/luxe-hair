import "server-only";
import { cookies } from "next/headers";

export const TOKEN_COOKIE = "lh_token";
const NINETY_DAYS_SECONDS = 90 * 24 * 60 * 60;

export async function getToken() {
  return (await cookies()).get(TOKEN_COOKIE)?.value;
}

export async function setToken(token: string) {
  (await cookies()).set(TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: NINETY_DAYS_SECONDS,
  });
}

export async function clearToken() {
  (await cookies()).delete(TOKEN_COOKIE);
}
