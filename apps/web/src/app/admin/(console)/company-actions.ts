"use server";

import { companyInviteSchema } from "@luxe-hair/shared";
import { fail, firstIssue, mutate, type ActionState } from "@/lib/action";
import { adminApi, adminUnwrap } from "@/lib/admin";
import { appUrl } from "@/lib/url";

const inviteLink = (token: string) => appUrl(`/accept-invite?token=${encodeURIComponent(token)}`);
const resetLink = (token: string) => appUrl(`/reset-password?token=${encodeURIComponent(token)}`);

export async function inviteCompany(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = companyInviteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const client = await adminApi();
  let url = "";
  const result = await mutate(
    async () => {
      url = await inviteLink((await adminUnwrap(await client.companies.$post({ json: parsed.data }))).token);
    },
    { toast: `Invite sent to ${parsed.data.ownerName} at ${parsed.data.ownerEmail}`, revalidate: ["/admin"] },
  );
  return result?.ok ? { ...result, data: { url } } : result;
}

export async function changePlan(id: string, planId: string, planName: string, companyName: string): Promise<ActionState> {
  const client = await adminApi();
  return mutate(
    async () => adminUnwrap(await client.companies[":id"].$patch({ param: { id }, json: { planId } })),
    { toast: `${companyName} moved to ${planName}`, revalidate: ["/admin"] },
  );
}

type CompanyAction = "resend" | "revoke" | "suspend" | "reactivate" | "reset-owner-password" | "delete";

export async function companyAction(id: string, action: CompanyAction, name: string, email: string): Promise<ActionState> {
  const client = await adminApi();
  const c = client.companies[":id"];
  const param = { param: { id } };
  let url = "";
  const result = await mutate(
    async () => {
      switch (action) {
        case "resend":
          url = await inviteLink((await adminUnwrap(await c.resend.$post(param))).token);
          return;
        case "reset-owner-password":
          url = await resetLink((await adminUnwrap(await c["reset-owner-password"].$post(param))).token);
          return;
        case "revoke":
          return adminUnwrap(await c.revoke.$post(param));
        case "suspend":
          return adminUnwrap(await c.suspend.$post(param));
        case "reactivate":
          return adminUnwrap(await c.reactivate.$post(param));
        case "delete":
          return adminUnwrap(await c.$delete(param));
      }
    },
    {
      toast: {
        resend: `Invite resent to ${email}`,
        "reset-owner-password": `Reset link ready for ${email}`,
        revoke: `Invite to ${name} revoked`,
        suspend: `${name} suspended`,
        reactivate: `${name} reactivated`,
        delete: `${name} deleted`,
      }[action],
      revalidate: ["/admin"],
    },
  );
  return result?.ok && url ? { ...result, data: { url } } : result;
}
