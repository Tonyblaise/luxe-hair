"use client";

import { INVITABLE_ROLES, TEAM_ROLE_LABELS } from "@luxe-hair/shared";
import { useActionState, useState } from "react";
import { SentLink } from "@/components/copy-link";
import { Button, Field, FormError, Modal, SelectField, useActionFeedback, useCloseModal } from "@/components/ui";
import { inviteMember } from "./actions";

const HINTS: Record<(typeof INVITABLE_ROLES)[number], string> = {
  manager: "Runs the salon day to day: sales, payouts, expenses, employees.",
  front_desk: "Logs sales, manages tasks and inventory.",
  accountant: "Views reports, expenses and payouts.",
};

export function InviteModal() {
  return (
    <Modal id="invite" title="Invite Team Member">
      <InviteForm />
    </Modal>
  );
}

function InviteForm() {
  const close = useCloseModal();
  const [state, action, pending] = useActionState(inviteMember, undefined);
  useActionFeedback(state);
  const [role, setRole] = useState<(typeof INVITABLE_ROLES)[number]>("front_desk");

  if (state?.ok && state.data?.url) {
    return (
      <div className="flex flex-col gap-4">
        <SentLink
          emailed={!!state.data.emailed}
          email={state.data.email ?? ""}
          url={state.data.url}
          note="Send them this link to set a password. It expires in 7 days."
        />
        <Button size="lg" onClick={close}>
          Done
        </Button>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <p className="text-sm text-gray-600">They&apos;ll get a link to set a password. Invites expire after 7 days.</p>
      <FormError message={state?.error} />
      <div className="grid grid-cols-2 gap-4">
        <Field label="First name" name="firstName" required autoComplete="off" />
        <Field label="Last name" name="lastName" required autoComplete="off" />
      </div>
      <Field label="Email" name="email" type="email" required autoComplete="off" />
      <SelectField
        label="Role"
        name="role"
        value={role}
        onChange={(e) => setRole(e.target.value as typeof role)}
        hint={HINTS[role]}
      >
        {INVITABLE_ROLES.map((r) => (
          <option key={r} value={r}>
            {TEAM_ROLE_LABELS[r]}
          </option>
        ))}
      </SelectField>
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Sending…" : "Send Invite"}
      </Button>
    </form>
  );
}
