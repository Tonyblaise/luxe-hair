"use client";

import {
  CATEGORY_LABELS,
  EXPENSE_CATEGORIES,
  formatMonthShort,
  formatMonthYear,
  parseMonthKey,
  type ExpenseCategory,
} from "@luxe-hair/shared";
import { useState } from "react";
import { Card, CardHeader, ProgressBar } from "@/components/ui";
import { formatKES, formatKESShort } from "@/lib/format";

export type MonthView = {
  month: string;
  partial: boolean;
  sales: number;
  appointments: number;
  expenses: number;
  categories: Record<ExpenseCategory, number>;
};

export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  rent_utilities: "var(--color-navy-800)",
  products_supplies: "var(--color-cyan-200)",
  payroll: "var(--color-cyan-400)",
  marketing: "var(--color-yellow-400)",
  equipment: "var(--color-gray-400)",
};

const PLOT_HEIGHT = 280;

/** Rounds up to 1, 2, 2.5 or 5 × 10^n so four gridlines land on round numbers. */
function niceMax(value: number) {
  if (value <= 0) return 1000;
  const step = value / 4;
  const pow = 10 ** Math.floor(Math.log10(step));
  const nice = [1, 2, 2.5, 5, 10].find((m) => m * pow >= step)! * pow;
  return nice * 4;
}

const pct = (n: number, max: number) => `${max > 0 ? (n / max) * 100 : 0}%`;
const margin = (m: { sales: number; expenses: number }) =>
  m.sales > 0 ? Math.round(((m.sales - m.expenses) / m.sales) * 100) : 0;

function Axis({ max }: { max: number }) {
  return (
    <div className="relative w-[52px] shrink-0" style={{ height: PLOT_HEIGHT }} aria-hidden>
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="absolute right-2 -translate-y-1/2 text-[11px] whitespace-nowrap text-gray-500 tabular-nums"
          style={{ bottom: `${(i / 4) * 100}%` }}
        >
          {formatKESShort((max / 4) * i)}
        </span>
      ))}
    </div>
  );
}

function Grid() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="absolute inset-x-0 border-t border-dashed border-gray-200" style={{ bottom: `${(i / 4) * 100}%` }} />
      ))}
      <div className="absolute inset-x-0 bottom-0 border-t border-gray-400" />
    </div>
  );
}

function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5 text-[13px] text-gray-600">
          <span className="size-2.5 rounded-sm" style={{ background: i.color }} />
          {i.label}
        </span>
      ))}
    </div>
  );
}

export function ReportsView({ months }: { months: MonthView[] }) {
  const [selected, setSelected] = useState(months[months.length - 1]!.month);
  const current = months.find((m) => m.month === selected) ?? months[months.length - 1]!;
  const salesMax = niceMax(Math.max(...months.flatMap((m) => [m.sales, m.expenses])));
  const expenseMax = niceMax(Math.max(...months.map((m) => m.expenses)));
  const pairWidth = months.length > 6 ? "38%" : "28%";
  const label = (m: MonthView) => formatMonthYear(parseMonthKey(m.month));

  const column = (m: MonthView, children: React.ReactNode) => (
    <button
      key={m.month}
      type="button"
      onClick={() => setSelected(m.month)}
      aria-pressed={m.month === selected}
      aria-label={`${label(m)}: sales ${formatKES(m.sales)}, expenses ${formatKES(m.expenses)}`}
      className={`flex h-full min-w-0 flex-1 items-end justify-center gap-px sm:gap-[3px] rounded-t-lg transition-ui ${
        m.month === selected ? "bg-[rgba(79,195,247,.12)]" : "hover:bg-paper"
      } ${m.partial ? "opacity-60" : ""}`}
    >
      {children}
    </button>
  );

  const xLabels = (
    <div className="ml-[52px] flex">
      {months.map((m) => (
        <span
          key={m.month}
          className={`min-w-0 flex-1 pt-2 text-center text-[10px] sm:text-xs ${m.month === selected ? "font-semibold text-navy-800" : "text-gray-500"}`}
        >
          {formatMonthShort(parseMonthKey(m.month))}
        </span>
      ))}
    </div>
  );

  const sorted = EXPENSE_CATEGORIES.map((c) => ({ category: c, total: current.categories[c] }))
    .sort((a, b) => b.total - a.total);

  return (
    <>
      <Card>
        <CardHeader title="Sales vs Expenses by Month">
          <Legend items={[{ label: "Sales", color: "var(--color-cyan-400)" }, { label: "Expenses", color: "var(--color-navy-800)" }]} />
        </CardHeader>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-md bg-paper px-4 py-3 text-sm sm:grid-cols-4">
          <span><span className="block text-xs text-gray-500">Month</span><span className="font-semibold">{label(current)}{current.partial ? " (to date)" : ""}</span></span>
          <span><span className="block text-xs text-gray-500">Sales</span><span className="font-semibold tabular-nums">{formatKES(current.sales)}</span></span>
          <span><span className="block text-xs text-gray-500">Expenses</span><span className="font-semibold tabular-nums">{formatKES(current.expenses)}</span></span>
          <span><span className="block text-xs text-gray-500">Profit · margin</span><span className="font-semibold tabular-nums">{formatKES(current.sales - current.expenses)} · {margin(current)}%</span></span>
        </div>
        <div className="overflow-x-auto">
          <div className="sm:min-w-[480px]">
            <div className="flex">
              <Axis max={salesMax} />
              <div className="relative flex flex-1 gap-0.5 sm:gap-1" style={{ height: PLOT_HEIGHT }}>
                <Grid />
                {months.map((m) =>
                  column(
                    m,
                    <>
                      <span className="max-w-9 rounded-t-[4px] bg-cyan-400" style={{ width: pairWidth, height: pct(m.sales, salesMax) }} />
                      <span className="max-w-9 rounded-t-[4px] bg-navy-800" style={{ width: pairWidth, height: pct(m.expenses, salesMax) }} />
                    </>,
                  ),
                )}
              </div>
            </div>
            {xLabels}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] items-start gap-[clamp(12px,3vw,24px)]">
        <Card>
          <CardHeader title="Expenses by Category" />
          <Legend items={EXPENSE_CATEGORIES.map((c) => ({ label: CATEGORY_LABELS[c], color: CATEGORY_COLORS[c] }))} />
          <div className="overflow-x-auto">
            <div className="sm:min-w-[420px]">
              <div className="flex">
                <Axis max={expenseMax} />
                <div className="relative flex flex-1 gap-0.5 sm:gap-1" style={{ height: PLOT_HEIGHT }}>
                  <Grid />
                  {months.map((m) =>
                    column(
                      m,
                      <span className="flex w-[70%] max-w-11 flex-col-reverse overflow-hidden rounded-t-[4px]" style={{ height: pct(m.expenses, expenseMax) }}>
                        {EXPENSE_CATEGORIES.map((c) => (
                          <span key={c} style={{ height: pct(m.categories[c], m.expenses), background: CATEGORY_COLORS[c] }} />
                        ))}
                      </span>,
                    ),
                  )}
                </div>
              </div>
              {xLabels}
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title={`${formatMonthShort(parseMonthKey(current.month))} Breakdown`}>
            <span className="text-[20px] font-bold tabular-nums">{formatKES(current.expenses)}</span>
          </CardHeader>
          <ul className="flex flex-col gap-3">
            {sorted.map((c) => (
              <li key={c.category} className="flex flex-col gap-1.5">
                <span className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2">
                    <span className="size-2.5 rounded-sm" style={{ background: CATEGORY_COLORS[c.category] }} />
                    {CATEGORY_LABELS[c.category]}
                  </span>
                  <span className="tabular-nums">
                    <span className="text-gray-500">{current.expenses ? Math.round((c.total / current.expenses) * 100) : 0}%</span>
                    <span className="ml-3 font-semibold">{formatKES(c.total)}</span>
                  </span>
                </span>
                <ProgressBar value={c.total} max={current.expenses} />
              </li>
            ))}
          </ul>
          <p className="text-[13px] text-gray-500">Click any month in either chart to review it here.</p>
        </Card>
      </div>

      <Card>
        <CardHeader title="Monthly Summary" />
        <div className="grid grid-cols-[minmax(120px,1.4fr)_repeat(4,1fr)] gap-x-3 px-3 text-xs font-medium tracking-[0.04em] text-gray-500 uppercase max-sm:hidden">
          <span>Month</span>
          <span className="text-right">Sales</span>
          <span className="text-right">Expenses</span>
          <span className="text-right">Profit</span>
          <span className="text-right">Margin</span>
        </div>
        <ul className="flex flex-col">
          {[...months].reverse().map((m) => (
            <li key={m.month} className="border-t border-gray-200 first:border-t-0 sm:first:border-t">
              <button
                type="button"
                onClick={() => setSelected(m.month)}
                aria-pressed={m.month === selected}
                className={`grid w-full grid-cols-2 gap-x-3 rounded-md px-3 py-2.5 text-left text-sm transition-ui sm:grid-cols-[minmax(120px,1.4fr)_repeat(4,1fr)] ${
                  m.month === selected ? "bg-cyan-100" : "hover:bg-paper"
                }`}
              >
                <span className="font-semibold">
                  {label(m)}
                  {m.partial && <span className="ml-1 font-normal text-gray-500">(to date)</span>}
                  <span className="block font-normal text-gray-600 sm:hidden">
                    Sales {formatKESShort(m.sales)} · Exp. {formatKESShort(m.expenses)}
                  </span>
                </span>
                <span className="text-right tabular-nums max-sm:hidden">{formatKES(m.sales)}</span>
                <span className="text-right tabular-nums max-sm:hidden">{formatKES(m.expenses)}</span>
                <span className="text-right font-semibold tabular-nums">
                  {formatKES(m.sales - m.expenses)}
                  <span className="block font-normal text-gray-600 sm:hidden">{margin(m)}% margin</span>
                </span>
                <span className="text-right tabular-nums max-sm:hidden">{margin(m)}%</span>
              </button>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
