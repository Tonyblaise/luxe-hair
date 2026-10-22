import { PageBody, PageHeader } from "@/components/shell/page";
import { Bolt, ButtonLink, Card, Chip, EmptyState, PillLink, PillRow } from "@/components/ui";
import { api, unwrap } from "@/lib/api";
import { formatKES, plural } from "@/lib/format";
import { Stepper } from "./stepper";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "retail", label: "Retail" },
  { value: "backbar", label: "Backbar" },
  { value: "low", label: "Low Stock" },
] as const;
type Filter = (typeof FILTERS)[number]["value"];

const TYPE_LABEL = { retail: "Retail", backbar: "Backbar" } as const;

export default async function InventoryPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const raw = (await searchParams).filter;
  const filter: Filter = FILTERS.some((f) => f.value === raw) ? (raw as Filter) : "all";
  const client = await api();
  const products = await unwrap(await client.inventory.$get());

  const low = products.filter((p) => p.low);
  const stockValue = products.reduce((s, p) => s + (p.unitCost ?? 0) * p.onHand, 0);
  const listed =
    filter === "all" ? products : filter === "low" ? low : products.filter((p) => p.type === filter);

  const statusChip = (isLow: boolean) =>
    isLow ? <Chip tone="warn">Low Stock</Chip> : <Chip tone="info">In Stock</Chip>;

  return (
    <>
      <PageHeader title="Inventory" />
      <PageBody>
        {low.length > 0 && (
          <div className="flex flex-wrap items-center gap-4 rounded-lg bg-navy-800 px-6 py-5 text-white">
            <Bolt size={22} />
            <div className="min-w-[200px] flex-1">
              <p className="text-base font-semibold">{plural(low.length, "product")} below reorder level</p>
              <p className="text-sm text-white/72">{low.map((p) => p.name).join(", ")}</p>
            </div>
            {filter !== "low" && (
              <ButtonLink href="?filter=low" scroll={false}>
                Show Low Stock
              </ButtonLink>
            )}
          </div>
        )}

        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <PillRow>
              {FILTERS.map((f) => (
                <PillLink key={f.value} href={`?filter=${f.value}`} active={f.value === filter}>
                  {f.label}
                </PillLink>
              ))}
            </PillRow>
            <p className="text-sm text-gray-600">
              Stock value at cost <span className="font-bold text-navy-800 tabular-nums">{formatKES(stockValue)}</span>
            </p>
          </div>

          {listed.length === 0 ? (
            <EmptyState>Nothing to show.</EmptyState>
          ) : (
            <>
              {/* ≥ 640: table */}
              <div className="overflow-x-auto max-sm:hidden">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead>
                    <tr className="text-xs font-medium tracking-[0.04em] text-gray-500 uppercase">
                      <th className="py-2 pr-3 font-medium">Product</th>
                      <th className="px-3 py-2 font-medium">Type</th>
                      <th className="px-3 py-2 text-right font-medium">Cost</th>
                      <th className="px-3 py-2 text-right font-medium">Price</th>
                      <th className="px-3 py-2 font-medium">On Hand</th>
                      <th className="py-2 pl-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listed.map((p) => (
                      <tr key={p.id} className="border-t border-gray-200">
                        <td className="py-3 pr-3">
                          <span className="block text-[15px] font-semibold">{p.name}</span>
                          <span className="block text-[13px] text-gray-600">
                            {[p.brand, `reorder at ${p.reorderAt}`].filter(Boolean).join(" · ")}
                          </span>
                        </td>
                        <td className="px-3 py-3">{TYPE_LABEL[p.type]}</td>
                        <td className="px-3 py-3 text-right tabular-nums">{p.unitCost ? formatKES(p.unitCost) : "—"}</td>
                        <td className="px-3 py-3 text-right tabular-nums">{p.price ? formatKES(p.price) : "—"}</td>
                        <td className="px-3 py-3">
                          <Stepper key={`${p.id}:${p.onHand}`} id={p.id} name={p.name} onHand={p.onHand} />
                        </td>
                        <td className="py-3 pl-3">{statusChip(p.low)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* < 640: stacked rows */}
              <ul className="sm:hidden">
                {listed.map((p) => (
                  <li key={p.id} className="flex flex-col gap-2 border-t border-gray-200 py-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <span className="min-w-0">
                        <span className="block text-[15px] font-semibold">{p.name}</span>
                        <span className="block text-[13px] text-gray-600">
                          {[p.brand, TYPE_LABEL[p.type], p.price ? formatKES(p.price) : null].filter(Boolean).join(" · ")}
                        </span>
                      </span>
                      {statusChip(p.low)}
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[13px] text-gray-600">Reorder at {p.reorderAt}</span>
                      <Stepper key={`${p.id}:${p.onHand}`} id={p.id} name={p.name} onHand={p.onHand} />
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      </PageBody>
    </>
  );
}
