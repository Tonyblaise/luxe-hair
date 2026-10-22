"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useId } from "react";

export function useCloseModal() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  return useCallback(() => {
    const next = new URLSearchParams(params);
    next.delete("modal");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [router, pathname, params]);
}

/** Opens the modal with this id by adding ?modal=<id>, keeping other params. */
export function ModalLink({ id, ...props }: Omit<React.ComponentProps<typeof Link>, "href"> & { id: string }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const next = new URLSearchParams(params);
  next.set("modal", id);
  return <Link scroll={false} href={`${pathname}?${next}`} {...props} />;
}

/** Centred dialog from 640px up, bottom sheet below. Open while ?modal=<id>. */
export function Modal({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  const open = useSearchParams().get("modal") === id;
  const close = useCloseModal();
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  if (!open) return null;

  return (
    <>
      <div aria-hidden className="fixed inset-0 z-[35] bg-[rgba(15,23,42,.4)]" onClick={close} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="fixed z-[36] flex flex-col gap-4 overflow-y-auto bg-white shadow-xl max-sm:inset-x-0 max-sm:bottom-0 max-sm:max-h-[92vh] max-sm:rounded-t-xl max-sm:px-4 max-sm:pt-5 max-sm:pb-[calc(24px+env(safe-area-inset-bottom))] sm:top-1/2 sm:left-1/2 sm:max-h-[calc(100vh-32px)] sm:w-[min(520px,calc(100%-32px))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-lg sm:p-8"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id={titleId} className="pt-2 text-[22px] leading-tight font-semibold">
            {title}
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="-mr-2 grid size-11 shrink-0 place-items-center rounded-md text-2xl text-gray-500 transition-ui hover:bg-paper hover:text-navy-800"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </>
  );
}
