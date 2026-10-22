"use client";

import { useEffect } from "react";
import { CopyLink } from "@/components/copy-link";
import { Button } from "@/components/ui/button";

/** Small dialog that hands over a link to send by hand (there's no email service yet). */
export function LinkDialog({ title, note, url, onClose }: { title: string; note: string; url: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      <div aria-hidden className="fixed inset-0 z-[40] bg-[rgba(15,23,42,.4)]" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="fixed z-[41] flex flex-col gap-4 bg-white shadow-xl max-sm:inset-x-0 max-sm:bottom-0 max-sm:rounded-t-xl max-sm:px-4 max-sm:pt-5 max-sm:pb-[calc(24px+env(safe-area-inset-bottom))] sm:top-1/2 sm:left-1/2 sm:w-[min(520px,calc(100%-32px))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-lg sm:p-8"
      >
        <h2 className="text-[22px] leading-tight font-semibold">{title}</h2>
        <CopyLink url={url} note={note} />
        <Button size="lg" onClick={onClose}>
          Done
        </Button>
      </div>
    </>
  );
}
