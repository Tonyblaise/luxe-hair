import Link from "next/link";
import { api } from "@/lib/api";
import { ResetForm } from "./reset-form";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const token = (await searchParams).token ?? "";
  const client = await api();
  const res = token.length >= 10 ? await client.auth.reset.$get({ query: { token } }) : null;
  const info = res?.ok ? await res.json() : null;

  if (!info) {
    return (
      <div className="flex flex-col gap-3">
        <h1 className="text-[22px] leading-tight font-semibold">Link not valid</h1>
        <p className="text-sm text-gray-600">This reset link is invalid or has expired. Ask for a new one.</p>
        <Link href="/login" className="text-sm font-medium text-cyan-600 hover:underline">
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-[22px] leading-tight font-semibold">Set a new password</h1>
        <p className="mt-1 text-sm text-gray-600">
          Hi {info.firstName}, choose a new password for {info.email} at {info.company}. You&apos;ll be signed out
          everywhere else.
        </p>
      </div>
      <ResetForm token={token} />
    </div>
  );
}
