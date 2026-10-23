import {
  CATEGORY_LABELS,
  EXPENSE_CATEGORIES,
  formatMonthName,
  formatShortDate,
  toISODate,
  todayDate,
  type ExpenseCategory,
} from "@luxe-hair/shared";
import { ActionLabel, PageBody, PageHeader } from "@/components/shell/page";
import { Card, CardHeader, EmptyState, ModalLink, PillLink, PillRow, ProgressBar, SectionLabel, buttonClass } from "@/components/ui";
import { api, unwrap } from "@/lib/api";
import { formatKES } from "@/lib/format";
import { AddExpenseModal } from "./add-expense-modal";

export default async function ExpensesPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const raw = (await searchParams).category;
  const category = EXPENSE_CATEGORIES.includes(raw as ExpenseCategory) ? (raw as ExpenseCategory) : undefined;
  const client = await api();
  const data = await unwrap(await client.expenses.$get({ query: category ? { category } : {} }));
  const monthName = formatMonthName(new Date(data.month));
  const total = data.byCategory.reduce((s, c) => s + c.total, 0);
  const max = Math.max(...data.byCategory.map((c) => c.total));

  const receipt = (e: { id: string; hasReceipt: boolean }) =>
    e.hasReceipt ? (
      <a href={`/receipts/${e.id}`} target="_blank" rel="noreferrer" className="font-medium text-cyan-600 hover:underline">
        Receipt attached
      </a>
    ) : (
      <span className="text-gray-400">—</span>
    );

  return (
    <>
      <PageHeader
        title="Expenses"
        action={
          <ModalLink id="add-expense" className={buttonClass("primary")}>
            <ActionLabel label="Add Expense" short="+ Add" />
          </ModalLink>
        }
      />
      <PageBody>
        <Card>
          <CardHeader title={`${monthName} by Category`}>
            <span className="text-[20px] font-bold tabular-nums">{formatKES(total)}</span>
          </CardHeader>
          <ul className="flex flex-col gap-3">
            {data.byCategory.map((c) => (
              <li key={c.category} className="flex flex-col gap-1.5">
                <span className="flex justify-between gap-3 text-sm">
                  <span>{CATEGORY_LABELS[c.category]}</span>
                  <span className="font-semibold tabular-nums">{formatKES(c.total)}</span>
                </span>
                <ProgressBar value={c.total} max={max} />
              </li>
            ))}
          </ul>
          {data.recurring.length > 0 && (
            <div className="mt-2 flex flex-col gap-1">
              <SectionLabel>Recurring · auto-added on the 1st</SectionLabel>
              <ul>
                {data.recurring.map((r) => (
                  <li key={r.id} className="flex justify-between gap-3 border-t border-gray-200 py-2.5 text-sm">
                    <span className="min-w-0 truncate">{r.name}</span>
                    <span className="font-semibold whitespace-nowrap tabular-nums">{formatKES(r.amount)}/mo</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Expense Log" />
          <PillRow>
            <PillLink href="?" active={!category}>
              All
            </PillLink>
            {EXPENSE_CATEGORIES.map((c) => (
              <PillLink key={c} href={`?category=${c}`} active={c === category}>
                {CATEGORY_LABELS[c]}
              </PillLink>
            ))}
          </PillRow>
          {data.log.length === 0 ? (
            <EmptyState>No expenses logged yet.</EmptyState>
          ) : (
            <>
              <div className="overflow-x-auto max-sm:hidden">
                <table className="w-full min-w-[620px] text-left text-sm">
                  <tbody>
                    {data.log.map((e) => (
                      <tr key={e.id} className="border-t border-gray-200">
                        <td className="w-20 py-3 pr-3 whitespace-nowrap text-gray-600">{formatShortDate(new Date(e.date))}</td>
                        <td className="px-3 py-3">
                          <span className="block font-semibold">{e.description}</span>
                          {e.isRecurring && <span className="block text-xs text-gray-500">Recurring monthly</span>}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-gray-600">{CATEGORY_LABELS[e.category]}</td>
                        <td className="px-3 py-3 whitespace-nowrap">{receipt(e)}</td>
                        <td className="py-3 pl-3 text-right font-semibold whitespace-nowrap tabular-nums">{formatKES(e.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ul className="sm:hidden">
                {data.log.map((e) => (
                  <li key={e.id} className="flex items-start justify-between gap-3 border-t border-gray-200 py-3">
                    <span className="min-w-0">
                      <span className="block text-[15px] font-semibold">{e.description}</span>
                      <span className="block text-[13px] text-gray-600">
                        {formatShortDate(new Date(e.date))} · {CATEGORY_LABELS[e.category]}
                      </span>
                    </span>
                    <span className="flex flex-col items-end text-[13px]">
                      <span className="text-[15px] font-bold whitespace-nowrap tabular-nums">{formatKES(e.amount)}</span>
                      {e.hasReceipt && receipt(e)}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      </PageBody>
      <AddExpenseModal today={toISODate(todayDate())} />
    </>
  );
}
