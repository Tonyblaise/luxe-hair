"use server";

import { emailOnlySchema } from "@luxe-hair/shared";
import { fail, type ActionState } from "@/lib/action";
import { api } from "@/lib/api";

export async function requestReset(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = emailOnlySchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return fail("Enter a valid email address.");
  const client = await api();
  const res = await client.auth.forgot.$post({ json: parsed.data });
  // The API answers the same whether or not the account exists; anything else is a real failure.
  if (!res.ok) return fail("We couldn't send the link. Try again in a moment.");
  return { ok: true, data: { email: parsed.data.email }, at: Date.now() };
}
