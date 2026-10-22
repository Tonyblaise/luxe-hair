import { commissionFor, formatWeekRange } from "@luxe-hair/shared";
import { ActionLabel, PageBody, PageHeader } from "@/components/shell/page";
import { Card, CardHeader, EmptyState, KpiGrid, KpiTile } from "@/components/ui";
import { api, unwrap } from "@/lib/api";
import { formatKES } from "@/lib/format";
import { PayButton } from "./pay-button";
import { PayoutTable } from "./payout-table";

export default async function PayoutsPage() {
  const client = await api();
  const data = await unwrap(await client.payouts.$get());
  const week = formatWeekRange(new Date(data.weekStart));
  const unpaid = data.rows.filter((r) => r.status === "pending");

  return (
    <>
      <PageHeader
        title="Payouts"
        action={
          unpaid.length > 0 && (
            <PayButton
              employeeIds={null}
              variant="primary"
              confirmText={`Pay ${unpaid.length} staff a total of ${formatKES(data.totals.owed)}?`}
            >
              <ActionLabel label="Pay All Unpaid" short="Pay All" />
            </PayButton>
          )
        }
      />
      <PageBody>
        <KpiGrid>
          <KpiTile label="Service Sales" value={formatKES(data.totals.serviceSales)} />
          <KpiTile label="Commissions" value={formatKES(data.totals.commissions)} />
          <KpiTile label="Tips" value={formatKES(data.totals.tips)} />
          <KpiTile label="Still Owed" value={formatKES(data.totals.owed)} />
        </KpiGrid>

        <Card>
          <CardHeader title={`Weekly Payouts · ${week}`} caption="Click a stylist to see the breakdown" />
          {data.rows.length === 0 ? (
            <EmptyState>No sales logged this week yet.</EmptyState>
          ) : (
            <PayoutTable rows={data.rows} />
          )}
        </Card>

        <Card>
          <div className="flex flex-col gap-1">
            <CardHeader title="Commission Rates" link={{ href: "/services", label: "Edit in Services" }} />
            <p className="text-sm text-gray-600">Pulled from your service menu. Change rates in Services.</p>
          </div>
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3">
            {data.rates.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 rounded-md bg-paper px-4 py-3">
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{s.name}</span>
                  <span className="block text-[13px] text-gray-600">{formatKES(s.price)} service</span>
                </span>
                <span className="text-right">
                  <span className="block font-bold tabular-nums">
                    {s.commissionType === "percent" ? `${s.commission}%` : formatKES(s.commission)}
                  </span>
                  <span className="block text-[13px] whitespace-nowrap text-gray-600">
                    Earns {formatKES(commissionFor(s, s.price))}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </PageBody>
    </>
  );
}
