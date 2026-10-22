"use server";

import { loginSchema, signupSchema } from "@luxe-hair/shared";
import { redirect } from "next/navigation";
import { api } from "@/lib/api";
import { setToken } from "@/lib/session";

export type AuthFormState = { error?: string } | undefined;

async function finish(res: { ok: boolean; json(): Promise<unknown> }): Promise<AuthFormState> {
  const body = (await res.json().catch(() => ({}))) as { token?: string; error?: unknown };
  if (!res.ok || !body.token) {
    return { error: typeof body.error === "string" ? body.error : "Check the details and try again." };
  }
  await setToken(body.token);
  redirect("/");
}

export async function loginAction(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Enter a valid email and password." };
  const client = await api();
  return finish(await client.auth.login.$post({ json: parsed.data }));
}

export async function signupAction(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the details and try again." };
  }
  const client = await api();
  return finish(await client.auth.signup.$post({ json: parsed.data }));
}
