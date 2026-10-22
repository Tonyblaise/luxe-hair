"use server";

import { inviteSchema } from "@luxe-hair/shared";
import { fail, firstIssue, mutate, type ActionState } from "@/lib/action";
import { api, unwrap } from "@/lib/api";
import { appUrl } from "@/lib/url";

const inviteUrl = (token: string) => appUrl(`/accept-invite?token=${encodeURIComponent(token)}`);

export async function inviteMember(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = inviteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(firstIssue(parsed.error, "Enter a name, an email and a role."));
  const client = await api();
  let url = "";
  const result = await mutate(
    async () => {
      const { token } = await unwrap(await client.team.invite.$post({ json: parsed.data }));
      url = await inviteUrl(token);
    },
    { toast: `Invite created for ${parsed.data.email}` },
  );
  return result?.ok ? { ...result, data: { url } } : result;
}

export async function resendInvite(id: string, name: string, _: ActionState): Promise<ActionState> {
  const client = await api();
  let url = "";
  const result = await mutate(
    async () => {
      const { token } = await unwrap(await client.team[":id"].resend.$post({ param: { id } }));
      url = await inviteUrl(token);
    },
    { toast: `New invite link for ${name}` },
  );
  return result?.ok ? { ...result, data: { url } } : result;
}

export async function removeMember(id: string, toast: string, _: ActionState): Promise<ActionState> {
  const client = await api();
  return mutate(async () => unwrap(await client.team[":id"].$delete({ param: { id } })), { toast });
}
