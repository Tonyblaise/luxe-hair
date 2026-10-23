"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button, Field, FormError } from "@/components/ui";
import { requestReset } from "./actions";

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(requestReset, undefined);
  const sent = state?.ok ? state.data?.email : undefined;

  return (
    <form action={action} className="space-y-4">
      <div>
        <h1 className="text-[22px] leading-tight font-semibold">Reset your password</h1>
        <p className="mt-1 text-sm text-gray-600">
          {sent
            ? `If an account exists for ${sent}, a reset link is on its way. It expires in 1 hour.`
            : "Enter your email and we'll send you a link to set a new password."}
        </p>
      </div>
      {!sent && (
        <>
          <FormError message={state?.error} />
          <Field label="Email" name="email" type="email" autoComplete="email" required autoFocus />
          <Button type="submit" disabled={pending} size="lg" className="w-full">
            {pending ? "Sending…" : "Send reset link"}
          </Button>
        </>
      )}
      <p className="text-center text-sm">
        <Link href="/login" className="font-medium text-cyan-600 hover:underline">
          ← Back to sign in
        </Link>
      </p>
    </form>
  );
}
