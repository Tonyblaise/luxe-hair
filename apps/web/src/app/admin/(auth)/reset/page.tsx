"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useActionState, useState } from "react";
import { Button, FormError } from "@/components/ui";
import { adminReset } from "../actions";
import { PasswordInput } from "../password-input";

export default function AdminResetPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}

function ResetForm() {
  const token = useSearchParams().get("token") ?? "";
  const [state, action, pending] = useActionState(adminReset.bind(null, token), undefined);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const mismatch = confirm.length > 0 && password !== confirm;

  return (
    <form action={action} className="flex flex-col gap-5">
      <div>
        <h1 className="text-[28px] leading-tight font-bold">Set a New Password</h1>
        <p className="mt-1 text-[15px] text-gray-600">At least 8 characters.</p>
      </div>
      <FormError message={state?.error} />
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-medium text-gray-600">New password</span>
        <PasswordInput name="password" autoComplete="new-password" value={password} onChange={setPassword} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-medium text-gray-600">Confirm password</span>
        <PasswordInput name="confirm" autoComplete="new-password" value={confirm} onChange={setConfirm} />
        {mismatch && <span className="text-[13px] text-[#b03a2e]">Passwords don&apos;t match.</span>}
      </label>
      <Button type="submit" size="lg" disabled={pending || password.length < 8 || password !== confirm}>
        {pending ? "Saving…" : "Save Password"}
      </Button>
      <Link href="/admin/login" className="self-start text-sm font-semibold text-cyan-600 hover:underline">
        ← Back to Sign In
      </Link>
    </form>
  );
}
