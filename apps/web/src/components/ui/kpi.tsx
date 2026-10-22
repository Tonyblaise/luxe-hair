export function KpiGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-[clamp(12px,3vw,24px)]">
      {children}
    </div>
  );
}

export function KpiTile({ label, value, sub }: { label: string; value: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-lg bg-white p-[clamp(16px,4vw,24px)] shadow-sm">
      <p className="eyebrow text-gray-500">{label}</p>
      <p className="text-[clamp(20px,2.2vw,28px)] leading-[1.1] font-bold whitespace-nowrap tabular-nums">{value}</p>
      {sub && <p className="text-sm text-gray-600">{sub}</p>}
    </div>
  );
}

export function MiniKpi({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5 rounded-md bg-paper px-4 py-3">
      <p className="text-xs font-medium tracking-[0.04em] text-gray-500 uppercase">{label}</p>
      <p className="text-[clamp(18px,5vw,24px)] leading-[1.15] font-bold break-words tabular-nums sm:whitespace-nowrap">{value}</p>
    </div>
  );
}
