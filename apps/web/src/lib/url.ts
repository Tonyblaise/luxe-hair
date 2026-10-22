import "server-only";
import { headers } from "next/headers";

/** Absolute URL on this web app, for links people copy and send (invites, password resets). */
export async function appUrl(path: string) {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}${path}`;
}
