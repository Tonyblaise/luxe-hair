"use client";

import { passwordRules } from "@luxe-hair/shared";
import { useActionState, useRef, useState } from "react";
import { PasswordRules } from "@/components/password-rules";
import { Button, Checkbox, Field, FormError, useActionFeedback } from "@/components/ui";
import { changePassword } from "./actions";

export function PasswordForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(changePassword, undefined);
  const [show, setShow] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  useActionFeedback(state, () => {
    setCurrent("");
    setNext("");
    setConfirm("");
  });

  const rules = passwordRules(next, confirm);
  const ready = current.length > 0 && rules.length && rules.number && rules.match;
  const type = show ? "text" : "password";

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-4">
      <FormError message={state?.error} />
      <Field label="Current password" name="currentPassword" type={type} autoComplete="current-password" required value={current} onChange={(e) => setCurrent(e.target.value)} />
      <Field label="New password" name="newPassword" type={type} autoComplete="new-password" required value={next} onChange={(e) => setNext(e.target.value)} />
      <Field label="Confirm new password" name="confirmPassword" type={type} autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      <Checkbox label="Show passwords" checked={show} onChange={(e) => setShow(e.target.checked)} />
      <PasswordRules password={next} confirm={confirm} />
      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={!ready || pending}>
          {pending ? "Updating…" : "Update Password"}
        </Button>
      </div>
    </form>
  );
}
