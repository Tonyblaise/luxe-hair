export type CommissionRule = { commissionType: "percent" | "flat"; commission: number };

export const RETAIL_COMMISSION_PCT = 10;

/** What the employee earns for one service sold at `amount`. */
export function commissionFor(rule: CommissionRule, amount: number): number {
  return rule.commissionType === "percent" ? Math.round((amount * rule.commission) / 100) : rule.commission;
}

const kes = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

/** "KES 12,345" */
export const formatKES = (amount: number) => `KES ${kes.format(Math.round(amount))}`;

/** Chart ticks: "KES 950", "KES 40k", "KES 1.2M" */
export function formatKESShort(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 1_000_000) return `KES ${trim(amount / 1_000_000)}M`;
  if (abs >= 1_000) return `KES ${trim(amount / 1_000)}k`;
  return `KES ${Math.round(amount)}`;
}

const trim = (n: number) => (Math.abs(n) >= 10 ? Math.round(n).toString() : n.toFixed(1).replace(/\.0$/, ""));

/** "Ava Reyes" → "AR" */
export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
