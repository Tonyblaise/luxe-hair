"use server";

import { accountUpdateSchema, changePasswordSchema } from "@luxe-hair/shared";
import { redirect } from "next/navigation";
import { fail, firstIssue, mutate, type ActionState } from "@/lib/action";
import { api, unwrap } from "@/lib/api";
import { clearToken, setToken } from "@/lib/session";

export async function updateAccount(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = accountUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const client = await api();
  return mutate(async () => unwrap(await client.auth.me.$patch({ json: parsed.data })), {
    toast: "Your details were saved",
  });
}

export async function changePassword(_: ActionState, formData: FormData): Promise<ActionState> {
  const newPassword = String(formData.get("newPassword") ?? "");
  if (newPassword !== formData.get("confirmPassword")) return fail("The new passwords don't match.");
  const parsed = changePasswordSchema.safeParse({ currentPassword: formData.get("currentPassword"), newPassword });
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const client = await api();
  return mutate(
    async () => {
      const { token } = await unwrap(await client.auth["change-password"].$post({ json: parsed.data }));
      // This device stays signed in with the fresh token; every older token is now rejected.
      await setToken(token);
    },
    { toast: "Password updated · other devices signed out" },
  );
}

export async function signOut() {
  await clearToken();
  redirect("/login");
}

export async function signOutEverywhere() {
  const client = await api();
  await client.auth["logout-all"].$post();
  await clearToken();
  redirect("/login");
}
