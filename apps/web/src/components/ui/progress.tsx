export function ProgressBar({ value, max, tone = "cyan" }: { value: number; max: number; tone?: "cyan" | "navy" }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
      <div
        className={`h-full rounded-full ${tone === "navy" ? "bg-navy-800" : "bg-cyan-400"}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
