"use client";

import { useActionState } from "react";
import type { ActionState } from "@/lib/action";
import { Button } from "@/components/ui/button";
import { useActionFeedback } from "@/components/ui/toast";

/** Ghost "Delete" that confirms, runs a bound server action and toasts the result. */
export function DeleteButton({
  action,
  confirmText,
  label = "Delete",
}: {
  action: (state: ActionState) => Promise<ActionState>;
  confirmText: string;
  label?: string;
}) {
  const [state, run, pending] = useActionState(action, undefined);
  useActionFeedback(state);

  return (
    <form action={run} className="flex flex-col items-end">
      <Button
        type="submit"
        variant="ghost"
        disabled={pending}
        onClick={(e) => {
          if (!confirm(confirmText)) e.preventDefault();
        }}
      >
        {label}
      </Button>
      {state?.error && <span className="max-w-48 text-right text-xs text-[#b03a2e]">{state.error}</span>}
    </form>
  );
}
