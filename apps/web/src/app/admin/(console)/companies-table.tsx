"use client";

import {
  COMPANY_STATUS_LABELS,
  TIME_ZONE,
  daysBetween,
  formatShortDate,
  type CompanyStatus,
} from "@luxe-hair/shared";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { LinkDialog } from "@/components/link-dialog";
import { Avatar, Chip, Menu, inputBase, useToast, type ChipTone, type MenuItem } from "@/components/ui";
import { changePlan, companyAction } from "./company-actions";

export type CompanyRow = {
  id: string;
  name: string;
  city: string | null;
  status: CompanyStatus;
  planId: string | null;
  owner: { name: string; email: string };
  staff: number;
  lastSignInAt: string | null;
  trialEndsAt: string | null;
  invitedAt: string | null;
  inviteExpired: boolean;
  suspendedAt: string | null;
  statusNote: string | null;
};
export type PlanOption = { id: string; name: string };

const CHIP: Record<CompanyStatus, ChipTone> = { active: "info", trial: "outline", invited: "warn", suspended: "neutral" };
const TILE = { active: "navy", trial: "navy", invited: "dashed", suspended: "muted" } as const;

const clock = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: TIME_ZONE });
const localDay = (d: Date) => new Date(`${new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(d)}T00:00:00Z`);

function lastActive(r: CompanyRow, today: Date): string {
  if (r.status === "invited") {
    if (!r.invitedAt) return "Invited";
    const day = formatShortDate(localDay(new Date(r.invitedAt)));
    return r.inviteExpired ? `${day} · expired` : `Invited ${day}`;
  }
  if (r.status === "suspended") {
    return r.statusNote ?? (r.suspendedAt ? `Suspended ${formatShortDate(localDay(new Date(r.suspendedAt)))}` : "Suspended");
  }
  if (r.status === "trial" && r.trialEndsAt) {
    const left = daysBetween(today, new Date(r.trialEndsAt));
    return left > 0 ? `${left} ${left === 1 ? "day" : "days"} left` : "Trial ended";
  }
  if (!r.lastSignInAt) return "Never signed in";
  const seen = new Date(r.lastSignInAt);
  if (Date.now() - seen.getTime() < 10 * 60_000) return "Active now";
  const ago = daysBetween(localDay(seen), today);
  if (ago === 0) return `Today, ${clock.format(seen)}`;
  if (ago === 1) return "Yesterday";
  return formatShortDate(localDay(seen));
}

export function CompaniesTable({ rows, plans, today }: { rows: CompanyRow[]; plans: PlanOption[]; today: string }) {
  const day = new Date(today);
  if (rows.length === 0) return <p className="py-8 text-center text-sm text-gray-500">No companies match this filter.</p>;

  return (
    <>
      {/* ≥ 640: table (scrolls sideways until there's room) */}
      <div className="overflow-x-auto max-sm:hidden">
        <div className="min-w-[920px]">
          <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1.5fr)_112px_44px_92px_112px_104px] gap-3 px-3 pb-2 text-xs font-medium tracking-[0.04em] text-gray-500 uppercase">
            <span>Company</span>
            <span>Owner</span>
            <span>Plan</span>
            <span className="text-right">Staff</span>
            <span>Status</span>
            <span>Last Active</span>
            <span className="text-right">Actions</span>
          </div>
          <ul>
            {rows.map((r) => (
              <li
                key={r.id}
                className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1.5fr)_112px_44px_92px_112px_104px] items-center gap-3 border-t border-gray-200 p-3 text-sm"
              >
                <CompanyCell row={r} />
                <span className="min-w-0">
                  <span className="block truncate">{r.owner.name}</span>
                  <span className="block truncate text-[13px] text-gray-600">{r.owner.email}</span>
                </span>
                <PlanSelect row={r} plans={plans} />
                <span className="text-right tabular-nums">{r.staff || "—"}</span>
                <span>
                  <Chip tone={CHIP[r.status]}>{COMPANY_STATUS_LABELS[r.status]}</Chip>
                </span>
                <span className="text-[13px] text-gray-600">{lastActive(r, day)}</span>
                <span className="flex justify-end">
                  <ManageMenu row={r} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* < 640: stacked rows */}
      <ul className="sm:hidden">
        {rows.map((r) => (
          <li key={r.id} className="flex flex-col gap-3 border-t border-gray-200 py-3.5">
            <div className="flex items-start justify-between gap-3">
              <CompanyCell row={r} />
              <Chip tone={CHIP[r.status]}>{COMPANY_STATUS_LABELS[r.status]}</Chip>
            </div>
            <p className="pl-12 text-[13px] text-gray-600">
              <span className="block truncate">
                {r.owner.name} · {r.owner.email}
              </span>
              <span className="block">
                {r.staff ? `${r.staff} staff · ` : ""}
                {lastActive(r, day)}
              </span>
            </p>
            <div className="flex items-center justify-between gap-3 pl-12">
              <div className="w-32">
                <PlanSelect row={r} plans={plans} />
              </div>
              <ManageMenu row={r} />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

function CompanyCell({ row }: { row: CompanyRow }) {
  return (
    <span className="flex min-w-0 items-center gap-3">
      <Avatar name={row.name.replace(/&/g, " ")} size={36} square tone={TILE[row.status]} />
      <span className="min-w-0">
        <span className="block truncate font-semibold">{row.name}</span>
        <span className="block truncate text-[13px] text-gray-600">{row.city || "—"}</span>
      </span>
    </span>
  );
}

function PlanSelect({ row, plans }: { row: CompanyRow; plans: PlanOption[] }) {
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  return (
    <select
      aria-label={`${row.name} plan`}
      value={row.planId ?? ""}
      disabled={pending}
      onChange={(e) => {
        const plan = plans.find((p) => p.id === e.target.value);
        if (!plan) return;
        startTransition(async () => {
          const result = await changePlan(row.id, plan.id, plan.name, row.name);
          toast(result?.error ?? result?.toast ?? "Plan updated");
        });
      }}
      className={`${inputBase} h-[38px] w-full px-2 text-sm`}
    >
      {!row.planId && <option value="">No plan</option>}
      {plans.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </select>
  );
}

function ManageMenu({ row }: { row: CompanyRow }) {
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [link, setLink] = useState<{ title: string; note: string; url: string } | null>(null);

  const run = (action: Parameters<typeof companyAction>[1], confirmText?: string) => () => {
    if (confirmText && !confirm(confirmText)) return;
    startTransition(async () => {
      const result = await companyAction(row.id, action, row.name, row.owner.email);
      toast(result?.error ?? result?.toast ?? "Done");
      const url = result?.data?.url;
      if (url && action === "resend") {
        setLink({ title: "Invite Link", note: `Send this to ${row.owner.name}. Older links no longer work.`, url });
      }
      if (url && action === "reset-owner-password") {
        setLink({ title: "Password Reset Link", note: `Send this to ${row.owner.name}. It works once and expires in 1 hour.`, url });
      }
    });
  };

  const items: MenuItem[] =
    row.status === "invited"
      ? [
          { label: "Resend", onSelect: run("resend") },
          { label: "Revoke Invite", onSelect: run("revoke", `Revoke the invite to ${row.name}?`), danger: true },
        ]
      : row.status === "suspended"
        ? [
            { label: "Reactivate", onSelect: run("reactivate") },
            {
              label: "Delete Company",
              onSelect: run("delete", `Delete ${row.name} and all of its data? This can't be undone.`),
              danger: true,
            },
          ]
        : [
            { label: "Reset Owner Password", onSelect: run("reset-owner-password") },
            { label: "Suspend", onSelect: run("suspend", `Suspend ${row.name}? Everyone at the salon will be signed out.`), danger: true },
          ];

  return (
    <>
      <Menu label={pending ? "Working…" : "Manage"} items={items} disabled={pending} />
      {link && <LinkDialog {...link} onClose={() => setLink(null)} />}
    </>
  );
}

/** Search box that keeps the current filter and updates `?q=` as you type. */
export function CompanySearch({ initial }: { initial: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [value, setValue] = useState(initial);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (value === (params.get("q") ?? "")) return;
      const next = new URLSearchParams(params);
      if (value) next.set("q", value);
      else next.delete("q");
      router.replace(`${pathname}?${next}`, { scroll: false });
    }, 250);
    return () => clearTimeout(timer);
  }, [value, params, pathname, router]);

  return (
    <input
      type="search"
      aria-label="Search companies"
      placeholder="Search company, owner or email"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      className={`${inputBase} h-10 w-full px-3.5 text-sm sm:w-[300px]`}
    />
  );
}
