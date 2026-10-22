"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useActionState } from "react";
import { Button, Field, FormError, Notice } from "@/components/ui";
import { loginAction } from "../actions";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, undefined);
  const suspended = useSearchParams().get("reason") === "suspended";

  return (
    <form action={action} className="space-y-4">
      <h1 className="text-[22px] leading-tight font-semibold">Sign in</h1>
      {suspended && !state?.error && (
        <Notice>This salon&apos;s account is suspended. Contact Salon Manager support to restore access.</Notice>
      )}
      <FormError message={state?.error} />
      <Field label="Email" name="email" type="email" autoComplete="email" required />
      <Field label="Password" name="password" type="password" autoComplete="current-password" required />
      <Button type="submit" disabled={pending} size="lg" className="w-full">
        {pending ? "Signing in…" : "Sign in"}
      </Button>
      <p className="text-center text-sm text-gray-600">
        New salon?{" "}
        <Link href="/signup" className="font-medium text-cyan-600 hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
