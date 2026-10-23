"use client";

import { formatKES } from "@luxe-hair/shared";
import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";
import { SentLink } from "@/components/copy-link";
import { Button, Field, FormError, Modal, SelectField, useActionFeedback, useCloseModal } from "@/components/ui";
import { inviteCompany } from "./company-actions";

type Plan = { id: string; name: string; price: number; employeeLimit: number | null };

export function InviteCompanyModal({ plans, trialDays, inviteDays }: { plans: Plan[]; trialDays: number; inviteDays: number }) {
  return (
    <Modal id="invite-company" title="Invite Company">
      <InviteForm plans={plans} trialDays={trialDays} inviteDays={inviteDays} />
    </Modal>
  );
}

function InviteForm({ plans, trialDays, inviteDays }: { plans: Plan[]; trialDays: number; inviteDays: number }) {
  const router = useRouter();
  const close = useCloseModal();
  const [state, action, pending] = useActionState(inviteCompany, undefined);
  useActionFeedback(state);
  const [name, setName] = useState("");
  const [owner, setOwner] = useState("");
  const [email, setEmail] = useState("");
  const [planId, setPlanId] = useState(plans[0]?.id ?? "");

  const plan = plans.find((p) => p.id === planId);
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const ready = name.trim() && owner.trim() && validEmail && plan;

  if (state?.ok && state.data?.url) {
    return (
      <div className="flex flex-col gap-4">
        <SentLink
          emailed={!!state.data.emailed}
          email={email}
          url={state.data.url}
          note={`Send this to ${owner} at ${email}. It expires in ${inviteDays} days.`}
        />
        <Button size="lg" onClick={() => router.replace("/admin", { scroll: false })}>
          Done
        </Button>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-5">
      <p className="text-sm text-gray-600">
        The owner gets a link to set up their salon account. Invites expire after {inviteDays} days.
      </p>
      <FormError message={state?.error} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Company name" name="name" required placeholder="e.g. Halo Beauty Lounge" value={name} onChange={(e) => setName(e.target.value)} />
        <Field label="City" name="city" placeholder="e.g. Nairobi" />
        <Field label="Owner name" name="ownerName" required placeholder="e.g. Wanjiku Kamau" value={owner} onChange={(e) => setOwner(e.target.value)} />
        <SelectField label="Plan" name="planId" value={planId} onChange={(e) => setPlanId(e.target.value)}>
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </SelectField>
        <Field
          label="Owner email"
          name="ownerEmail"
          type="email"
          required
          placeholder="owner@company.co.ke"
          className="sm:col-span-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          hint={email && !validEmail ? "Enter a valid email address." : undefined}
        />
      </div>
      {plan && (
        <p className="rounded-md bg-paper px-3.5 py-2.5 text-[13px] text-gray-600">
          {plan.name}: {formatKES(plan.price)} / month,{" "}
          {plan.employeeLimit ? `up to ${plan.employeeLimit} employees` : "unlimited employees"}. New companies start with a{" "}
          {trialDays}-day trial.
        </p>
      )}
      <div className="flex justify-end gap-3">
        <Button variant="outline" size="lg" onClick={close}>
          Cancel
        </Button>
        <Button type="submit" size="lg" disabled={pending || !ready}>
          {pending ? "Sending…" : "Send Invite"}
        </Button>
      </div>
    </form>
  );
}
