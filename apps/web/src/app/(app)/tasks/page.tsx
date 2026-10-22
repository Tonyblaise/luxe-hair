import { toISODate, todayDate } from "@luxe-hair/shared";
import { DeleteButton } from "@/components/delete-button";
import { ActionLabel, PageBody, PageHeader } from "@/components/shell/page";
import { TaskToggle } from "@/components/task-toggle";
import { Card, CardHeader, Chip, EmptyState, ModalLink, PillLink, PillRow, buttonClass } from "@/components/ui";
import { api, unwrapAll } from "@/lib/api";
import { taskChip, taskMeta } from "@/lib/tasks";
import { deleteTask } from "./actions";
import { AddTaskModal } from "./add-task-modal";

const FILTERS = [
  { value: "open", label: "Open" },
  { value: "today", label: "Today" },
  { value: "overdue", label: "Overdue" },
  { value: "upcoming", label: "Upcoming" },
  { value: "done", label: "Done" },
] as const;
type Filter = (typeof FILTERS)[number]["value"];

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const raw = (await searchParams).filter;
  const filter: Filter = FILTERS.some((f) => f.value === raw) ? (raw as Filter) : "open";
  const client = await api();
  const [{ tasks, counts }, { employees }] = await unwrapAll(
    client.tasks.$get({ query: { filter } }),
    client.employees.$get(),
  );
  const today = todayDate();
  const assignees = [
    "Owner",
    "Front desk",
    ...employees.filter((e) => e.status === "active").map((e) => `${e.firstName} ${e.lastName}`),
  ];

  return (
    <>
      <PageHeader
        title="Tasks & Reminders"
        action={
          <ModalLink id="add-task" className={buttonClass("primary")}>
            <ActionLabel label="Add Task" short="+ Add" />
          </ModalLink>
        }
      />
      <PageBody>
        <Card>
          <CardHeader title="To Do" />
          <PillRow>
            {FILTERS.map((f) => (
              <PillLink key={f.value} href={`?filter=${f.value}`} active={f.value === filter}>
                {f.label} ({counts[f.value]})
              </PillLink>
            ))}
          </PillRow>
          {tasks.length === 0 ? (
            <EmptyState>Nothing here. You&apos;re all caught up.</EmptyState>
          ) : (
            <ul>
              {tasks.map((t) => {
                const chip = taskChip(t, today);
                const done = t.status === "done";
                return (
                  <li key={t.id} className="grid grid-cols-[36px_minmax(0,1fr)_auto] items-start gap-x-3 border-t border-gray-200 py-3 sm:grid-cols-[36px_minmax(0,1fr)_auto_auto] sm:items-center">
                    <TaskToggle id={t.id} title={t.title} done={done} />
                    <span className="min-w-0">
                      <span className={`block text-[15px] font-semibold ${done ? "text-gray-500 line-through" : ""}`}>
                        {t.title}
                      </span>
                      <span className="block text-[13px] text-gray-600">{taskMeta(t)}</span>
                      <span className="mt-1.5 block sm:hidden">
                        <Chip tone={chip.tone}>{chip.label}</Chip>
                      </span>
                    </span>
                    <span className="max-sm:hidden">
                      <Chip tone={chip.tone}>{chip.label}</Chip>
                    </span>
                    <DeleteButton action={deleteTask.bind(null, t.id)} confirmText={`Delete "${t.title}"?`} />
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </PageBody>
      <AddTaskModal assignees={assignees} today={toISODate(today)} />
    </>
  );
}
