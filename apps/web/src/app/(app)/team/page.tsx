import { TEAM_ROLE_LABELS, TIME_ZONE, daysBetween, formatShortDate, todayDate } from "@luxe-hair/shared";
import { ActionLabel, PageBody, PageHeader } from "@/components/shell/page";
import { Avatar, Card, CardHeader, Chip, EmptyState, ModalLink, PillLink, PillRow, buttonClass } from "@/components/ui";
import { api, unwrapAll } from "@/lib/api";
import { InviteModal } from "./invite-modal";
import { MemberActions } from "./member-actions";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "invited", label: "Invited" },
] as const;
type Filter = (typeof FILTERS)[number]["value"];

const clock = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: TIME_ZONE });
const localDate = (iso: string) => {
  const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(new Date(iso));
  return new Date(`${ymd}T00:00:00Z`);
};

function activity(m: { status: string; lastActive: string | null; invitedDate: string | null }) {
  if (m.status === "invited") return m.invitedDate ? `Invited ${formatShortDate(new Date(m.invitedDate))}` : "Invited";
  if (!m.lastActive) return "Not signed in yet";
  const ago = daysBetween(localDate(m.lastActive), todayDate());
  if (ago === 0) return `Active today, ${clock.format(new Date(m.lastActive))}`;
  if (ago === 1) return "Active yesterday";
  return `Active ${formatShortDate(localDate(m.lastActive))}`;
}

export default async function TeamPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const raw = (await searchParams).filter;
  const filter: Filter = FILTERS.some((f) => f.value === raw) ? (raw as Filter) : "all";
  const client = await api();
  const [members, me] = await unwrapAll(client.team.$get(), client.auth.me.$get());
  const canManage = me.teamRole === "owner" || me.teamRole === "manager";
  const counts = {
    all: members.length,
    active: members.filter((m) => m.status === "active").length,
    invited: members.filter((m) => m.status === "invited").length,
  };
  const listed = filter === "all" ? members : members.filter((m) => m.status === filter);

  return (
    <>
      <PageHeader
        title="Team"
        action={
          canManage && (
            <ModalLink id="invite" className={buttonClass("primary")}>
              <ActionLabel label="Invite Member" short="+ Invite" />
            </ModalLink>
          )
        }
      />
      <PageBody narrow>
        <Card>
          <div className="flex flex-col gap-1">
            <CardHeader title="App Users" />
            <p className="text-sm text-gray-600">
              People who can sign in to manage the salon. Separate from your employee list.
            </p>
          </div>
          <PillRow>
            {FILTERS.map((f) => (
              <PillLink key={f.value} href={`?filter=${f.value}`} active={f.value === filter}>
                {f.label} ({counts[f.value]})
              </PillLink>
            ))}
          </PillRow>
          {listed.length === 0 ? (
            <EmptyState>No one here yet.</EmptyState>
          ) : (
            <ul>
              {listed.map((m) => {
                const name = `${m.firstName} ${m.lastName}`;
                const invited = m.status === "invited";
                const showActions = canManage && m.role !== "owner" && !m.isSelf;
                return (
                  <li
                    key={m.id}
                    className="grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 border-t border-gray-200 py-3.5"
                  >
                    <Avatar name={name} tone={invited ? "invited" : "light"} />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[15px] font-semibold">{name}</span>
                        <Chip tone={invited ? "warn" : "info"}>{invited ? "Invited" : "Active"}</Chip>
                      </div>
                      <p className="truncate text-[13px] text-gray-600">
                        {TEAM_ROLE_LABELS[m.role]} · {m.email}
                      </p>
                      <p className="text-xs text-gray-500">{activity(m)}</p>
                    </div>
                    {showActions && <MemberActions id={m.id} name={name} invited={invited} />}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </PageBody>
      {canManage && <InviteModal />}
    </>
  );
}
