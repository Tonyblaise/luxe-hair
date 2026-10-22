"use server";

import { platformSettingsSchema, type PlatformSettingsInput } from "@luxe-hair/shared";
import { fail, firstIssue, mutate, type ActionState } from "@/lib/action";
import { adminApi, adminUnwrap } from "@/lib/admin";

export async function saveSettings(input: PlatformSettingsInput): Promise<ActionState> {
  const parsed = platformSettingsSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const client = await adminApi();
  return mutate(async () => adminUnwrap(await client.settings.$put({ json: parsed.data })), {
    toast: "Settings saved",
    revalidate: ["/admin"],
  });
}
