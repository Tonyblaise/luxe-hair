import { TEAM_ROLE_LABELS } from "@luxe-hair/shared";
import Link from "next/link";
import { api } from "@/lib/api";
import { AcceptForm } from "./accept-form";

export default async function AcceptInvitePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const token = (await searchParams).token ?? "";
  const client = await api();
  const res = token.length >= 10 ? await client.auth.invite.$get({ query: { token } }) : null;
  const invite = res?.ok ? await res.json() : null;

  if (!invite) {
    return (
      <div className="flex flex-col gap-3">
        <h1 className="text-[22px] leading-tight font-semibold">Invite not valid</h1>
        <p className="text-sm text-gray-600">
          This invite link is invalid or has expired. Ask whoever invited you to send a new one.
        </p>
        <Link href="/login" className="text-sm font-medium text-cyan-600 hover:underline">
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-[22px] leading-tight font-semibold">Join {invite.company}</h1>
        <p className="mt-1 text-sm text-gray-600">
          Hi {invite.firstName}, you&apos;re joining as {TEAM_ROLE_LABELS[invite.role]} with {invite.email}. Set a
          password to finish.
        </p>
      </div>
      <AcceptForm token={token} />
    </div>
  );
}
