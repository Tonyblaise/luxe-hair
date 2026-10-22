"use client";

import { useActionState } from "react";
import { Button, type ButtonVariant } from "@/components/ui/button";
import { useActionFeedback } from "@/components/ui/toast";
import { payOut } from "./actions";

export function PayButton({
  employeeIds,
  confirmText,
  variant = "navy",
  className = "",
  children,
}: {
  employeeIds: string[] | null;
  confirmText: string;
  variant?: ButtonVariant;
  className?: string;
  children: React.ReactNode;
}) {
  const [state, action, pending] = useActionState(payOut.bind(null, employeeIds), undefined);
  useActionFeedback(state);
  return (
    <form action={action} onClick={(e) => e.stopPropagation()}>
      <Button
        type="submit"
        variant={variant}
        disabled={pending}
        className={className}
        onClick={(e) => {
          if (!confirm(confirmText)) e.preventDefault();
        }}
      >
        {pending ? "Paying…" : children}
      </Button>
      {state?.error && <p className="mt-1 text-xs text-[#b03a2e]">{state.error}</p>}
    </form>
  );
}
