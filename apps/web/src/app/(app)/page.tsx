import {
  CATEGORY_LABELS,
  TIME_ZONE,
  addDays,
  formatClock,
  formatMonthName,
  formatShortDate,
  formatWeekRange,
} from "@luxe-hair/shared";
import { PageBody, PageHeader } from "@/components/shell/page";
import { TaskToggle } from "@/components/task-toggle";
import { Card, CardHeader, Chip, KpiGrid, KpiTile, ProgressBar } from "@/components/ui";
import { api, unwrapAll } from "@/lib/api";
import { formatKES, plural } from "@/lib/format";
import { taskChip, taskMeta } from "@/lib/tasks";
import { CheckInButton } from "./check-in-button";

function greeting() {
  const hour = Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone: TIME_ZONE }).format(new Date()));
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
}

export default async function DashboardPage() {
  const client = await api();
  const [d, me] = await unwrapAll(client.dashboard.$get(), client.auth.me.$get());
  const today = new Date(d.today);
  const week = new Date(d.weekStart);
  const monthName = formatMonthName(today);
  const inChair = d.appointments.filter((a) => a.status === "checked_in").length;
  const toArrive = d.appointments.filter((a) => a.status === "booked").length;
  const maxCategory = Math.max(...d.expensesByCategory.map((c) => c.total));

  return (
    <>
      <PageHeader title={`${greeting()}, ${me.company.name}`} />
      <PageBody>
        <KpiGrid>
          <KpiTile label="Today's Revenue" value={formatKES(d.kpis.todayRevenue)} sub={`${plural(d.kpis.todayCount, "sale")} logged today`} />
          <KpiTile
            label={`${monthName} Revenue`}
            value={formatKES(d.kpis.monthRevenue)}
            sub={`Services, ${formatShortDate(new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1)))}–${today.getUTCDate()}`}
          />
          <KpiTile label={`${monthName} Expenses`} value={formatKES(d.kpis.monthExpenses)} sub={`${plural(d.kpis.monthExpenseCount, "entry", "entries")} logged`} />
          <KpiTile label="Est. Profit" value={formatKES(d.kpis.estProfit)} sub={`after ${formatKES(d.kpis.commissionsOwed)} commissions owed`} />
        </KpiGrid>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] items-start gap-[clamp(12px,3vw,24px)]">
          <Card>
            <CardHeader title="Today's Appointments" caption={`${inChair} in chair · ${toArrive} still to arrive`} />
            {d.appointments.length === 0 ? (
              <p className="text-sm text-gray-500">No appointments booked today.</p>
            ) : (
              <ul>
                {d.appointments.map((a) => (
                  <li key={a.id} className="grid grid-cols-[64px_1fr_auto] items-center gap-3 border-t border-gray-200 py-3">
                    <span className="text-sm font-semibold tabular-nums">{formatClock(a.time)}</span>
                    <span className="min-w-0">
                      <span className="block truncate text-[15px] font-semibold">{a.client}</span>
                      <span className="block truncate text-[13px] text-gray-600">
                        {a.service} · {a.employee}
                      </span>
                    </span>
                    {a.status === "booked" || a.status === "check_in" ? (
                      <CheckInButton id={a.id} client={a.client} />
                    ) : a.status === "checked_in" ? (
                      <Chip tone="info">Checked In</Chip>
                    ) : (
                      <Chip tone="neutral">Completed</Chip>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <div className="flex min-w-0 flex-col gap-[clamp(12px,3vw,24px)]">
            <Card>
              <CardHeader title="Tasks & Reminders" link={{ href: "/tasks", label: "All Tasks" }} />
              {d.tasks.length === 0 ? (
                <p className="text-sm text-gray-500">Nothing due today.</p>
              ) : (
                <ul>
                  {d.tasks.map((t) => {
                    const chip = taskChip(t, today);
                    return (
                      <li key={t.id} className="flex items-center gap-3 border-t border-gray-200 py-2.5">
                        <TaskToggle id={t.id} title={t.title} done={false} size={24} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold">{t.title}</span>
                          <span className="block truncate text-xs text-gray-600">{taskMeta(t)}</span>
                        </span>
                        <Chip tone={chip.tone}>{chip.label}</Chip>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>

            <Card>
              <CardHeader title="Payouts Owed" link={{ href: "/payouts", label: "Payouts" }} />
              <div>
                <p className="text-[30px] leading-tight font-bold tabular-nums">{formatKES(d.payouts.owed)}</p>
                <p className="text-[13px] text-gray-500">
                  week of {formatWeekRange(week)} · pays Sunday {formatShortDate(addDays(week, 6))}
                </p>
              </div>
              {d.payouts.top.length > 0 && (
                <ul>
                  {d.payouts.top.map((p) => (
                    <li key={p.employeeId} className="flex justify-between gap-3 border-t border-gray-200 py-2.5 text-sm">
                      <span className="truncate">{p.name}</span>
                      <span className="font-semibold tabular-nums">{formatKES(p.total)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card>
              <CardHeader title={`${monthName} Expenses`} link={{ href: "/expenses", label: "Expense Log" }} />
              <ul className="flex flex-col gap-3">
                {d.expensesByCategory.map((c) => (
                  <li key={c.category} className="flex flex-col gap-1.5">
                    <span className="flex justify-between gap-3 text-sm">
                      <span>{CATEGORY_LABELS[c.category]}</span>
                      <span className="font-semibold tabular-nums">{formatKES(c.total)}</span>
                    </span>
                    <ProgressBar value={c.total} max={maxCategory} />
                  </li>
                ))}
              </ul>
            </Card>

            <Card>
              <CardHeader title="Low Stock" link={{ href: "/inventory", label: "Inventory" }} />
              {d.lowStock.length === 0 ? (
                <p className="text-sm text-gray-500">Everything is stocked above reorder level.</p>
              ) : (
                <ul>
                  {d.lowStock.map((p) => (
                    <li key={p.id} className="flex flex-wrap justify-between gap-x-3 border-t border-gray-200 py-2.5 text-sm">
                      <span className="font-semibold">{p.name}</span>
                      <span className="text-gray-600">
                        {p.onHand} left · reorder at {p.reorderAt}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      </PageBody>
    </>
  );
}
