import Link from "next/link";
import type { ComponentProps } from "react";

export type ButtonVariant = "primary" | "navy" | "outline" | "ghost";
type Size = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-md font-semibold whitespace-nowrap transition-ui active:scale-[.98] disabled:cursor-not-allowed disabled:active:scale-100";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-cyan-400 text-white hover:bg-cyan-500 active:bg-cyan-600 disabled:bg-gray-300 px-[clamp(12px,3vw,20px)] text-[15px]",
  navy: "bg-navy-800 text-white hover:bg-navy-700 disabled:bg-gray-300 px-3.5 text-sm",
  outline: "border border-gray-300 bg-white text-navy-800 hover:bg-paper disabled:text-gray-400 px-3.5 text-sm",
  ghost: "px-2.5 text-[13px] font-medium text-gray-500 hover:bg-paper hover:text-navy-800",
};

const heights: Record<ButtonVariant, Record<Size, string>> = {
  primary: { md: "h-11", lg: "h-12" },
  navy: { md: "h-9 max-sm:h-11", lg: "h-11" },
  outline: { md: "h-9 max-sm:h-11", lg: "h-12" },
  ghost: { md: "h-8", lg: "h-10" },
};

export function buttonClass(variant: ButtonVariant = "primary", size: Size = "md", className = "") {
  return `${base} ${variants[variant]} ${heights[variant][size]} ${className}`;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  ...props
}: ComponentProps<"button"> & { variant?: ButtonVariant; size?: Size }) {
  return <button type={type} className={buttonClass(variant, size, className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: ButtonVariant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}
