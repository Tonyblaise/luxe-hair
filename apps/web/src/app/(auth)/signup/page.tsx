"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button, Field, FormError } from "@/components/ui";
import { signupAction } from "../actions";

export default function SignupPage() {
  const [state, action, pending] = useActionState(signupAction, undefined);

  return (
    <form action={action} className="space-y-4">
      <h1 className="text-[22px] leading-tight font-semibold">Create your salon</h1>
      <FormError message={state?.error} />
      <Field label="Salon name" name="companyName" required />
      <div className="grid grid-cols-2 gap-3">
        <Field label="First name" name="firstName" autoComplete="given-name" required />
        <Field label="Last name" name="lastName" autoComplete="family-name" required />
      </div>
      <Field label="Email" name="email" type="email" autoComplete="email" required />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
      />
      <Button type="submit" disabled={pending} size="lg" className="w-full">
        {pending ? "Creating…" : "Create account"}
      </Button>
      <p className="text-center text-sm text-gray-600">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-cyan-600 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
