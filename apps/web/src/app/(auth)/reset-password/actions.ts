"use server";

import { salonResetPasswordSchema } from "@luxe-hair/shared";
import { redirect } from "next/navigation";
import { fail, firstIssue, type ActionState } from "@/lib/action";
import { api } from "@/lib/api";
import { setToken } from "@/lib/session";

export async function resetPassword(token: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const password = String(formData.get("password") ?? "");
  if (password !== formData.get("confirm")) return fail("The passwords don't match.");
  const parsed = salonResetPasswordSchema.safeParse({ token, password });
  if (!parsed.success) return fail(firstIssue(parsed.error));

  const client = await api();
  const res = await client.auth["reset-password"].$post({ json: parsed.data });
  const body = (await res.json().catch(() => ({}))) as { token?: string; error?: string };
  if (!res.ok || !body.token) return fail(body.error ?? "This reset link is invalid or has expired.");
  await setToken(body.token);
  redirect("/");
}
