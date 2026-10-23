"use client";

import { SIGNUP_OPEN } from "@luxe-hair/shared";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useActionState } from "react";
import { Button, Field, FormError, Notice, inputClass } from "@/components/ui";
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
        <Notice>This salon&apos;s account is suspended. Contact Luxe Hair support to restore access.</Notice>
      )}
      <FormError message={state?.error} />
      <Field label="Email" name="email" type="email" autoComplete="email" required />
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="login-password" className="text-[13px] font-medium text-gray-600">
            Password
          </label>
          <Link href="/forgot-password" className="text-[13px] font-medium text-cyan-600 hover:underline">
            Forgot password?
          </Link>
        </div>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={inputClass}
        />
      </div>
      <Button type="submit" disabled={pending} size="lg" className="w-full">
        {pending ? "Signing in…" : "Sign in"}
      </Button>
      {SIGNUP_OPEN && (
        <p className="text-center text-sm text-gray-600">
          New salon?{" "}
          <Link href="/signup" className="font-medium text-cyan-600 hover:underline">
            Create an account
          </Link>
        </p>
      )}
    </form>
  );
}
