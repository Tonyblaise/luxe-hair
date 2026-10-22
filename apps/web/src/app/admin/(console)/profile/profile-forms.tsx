"use client";

import { useActionState, useState } from "react";
import { Avatar, Button, Card, CardHeader, Field, FormError, useActionFeedback } from "@/components/ui";
import { changeAdminPassword, updateProfile } from "./actions";

type Details = { name: string; email: string; phone: string };

export function DetailsCard({ initial }: { initial: Details }) {
  const [state, action, pending] = useActionState(updateProfile, undefined);
  const [values, setValues] = useState(initial);
  const [saved, setSaved] = useState(initial);
  useActionFeedback(state, () => setSaved(values));

  const dirty = (Object.keys(values) as (keyof Details)[]).some((k) => values[k] !== saved[k]);
  const valid = values.name.trim().length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email);
  const set = (k: keyof Details) => (e: React.ChangeEvent<HTMLInputElement>) => setValues({ ...values, [k]: e.target.value });

  return (
    <Card>
      <div className="flex items-center gap-3">
        <Avatar name={saved.name} size={52} tone="navy" />
        <div>
          <h2 className="text-[20px] leading-tight font-semibold">Your Details</h2>
          <p className="text-sm text-gray-600">Platform Admin</p>
        </div>
      </div>
      <form action={action} className="flex flex-col gap-4">
        <FormError message={state?.error} />
        <Field label="Full name" name="name" required value={values.name} onChange={set("name")} />
        <Field label="Email" name="email" type="email" required value={values.email} onChange={set("email")} />
        <Field label="Phone" name="phone" type="tel" value={values.phone} onChange={set("phone")} />
        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={!dirty || !valid || pending}>
            {pending ? "Saving…" : "Save Details"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

export function PasswordCard() {
  const [state, action, pending] = useActionState(changeAdminPassword, undefined);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  useActionFeedback(state, () => {
    setCurrent("");
    setNext("");
    setConfirm("");
  });

  const mismatch = confirm.length > 0 && next !== confirm;
  const ready = current.length > 0 && next.length >= 8 && next === confirm;

  return (
    <Card>
      <div className="flex flex-col gap-1">
        <CardHeader title="Change Password" />
        <p className="text-sm text-gray-600">At least 8 characters.</p>
      </div>
      <form action={action} className="flex flex-col gap-4">
        <FormError message={state?.error} />
        <Field label="Current password" name="currentPassword" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
        <Field label="New password" name="newPassword" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
        <Field
          label="Confirm new password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          hint={mismatch ? "Passwords don't match." : undefined}
        />
        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={!ready || pending}>
            {pending ? "Updating…" : "Update Password"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
