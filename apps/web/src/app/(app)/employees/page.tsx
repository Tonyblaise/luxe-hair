import { EMPLOYMENT_LABELS, WEEKDAYS, todayDate } from "@luxe-hair/shared";
import Link from "next/link";
import { ActionLabel, PageBody, PageHeader } from "@/components/shell/page";
import { Avatar, ButtonLink, Card, EmptyState, PillLink, PillRow } from "@/components/ui";
import { api, unwrap } from "@/lib/api";
import { EmployeeDetail } from "./employee-detail";
import { NewEmployeeCard } from "./new-employee-card";

const FILTERS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "all", label: "All" },
] as const;
type Filter = (typeof FILTERS)[number]["value"];

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; emp?: string; view?: string }>;
}) {
  const params = await searchParams;
  const status: Filter = FILTERS.some((f) => f.value === params.status) ? (params.status as Filter) : "active";
  const creating = params.view === "new";
  const client = await api();
  const { employees, services } = await unwrap(await client.employees.$get());

  const counts = {
    active: employees.filter((e) => e.status === "active").length,
    inactive: employees.filter((e) => e.status === "inactive").length,
    all: employees.length,
  };
  const listed = status === "all" ? employees : employees.filter((e) => e.status === status);
  const chosen = employees.find((e) => e.id === params.emp);
  const selected = chosen ?? listed[0];
  // Below 1100px the list and the detail take turns; a chosen employee or the new form shows the detail.
  const showingDetail = Boolean(chosen) || creating;
  const today = WEEKDAYS[(todayDate().getUTCDay() + 6) % 7]!;
  const listHref = `/employees?status=${status}`;

  return (
    <>
      <PageHeader
        title="Employees"
        action={
          <ButtonLink href={`/employees?status=${status}&view=new`} scroll={false}>
            <ActionLabel label="Add Employee" short="+ Add" />
          </ButtonLink>
        }
      />
      <PageBody>
        <div className="grid items-start gap-[clamp(12px,3vw,24px)] xl:grid-cols-[minmax(320px,400px)_1fr]">
          <Card padding="p-5" className={showingDetail ? "max-xl:hidden" : ""}>
            <PillRow>
              {FILTERS.map((f) => (
                <PillLink key={f.value} href={`/employees?status=${f.value}`} active={f.value === status}>
                  {f.label} ({counts[f.value]})
                </PillLink>
              ))}
            </PillRow>
            {listed.length === 0 ? (
              <EmptyState>No employees here.</EmptyState>
            ) : (
              <ul className="flex flex-col gap-1">
                {listed.map((e) => {
                  const isSelected = !creating && e.id === selected?.id;
                  const highlight = "border-2 border-cyan-400 bg-cyan-100";
                  const working = e.status === "active" && e.scheduleDays.includes(today);
                  const dot = e.status === "inactive" ? "bg-gray-400" : working ? "bg-cyan-400" : "bg-gray-300";
                  const state = e.status === "inactive" ? "Inactive" : working ? "Working today" : "Off today";
                  return (
                    <li key={e.id}>
                      <Link
                        href={`/employees?status=${status}&emp=${e.id}`}
                        scroll={false}
                        aria-current={isSelected ? "true" : undefined}
                        className={`grid grid-cols-[40px_1fr_auto] items-center gap-3 rounded-md p-3 transition-ui ${
                          isSelected ? highlight : "border-2 border-transparent hover:bg-paper"
                        }`}
                      >
                        <Avatar name={`${e.firstName} ${e.lastName}`} />
                        <span className="min-w-0">
                          <span className="block truncate text-[15px] font-semibold">
                            {e.firstName} {e.lastName}
                          </span>
                          <span className="block truncate text-[13px] text-gray-600">
                            {e.role} · {EMPLOYMENT_LABELS[e.employmentType]}
                          </span>
                        </span>
                        <span className="flex items-center gap-1.5 text-xs whitespace-nowrap text-gray-600">
                          <span className={`size-2 rounded-full ${dot}`} />
                          {state}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <div className={`flex min-w-0 flex-col gap-3 ${showingDetail ? "" : "max-xl:hidden"}`}>
            <Link href={listHref} className="text-[15px] font-semibold text-cyan-600 xl:hidden">
              ← All Employees
            </Link>
            <Card padding="p-[clamp(20px,4vw,32px)]">
              {creating ? (
                <NewEmployeeCard />
              ) : selected ? (
                <EmployeeDetail key={selected.id} employee={selected} services={services} />
              ) : (
                <EmptyState>Add your first employee to get started.</EmptyState>
              )}
            </Card>
          </div>
        </div>
      </PageBody>
    </>
  );
}
