"use client";

import { useActionState, useState } from "react";
import { PasswordRules } from "@/components/password-rules";
import { Button, Field, FormError } from "@/components/ui";
import { acceptInvite } from "./actions";

export function AcceptForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(acceptInvite.bind(null, token), undefined);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  return (
    <form action={action} className="flex flex-col gap-4">
      <FormError message={state?.error} />
      <Field
        label="New password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Field
        label="Confirm password"
        name="confirm"
        type="password"
        autoComplete="new-password"
        required
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
      />
      <PasswordRules password={password} confirm={confirm} />
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? "Joining…" : "Set Password & Join"}
      </Button>
    </form>
  );
}
