import { PAYMENT_LABELS, daysBetween, formatShortDate, toISODate, todayDate } from "@luxe-hair/shared";
import { DeleteButton } from "@/components/delete-button";
import { ActionLabel, PageBody, PageHeader } from "@/components/shell/page";
import { Card, CardHeader, EmptyState, MiniKpi, ModalLink, PillLink, PillRow, buttonClass } from "@/components/ui";
import { api, unwrapAll } from "@/lib/api";
import { formatKES } from "@/lib/format";
import { deleteSale } from "./actions";
import { AddSaleModal } from "./add-sale-modal";

const PERIODS = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "all", label: "All" },
] as const;
type Period = (typeof PERIODS)[number]["value"];

export default async function SalesPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const raw = (await searchParams).period;
  const period: Period = PERIODS.some((p) => p.value === raw) ? (raw as Period) : "today";
  const client = await api();
  const [data, options] = await unwrapAll(client.sales.$get({ query: { period } }), client.sales.options.$get());
  const today = todayDate();

  const dayLabel = (iso: string) => {
    const diff = daysBetween(new Date(iso), today);
    return diff === 0 ? "Today" : diff === 1 ? "Yesterday" : formatShortDate(new Date(iso));
  };

  return (
    <>
      <PageHeader
        title="Sales Log"
        action={
          <ModalLink id="add-sale" className={buttonClass("primary")}>
            <ActionLabel label="Add Sale" short="+ Add" />
          </ModalLink>
        }
      />
      <PageBody>
        <Card>
          <CardHeader title="Entries">
            <PillRow>
              {PERIODS.map((p) => (
                <PillLink key={p.value} href={`?period=${p.value}`} active={p.value === period}>
                  {p.label}
                </PillLink>
              ))}
            </PillRow>
          </CardHeader>
          <div className="grid grid-cols-2 gap-3 sm:max-w-md">
            <MiniKpi label="Sales" value={data.count.toLocaleString("en-US")} />
            <MiniKpi label="Revenue" value={formatKES(data.revenue)} />
          </div>
          {data.sales.length === 0 ? (
            <EmptyState>No sales logged for this period.</EmptyState>
          ) : (
            <ul>
              {data.sales.map((s) => (
                <li key={s.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-x-3 border-t border-gray-200 py-3">
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] font-semibold">{s.service}</span>
                    <span className="block text-[13px] text-gray-600">
                      {[s.employee, s.client, PAYMENT_LABELS[s.paymentMethod], dayLabel(s.date)].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  <span className="text-[15px] font-bold tabular-nums">{formatKES(s.amount)}</span>
                  <DeleteButton action={deleteSale.bind(null, s.id)} confirmText={`Remove this ${s.service} sale?`} />
                </li>
              ))}
            </ul>
          )}
          {data.truncated && (
            <p className="text-center text-[13px] text-gray-500">Showing the latest {data.sales.length} sales.</p>
          )}
        </Card>
      </PageBody>
      <AddSaleModal options={options} today={toISODate(today)} />
    </>
  );
}
