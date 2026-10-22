"use server";

import { emailOnlySchema, loginSchema, resetPasswordSchema } from "@luxe-hair/shared";
import { redirect } from "next/navigation";
import { fail, type ActionState } from "@/lib/action";
import { adminApi, setAdminToken } from "@/lib/admin";

const firstName = (name: string) => name.split(/\s+/)[0] ?? name;

export async function adminLogin(_: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "");
  if (!emailOnlySchema.safeParse({ email }).success) return fail("Enter a valid email address.");
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail("Incorrect email or password.");

  const client = await adminApi();
  const res = await client.auth.login.$post({ json: parsed.data });
  const body = (await res.json().catch(() => ({}))) as { token?: string; name?: string; error?: string };
  if (!res.ok || !body.token) return fail(body.error ?? "Incorrect email or password.");
  await setAdminToken(body.token);
  redirect(`/admin?welcome=${encodeURIComponent(firstName(body.name ?? ""))}`);
}

export async function adminForgot(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = emailOnlySchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return fail("Enter a valid email address.");
  const client = await adminApi();
  await client.auth.forgot.$post({ json: parsed.data });
  return { ok: true, data: { email: parsed.data.email }, at: Date.now() };
}

export async function adminReset(token: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const password = String(formData.get("password") ?? "");
  if (password !== formData.get("confirm")) return fail("Passwords don't match.");
  const parsed = resetPasswordSchema.safeParse({ token, password });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "At least 8 characters.");
  const client = await adminApi();
  const res = await client.auth.reset.$post({ json: parsed.data });
  const body = (await res.json().catch(() => ({}))) as { token?: string; name?: string; error?: string };
  if (!res.ok || !body.token) return fail(body.error ?? "This reset link is invalid or has expired.");
  await setAdminToken(body.token);
  redirect(`/admin?welcome=${encodeURIComponent(firstName(body.name ?? ""))}`);
}
