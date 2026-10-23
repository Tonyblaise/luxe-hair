import { addMonths, formatMonthName, formatMonthYear, monthKey, monthStart, parseMonthKey, todayDate } from "@luxe-hair/shared";
import { PageBody, PageHeader } from "@/components/shell/page";
import { Card, CardHeader, EmptyState, KpiGrid, KpiTile, PillLink, PillRow, ProgressBar } from "@/components/ui";
import { api, unwrap } from "@/lib/api";
import { formatKES, plural } from "@/lib/format";
import { RangeControls } from "./range-controls";
import { ReportsView } from "./reports-view";

const isMonth = (v?: string) => Boolean(v && /^\d{4}-\d{2}$/.test(v));

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const params = await searchParams;
  const thisMonth = monthStart(todayDate());
  const current = monthKey(thisMonth);
  const available = Array.from({ length: 12 }, (_, i) => addMonths(thisMonth, i - 11));
  const earliest = monthKey(available[0]!);

  let from = isMonth(params.from) ? params.from! : earliest;
  let to = isMonth(params.to) ? params.to! : current;
  if (from < earliest) from = earliest;
  if (to > current) to = current;
  if (from > to) [from, to] = [to, from];

  const presets = [
    { label: "Last 3 Months", from: monthKey(addMonths(thisMonth, -2)) },
    { label: "Last 6 Months", from: monthKey(addMonths(thisMonth, -5)) },
    { label: "Year to Date", from: `${current.slice(0, 4)}-01` < earliest ? earliest : `${current.slice(0, 4)}-01` },
    { label: "Last 12 Months", from: earliest },
  ];

  const client = await api();
  const data = await unwrap(await client.reports.$get({ query: { from, to } }));
  const months = data.months;
  const sales = months.reduce((s, m) => s + m.sales, 0);
  const expenses = months.reduce((s, m) => s + m.expenses, 0);
  const best = [...months].sort((a, b) => b.sales - a.sales)[0]!;
  const rangeLabel = `${formatMonthYear(parseMonthKey(from))} – ${formatMonthYear(parseMonthKey(to))}`;
  const maxEmployee = Math.max(1, ...data.employees.map((e) => e.sales));
  const maxService = Math.max(1, ...data.services.map((s) => s.sales));

  return (
    <>
      <PageHeader title="Reports" />
      <PageBody>
        <Card>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <RangeControls
              from={from}
              to={to}
              options={available.map((m) => ({ value: monthKey(m), label: formatMonthYear(m) }))}
            />
            <p className="text-[13px] text-gray-500">
              {plural(months.length, "month")} · {formatMonthName(thisMonth)} is month to date
            </p>
          </div>
          <PillRow>
            {presets.map((p) => (
              <PillLink key={p.label} href={`/reports?from=${p.from}&to=${current}`} active={p.from === from && to === current}>
                {p.label}
              </PillLink>
            ))}
          </PillRow>
        </Card>

        <KpiGrid>
          <KpiTile label="Sales" value={formatKES(sales)} />
          <KpiTile label="Expenses" value={formatKES(expenses)} />
          <KpiTile
            label="Profit"
            value={formatKES(sales - expenses)}
            sub={`${sales ? Math.round(((sales - expenses) / sales) * 100) : 0}% margin`}
          />
          {best.sales > 0 ? (
            <KpiTile label="Best Month" value={formatMonthYear(parseMonthKey(best.month))} sub={`${formatKES(best.sales)} in sales`} />
          ) : (
            <KpiTile label="Best Month" value="—" sub="No sales yet" />
          )}
        </KpiGrid>

        <ReportsView key={`${from}:${to}`} months={months} />

        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] items-start gap-[clamp(12px,3vw,24px)]">
          <Card className="@container">
            <CardHeader title="Sales by Employee" caption={rangeLabel} />
            {data.employees.length === 0 ? (
              <EmptyState>No sales in this range.</EmptyState>
            ) : (
              <>
                <div className="grid grid-cols-[minmax(0,1fr)_64px_120px_120px] gap-x-3 text-xs font-medium tracking-[0.04em] text-gray-500 uppercase @max-lg:hidden">
                  <span>Employee</span>
                  <span className="text-right">Appts</span>
                  <span className="text-right">Avg Ticket</span>
                  <span className="text-right">Comm.</span>
                </div>
                <ul>
                  {data.employees.map((e) => (
                    <li key={e.id} className="flex flex-col gap-1.5 border-t border-gray-200 py-3">
                      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 text-sm @lg:grid-cols-[minmax(0,1fr)_64px_120px_120px]">
                        <span className="min-w-0">
                          <span className="block truncate font-semibold">{e.name}</span>
                          <span className="block text-[13px] text-gray-600 tabular-nums">{formatKES(e.sales)}</span>
                        </span>
                        <span className="text-right tabular-nums @max-lg:hidden">{e.appointments}</span>
                        <span className="text-right tabular-nums @max-lg:hidden">{formatKES(e.avgTicket)}</span>
                        <span className="text-right font-semibold tabular-nums">{formatKES(e.commission)}</span>
                        <span className="col-span-2 text-[13px] text-gray-600 @lg:hidden">
                          {e.appointments} appts · avg {formatKES(e.avgTicket)} · comm. {formatKES(e.commission)}
                        </span>
                      </div>
                      <ProgressBar value={e.sales} max={maxEmployee} />
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Card>

          <Card className="@container">
            <CardHeader title="Sales by Service" caption={rangeLabel} />
            {data.services.length === 0 ? (
              <EmptyState>No sales in this range.</EmptyState>
            ) : (
              <>
                <div className="grid grid-cols-[minmax(0,1fr)_64px_110px_64px] gap-x-3 text-xs font-medium tracking-[0.04em] text-gray-500 uppercase @max-lg:hidden">
                  <span>Service</span>
                  <span className="text-right">Booked</span>
                  <span className="text-right">Price</span>
                  <span className="text-right">Share</span>
                </div>
                <ul>
                  {data.services.map((s) => (
                    <li key={s.id} className="flex flex-col gap-1.5 border-t border-gray-200 py-3">
                      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 text-sm @lg:grid-cols-[minmax(0,1fr)_64px_110px_64px]">
                        <span className="min-w-0">
                          <span className="block truncate font-semibold">{s.name}</span>
                          <span className="block text-[13px] text-gray-600 tabular-nums">{formatKES(s.sales)}</span>
                        </span>
                        <span className="text-right tabular-nums @max-lg:hidden">{s.booked}</span>
                        <span className="text-right tabular-nums @max-lg:hidden">{formatKES(s.price)}</span>
                        <span className="text-right font-semibold tabular-nums">{Math.round(s.share * 100)}%</span>
                        <span className="col-span-2 text-[13px] text-gray-600 @lg:hidden">
                          {s.booked} booked · {formatKES(s.price)} each · {Math.round(s.share * 100)}% share
                        </span>
                      </div>
                      <ProgressBar value={s.sales} max={maxService} tone="navy" />
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Card>
        </div>
      </PageBody>
    </>
  );
}
