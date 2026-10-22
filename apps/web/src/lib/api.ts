import "server-only";
import type { AppType } from "@luxe-hair/api";
import { hc, type ClientResponse } from "hono/client";
import type { SuccessStatusCode } from "hono/utils/http-status";
import { redirect } from "next/navigation";
import { getToken } from "./session";

const API_URL = process.env.API_URL ?? "http://localhost:4000";

export async function api() {
  const token = await getToken();
  return hc<AppType>(API_URL, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    init: { cache: "no-store" },
  });
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

type IfSuccess<S, T> = S extends SuccessStatusCode ? T : never;
type SuccessBody<R> = R extends ClientResponse<infer T, infer S, string> ? IfSuccess<S, T> : never;

export type SuccessBodyOf<R> = SuccessBody<R>;

// Throws on non-2xx; a 401 means the token is dead, so drop it and go to sign-in.
export async function unwrap<R extends ClientResponse<unknown, number, string>>(
  res: R,
  signOutPath = "/logout",
): Promise<SuccessBody<R>> {
  if (res.status === 401) redirect(signOutPath);
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: unknown };
    const message = typeof body.error === "string" ? body.error : "Something went wrong";
    // A salon suspended from the admin console: sign out and explain on the sign-in page.
    if (res.status === 403 && /suspended/i.test(message)) redirect(`${signOutPath}?reason=suspended`);
    throw new ApiError(message, res.status);
  }
  return (await res.json()) as SuccessBody<R>;
}

export type AnyResponse = ClientResponse<unknown, number, string>;

/** Sends requests in parallel, then unwraps in order, so a 401 redirect never leaves a rejection unhandled. */
export async function unwrapAll<T extends readonly Promise<AnyResponse>[]>(
  ...requests: T
): Promise<{ -readonly [K in keyof T]: SuccessBody<Awaited<T[K]>> }> {
  const responses = await Promise.all(requests);
  const bodies: unknown[] = [];
  for (const res of responses) bodies.push(await unwrap(res));
  return bodies as { -readonly [K in keyof T]: SuccessBody<Awaited<T[K]>> };
}
