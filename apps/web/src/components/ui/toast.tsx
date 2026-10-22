"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ActionState } from "@/lib/action";
import { CheckIcon } from "./icons";

const ToastContext = createContext<(message: string) => void>(() => {});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{ message: string; id: number } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  const show = useCallback((message: string) => setToast({ message, id: Date.now() }), []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
        {toast && (
          <div
            key={toast.id}
            className="flex items-center gap-2.5 rounded-md bg-navy-800 px-5 py-3.5 text-sm font-medium text-white shadow-lg"
          >
            <CheckIcon size={18} className="shrink-0 text-cyan-400" />
            {toast.message}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

/** Shows the action's toast once per result and runs onSuccess when it succeeded. */
export function useActionFeedback(state: ActionState, onSuccess?: () => void) {
  const toast = useToast();
  const handled = useRef<number | undefined>(undefined);
  const success = useRef(onSuccess);
  success.current = onSuccess;

  useEffect(() => {
    if (!state?.at || state.at === handled.current) return;
    handled.current = state.at;
    if (state.toast) toast(state.toast);
    if (state.ok) success.current?.();
  }, [state, toast]);
}
