"use client";

import { useRouter } from "next/navigation";
import { selectClass } from "@/components/ui";

export function RangeControls({ from, to, options }: { from: string; to: string; options: { value: string; label: string }[] }) {
  const router = useRouter();
  const go = (f: string, t: string) => router.push(`/reports?from=${f}&to=${t}`, { scroll: false });

  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="flex min-w-[150px] flex-col gap-1.5">
        <span className="text-[13px] font-medium text-gray-600">From</span>
        <select className={selectClass} value={from} onChange={(e) => go(e.target.value, e.target.value > to ? e.target.value : to)}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex min-w-[150px] flex-col gap-1.5">
        <span className="text-[13px] font-medium text-gray-600">To</span>
        <select className={selectClass} value={to} onChange={(e) => go(e.target.value < from ? e.target.value : from, e.target.value)}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
