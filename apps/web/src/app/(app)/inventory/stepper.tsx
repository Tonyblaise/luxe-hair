"use client";

import { useOptimistic, useTransition } from "react";
import { useToast } from "@/components/ui/toast";
import { adjustStock } from "./actions";

export function Stepper({ id, name, onHand }: { id: string; name: string; onHand: number }) {
  const toast = useToast();
  const [, startTransition] = useTransition();
  const [count, setCount] = useOptimistic(onHand, (current, delta: number) => current + delta);

  const step = (delta: number) =>
    startTransition(async () => {
      setCount(delta);
      const result = await adjustStock(id, delta);
      if (result?.error) toast(result.error);
    });

  const button =
    "grid size-11 place-items-center rounded-md border border-gray-300 bg-white text-lg font-semibold transition-ui hover:bg-paper disabled:text-gray-300 sm:size-8 sm:text-base";

  return (
    <div className="flex items-center gap-2">
      <button type="button" aria-label={`One fewer ${name}`} disabled={count <= 0} onClick={() => step(-1)} className={button}>
        −
      </button>
      <span className="w-8 text-center text-[15px] font-semibold tabular-nums" aria-live="polite">
        {count}
      </span>
      <button type="button" aria-label={`One more ${name}`} onClick={() => step(1)} className={button}>
        +
      </button>
    </div>
  );
}
