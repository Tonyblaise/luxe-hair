"use client";

import { useActionState, useState } from "react";
import { Button, Field, FormError, useActionFeedback } from "@/components/ui";
import { updateAccount } from "./actions";

type Details = { firstName: string; lastName: string; phone: string; email: string };

export function DetailsForm({ initial, roleLabel }: { initial: Details; roleLabel: string }) {
  const [state, action, pending] = useActionState(updateAccount, undefined);
  const [values, setValues] = useState(initial);
  const [saved, setSaved] = useState(initial);
  useActionFeedback(state, () => setSaved(values));

  const dirty = (Object.keys(values) as (keyof Details)[]).some((k) => values[k] !== saved[k]);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email);
  const set = (k: keyof Details) => (e: React.ChangeEvent<HTMLInputElement>) => setValues({ ...values, [k]: e.target.value });

  return (
    <form action={action} className="flex flex-col gap-4">
      <FormError message={state?.error} />
      <div className="grid grid-cols-2 gap-4">
        <Field label="First name" name="firstName" required value={values.firstName} onChange={set("firstName")} />
        <Field label="Last name" name="lastName" required value={values.lastName} onChange={set("lastName")} />
      </div>
      <Field label="Phone" name="phone" type="tel" value={values.phone} onChange={set("phone")} />
      <Field
        label="Email"
        name="email"
        type="email"
        required
        value={values.email}
        onChange={set("email")}
        hint={!emailValid && values.email ? "Enter a valid email address." : undefined}
      />
      <Field label="Role" value={roleLabel} disabled hint="Roles are managed by the salon owner." />
      <div className="flex justify-end gap-3">
        <Button variant="outline" size="lg" disabled={!dirty || pending} onClick={() => setValues(saved)}>
          Discard
        </Button>
        <Button type="submit" size="lg" disabled={!dirty || !emailValid || pending}>
          {pending ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
