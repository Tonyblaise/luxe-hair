import { initials } from "@luxe-hair/shared";

type Tone = "light" | "navy" | "cyan" | "invited" | "muted" | "dashed";

const tones: Record<Tone, string> = {
  light: "bg-cyan-100 text-navy-800",
  navy: "bg-navy-800 text-white",
  cyan: "bg-cyan-400 text-navy-800",
  invited: "border border-dashed border-gray-400 bg-gray-100 text-gray-500",
  muted: "bg-gray-100 text-navy-800",
  dashed: "border border-dashed border-gray-400 bg-white text-navy-800",
};

export function Avatar({
  name,
  size = 40,
  tone = "light",
  square = false,
  className = "",
}: {
  name: string;
  size?: number;
  tone?: Tone;
  square?: boolean;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
      className={`inline-grid shrink-0 place-items-center font-semibold ${square ? "rounded-md" : "rounded-full"} ${tones[tone]} ${className}`}
    >
      {initials(name)}
    </span>
  );
}
