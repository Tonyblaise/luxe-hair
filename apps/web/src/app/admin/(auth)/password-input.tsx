"use client";

import { useState } from "react";
import { inputClass } from "@/components/ui";

/** Password input with a Show/Hide toggle inside the field. */
export function PasswordInput({
  id,
  name,
  autoComplete,
  value,
  onChange,
}: {
  id?: string;
  name: string;
  autoComplete: string;
  value?: string;
  onChange?: (value: string) => void;
}) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative block">
      <input
        id={id}
        name={name}
        type={show ? "text" : "password"}
        autoComplete={autoComplete}
        required
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        className={`${inputClass} pr-16`}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute top-1 right-1.5 h-9 rounded-md px-2.5 text-[13px] font-semibold text-navy-800 transition-ui hover:bg-paper"
      >
        {show ? "Hide" : "Show"}
      </button>
    </span>
  );
}
