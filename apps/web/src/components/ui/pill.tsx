import Link from "next/link";
import type { ComponentProps } from "react";

const pillClass = (active: boolean) =>
  `inline-flex h-9 items-center rounded-full border px-3.5 text-[13px] font-medium whitespace-nowrap transition-ui ${
    active ? "border-navy-800 bg-navy-800 text-white" : "border-gray-300 bg-white text-navy-800 hover:bg-paper"
  }`;

export function PillRow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`flex flex-wrap gap-2 ${className}`}>{children}</div>;
}

export function PillLink({
  active,
  className = "",
  ...props
}: ComponentProps<typeof Link> & { active: boolean }) {
  return (
    <Link
      scroll={false}
      aria-current={active ? "true" : undefined}
      className={`${pillClass(active)} ${className}`}
      {...props}
    />
  );
}

export function PillButton({
  active,
  className = "",
  type = "button",
  ...props
}: ComponentProps<"button"> & { active: boolean }) {
  return <button type={type} aria-pressed={active} className={`${pillClass(active)} ${className}`} {...props} />;
}
