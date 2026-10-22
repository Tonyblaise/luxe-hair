import type { ComponentProps } from "react";

/** Input look without a width, for callers that size the control themselves. */
export const inputBase =
  "h-11 min-w-0 rounded-md border border-gray-300 bg-white text-[15px] text-navy-800 outline-none transition-ui placeholder:text-gray-400 focus:border-cyan-400 disabled:bg-gray-100 disabled:text-gray-500";

export const inputClass = `${inputBase} w-full px-3.5`;
export const selectClass = `${inputBase} w-full px-2.5`;

function Label({ label, hint, children, className = "" }: { label: string; hint?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <label className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      <span className="text-[13px] font-medium text-gray-600">{label}</span>
      {children}
      {hint && <span className="text-[13px] text-gray-500">{hint}</span>}
    </label>
  );
}

export function Field({
  label,
  hint,
  className = "",
  ...props
}: ComponentProps<"input"> & { label: string; hint?: React.ReactNode }) {
  return (
    <Label label={label} hint={hint} className={className}>
      <input className={inputClass} {...props} />
    </Label>
  );
}

export function SelectField({
  label,
  hint,
  className = "",
  children,
  ...props
}: ComponentProps<"select"> & { label: string; hint?: React.ReactNode }) {
  return (
    <Label label={label} hint={hint} className={className}>
      <select className={selectClass} {...props}>
        {children}
      </select>
    </Label>
  );
}

export function Checkbox({ label, className = "", ...props }: ComponentProps<"input"> & { label: string }) {
  return (
    <label className={`flex items-center gap-2.5 text-sm font-medium text-navy-800 ${className}`}>
      <input type="checkbox" className="size-[18px] accent-navy-800" {...props} />
      {label}
    </label>
  );
}

export function FormGrid({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4 ${className}`}>{children}</div>;
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-md bg-[#fdecea] px-3.5 py-2.5 text-sm font-medium text-[#b03a2e]">
      {message}
    </p>
  );
}

export function Notice({ children }: { children: React.ReactNode }) {
  return <p className="rounded-md bg-yellow-200/60 px-3.5 py-2.5 text-[13px] text-navy-800">{children}</p>;
}
