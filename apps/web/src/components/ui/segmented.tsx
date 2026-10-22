"use client";

import { useState } from "react";

type Option<T extends string> = { value: T; label: string };

export function Segmented<T extends string>({
  name,
  label,
  options,
  value,
  defaultValue,
  onChange,
}: {
  name?: string;
  label?: string;
  options: readonly Option<T>[];
  value?: T;
  defaultValue?: T;
  onChange?: (value: T) => void;
}) {
  const [inner, setInner] = useState<T | undefined>(defaultValue ?? options[0]?.value);
  const current = value ?? inner;

  return (
    <div role="radiogroup" aria-label={label} className="flex min-w-0 flex-col gap-1.5">
      {label && <span className="text-[13px] font-medium text-gray-600">{label}</span>}
      <div className="grid auto-cols-fr grid-flow-col gap-2">
        {options.map((o) => {
          const active = o.value === current;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => {
                setInner(o.value);
                onChange?.(o.value);
              }}
              className={`h-11 rounded-md text-sm font-semibold transition-ui ${
                active ? "border-2 border-cyan-400 bg-cyan-100" : "border border-gray-300 bg-white hover:bg-paper"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      {name && <input type="hidden" name={name} value={current ?? ""} />}
    </div>
  );
}
