"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

/** Shows an invite link with a copy button (there's no email service yet). */
export function CopyLink({ url, note }: { url: string; note: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex flex-col gap-2 rounded-md bg-paper p-3.5">
      <p className="text-[13px] text-gray-600">{note}</p>
      <div className="flex gap-2">
        <input
          readOnly
          value={url}
          aria-label="Invite link"
          onFocus={(e) => e.target.select()}
          className="h-10 min-w-0 flex-1 rounded-md border border-gray-300 bg-white px-3 text-[13px] text-gray-700"
        />
        <Button
          variant="navy"
          className="h-10!"
          onClick={async () => {
            await navigator.clipboard.writeText(url);
            setCopied(true);
          }}
        >
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
    </div>
  );
}
