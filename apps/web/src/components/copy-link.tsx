"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

/** Shows an invite or reset link with a copy button. */
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

/**
 * After an invite or reset: says it was emailed, with the link tucked behind "Copy link instead".
 * When the email didn't go out (no email service, or Resend refused it), shows the link to copy.
 */
export function SentLink({ emailed, email, url, note }: { emailed: boolean; email: string; url: string; note: string }) {
  if (!emailed) return <CopyLink url={url} note={note} />;
  return (
    <div className="flex flex-col gap-2 rounded-md bg-paper p-3.5">
      <p className="text-[13px] text-gray-700">
        Sent to <span className="font-medium">{email}</span>.
      </p>
      <details className="group">
        <summary className="cursor-pointer text-[13px] font-medium text-cyan-600 hover:underline">Copy link instead</summary>
        <div className="mt-2">
          <CopyLink url={url} note={note} />
        </div>
      </details>
    </div>
  );
}
