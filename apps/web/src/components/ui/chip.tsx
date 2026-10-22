export type ChipTone = "info" | "neutral" | "warn" | "outline";

const tones: Record<ChipTone, string> = {
  info: "bg-cyan-100 text-navy-800",
  neutral: "bg-gray-100 text-gray-600",
  warn: "bg-yellow-200 text-navy-800",
  outline: "border border-cyan-400 bg-white text-navy-800",
};

export function Chip({ tone = "info", children }: { tone?: ChipTone; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs leading-none font-semibold whitespace-nowrap ${tones[tone]}`}>
      {children}
    </span>
  );
}
