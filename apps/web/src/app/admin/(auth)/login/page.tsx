"use client";

import { useActionState, useState } from "react";
import { Button, inputClass } from "@/components/ui";
import { adminForgot, adminLogin } from "../actions";
import { PasswordInput } from "../password-input";

function ErrorBox({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-md border border-gray-300 bg-white px-3.5 py-3 text-sm text-navy-800">
      {message}
    </p>
  );
}

export default function AdminLoginPage() {
  const [view, setView] = useState<"signin" | "forgot">("signin");
  return view === "signin" ? <SignIn onForgot={() => setView("forgot")} /> : <Forgot onBack={() => setView("signin")} />;
}

function SignIn({ onForgot }: { onForgot: () => void }) {
  const [state, action, pending] = useActionState(adminLogin, undefined);
  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <div>
        <h1 className="text-[28px] leading-tight font-bold">Sign In</h1>
        <p className="mt-1 text-[15px] text-gray-600">Use your platform admin account.</p>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-medium text-gray-600">Email</span>
        <input name="email" type="email" autoComplete="email" placeholder="admin@salonmanager.co.ke" className={inputClass} />
      </label>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="admin-password" className="text-[13px] font-medium text-gray-600">
            Password
          </label>
          <button type="button" onClick={onForgot} className="text-[13px] font-semibold text-cyan-600 hover:underline">
            Forgot password?
          </button>
        </div>
        <PasswordInput id="admin-password" name="password" autoComplete="current-password" />
      </div>
      <ErrorBox message={state?.error} />
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Signing in…" : "Sign In"}
      </Button>
    </form>
  );
}

function Forgot({ onBack }: { onBack: () => void }) {
  const [state, action, pending] = useActionState(adminForgot, undefined);
  const sent = state?.ok ? state.data?.email : undefined;
  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <div>
        <h1 className="text-[28px] leading-tight font-bold">Reset Password</h1>
        <p className="mt-1 text-[15px] text-gray-600">
          {sent
            ? `If an account exists for ${sent}, a reset link is on its way. It expires in 1 hour.`
            : "Enter your email and we'll send you a link to set a new password."}
        </p>
      </div>
      {!sent && (
        <>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-gray-600">Email</span>
            <input name="email" type="email" autoComplete="email" placeholder="admin@salonmanager.co.ke" className={inputClass} />
          </label>
          <ErrorBox message={state?.error} />
          <Button type="submit" size="lg" disabled={pending}>
            {pending ? "Sending…" : "Send Reset Link"}
          </Button>
        </>
      )}
      <button type="button" onClick={onBack} className="self-start text-sm font-semibold text-cyan-600 hover:underline">
        ← Back to Sign In
      </button>
    </form>
  );
}
