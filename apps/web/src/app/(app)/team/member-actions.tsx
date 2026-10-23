"use client";

import { useActionState } from "react";
import { SentLink } from "@/components/copy-link";
import { Button, useActionFeedback } from "@/components/ui";
import { removeMember, resendInvite } from "./actions";

/** Renders into the member row's grid: buttons in the last column, any new invite link across the full row. */
export function MemberActions({ id, name, invited }: { id: string; name: string; invited: boolean }) {
  const [resent, resend, resending] = useActionState(resendInvite.bind(null, id, name), undefined);
  const [removed, remove, removing] = useActionState(
    removeMember.bind(null, id, invited ? `Invite for ${name} revoked` : `${name} removed`),
    undefined,
  );
  useActionFeedback(resent);
  useActionFeedback(removed);
  const error = resent?.error ?? removed?.error;
  const compact = "max-sm:h-9! max-sm:px-3!";

  return (
    <>
      <div className="flex flex-col items-end gap-1">
        <div className="flex gap-2">
          {invited && (
            <form action={resend}>
              <Button type="submit" variant="navy" disabled={resending} className={compact}>
                Resend
              </Button>
            </form>
          )}
          <form action={remove}>
            <Button
              type="submit"
              variant="outline"
              disabled={removing}
              className={compact}
              onClick={(e) => {
                const question = invited ? `Revoke ${name}'s invite?` : `Remove ${name}? They'll be signed out everywhere.`;
                if (!confirm(question)) e.preventDefault();
              }}
            >
              {invited ? "Revoke" : "Remove"}
            </Button>
          </form>
        </div>
        {error && <p className="text-right text-xs text-[#b03a2e]">{error}</p>}
      </div>
      {resent?.ok && resent.data?.url && (
        <div className="col-span-3">
          <SentLink
            emailed={!!resent.data.emailed}
            email={resent.data.email ?? ""}
            url={resent.data.url}
            note="New link (older links no longer work):"
          />
        </div>
      )}
    </>
  );
}
