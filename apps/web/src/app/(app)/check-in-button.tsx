"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { useActionFeedback } from "@/components/ui/toast";
import { checkIn } from "./actions";

export function CheckInButton({ id, client }: { id: string; client: string }) {
  const [state, action, pending] = useActionState(checkIn.bind(null, id, client), undefined);
  useActionFeedback(state);
  return (
    <form action={action}>
      <Button type="submit" variant="outline" disabled={pending} className="border-navy-800">
        Check In
      </Button>
    </form>
  );
}
