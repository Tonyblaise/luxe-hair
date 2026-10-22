"use server";

import { adminPasswordSchema, adminProfileSchema } from "@luxe-hair/shared";
import { fail, firstIssue, mutate, type ActionState } from "@/lib/action";
import { adminApi, adminUnwrap, setAdminToken } from "@/lib/admin";

export async function updateProfile(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = adminProfileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const client = await adminApi();
  return mutate(async () => adminUnwrap(await client.me.$patch({ json: parsed.data })), {
    toast: "Profile updated",
    revalidate: ["/admin"],
  });
}

export async function changeAdminPassword(_: ActionState, formData: FormData): Promise<ActionState> {
  const newPassword = String(formData.get("newPassword") ?? "");
  if (newPassword !== formData.get("confirmPassword")) return fail("Passwords don't match.");
  const parsed = adminPasswordSchema.safeParse({ currentPassword: formData.get("currentPassword"), newPassword });
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const client = await adminApi();
  return mutate(
    async () => {
      const { token } = await adminUnwrap(await client.me.password.$post({ json: parsed.data }));
      // Other admin sessions are signed out; this one continues with the fresh token.
      await setAdminToken(token);
    },
    { toast: "Password updated", revalidate: ["/admin"] },
  );
}
