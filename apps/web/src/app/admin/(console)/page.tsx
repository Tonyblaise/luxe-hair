import { COMPANY_STATUS_LABELS, type CompanyStatus } from "@luxe-hair/shared";
import { Suspense } from "react";
import { KpiGrid, KpiTile, ModalLink, PillLink, PillRow, buttonClass } from "@/components/ui";
import { adminApi, adminUnwrap } from "@/lib/admin";
import { plural } from "@/lib/format";
import { CompaniesTable, CompanySearch } from "./companies-table";
import { InviteCompanyModal } from "./invite-company-modal";
import { AdminBody, AdminPageHeader } from "./page-header";

const FILTERS = ["all", "active", "trial", "invited", "suspended"] as const;
type Filter = "all" | CompanyStatus;

export default async function CompaniesPage({ searchParams }: { searchParams: Promise<{ filter?: string; q?: string }> }) {
  const params = await searchParams;
  const filter: Filter = (FILTERS as readonly string[]).includes(params.filter ?? "") ? (params.filter as Filter) : "all";
  const q = (params.q ?? "").trim();
  const client = await adminApi();
  const data = await adminUnwrap(await client.companies.$get());

  const needle = q.toLowerCase();
  const searched = needle
    ? data.rows.filter((r) => [r.name, r.owner.name, r.owner.email].some((v) => v.toLowerCase().includes(needle)))
    : data.rows;
  const rows = filter === "all" ? searched : searched.filter((r) => r.status === filter);
  const count = (f: Filter) => (f === "all" ? data.rows.length : data.rows.filter((r) => r.status === f).length);
  const href = (f: Filter) => `/admin?${new URLSearchParams({ ...(f !== "all" ? { filter: f } : {}), ...(q ? { q } : {}) })}`;

  return (
    <AdminBody wide>
      <AdminPageHeader
        eyebrow="Accounts"
        title="Companies"
        action={
          <ModalLink id="invite-company" className={buttonClass("primary", "md", "px-5!")}>
            Invite Company
          </ModalLink>
        }
      />

      <KpiGrid>
        <KpiTile label="Active Companies" value={data.kpis.active} sub="Paying and signed in" />
        <KpiTile label="On Trial" value={data.kpis.trial} sub={`${data.settings.trialDays}-day free trial`} />
        <KpiTile label="Pending Invites" value={data.kpis.invited} sub={`${data.kpis.invitesExpired} expired`} />
        <KpiTile label="Staff on Platform" value={data.kpis.staff} sub="Across active and trial salons" />
      </KpiGrid>

      <section className="flex flex-col gap-4 rounded-lg bg-white p-[clamp(16px,3vw,24px)] shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <PillRow>
            {FILTERS.map((f) => (
              <PillLink key={f} href={href(f)} active={f === filter} className="text-sm!">
                {f === "all" ? "All" : COMPANY_STATUS_LABELS[f]} ({count(f)})
              </PillLink>
            ))}
          </PillRow>
          <Suspense>
            <CompanySearch initial={q} />
          </Suspense>
        </div>
        {q && (
          <p className="text-[13px] text-gray-500">
            {plural(rows.length, "match", "matches")} for “{q}”
          </p>
        )}
        <CompaniesTable
          rows={rows}
          plans={data.plans.map((p) => ({ id: p.id, name: p.name }))}
          today={data.today}
        />
      </section>

      <InviteCompanyModal plans={data.plans} trialDays={data.settings.trialDays} inviteDays={data.settings.inviteDays} />
    </AdminBody>
  );
}
