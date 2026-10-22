import { daysBetween, formatShortDate, formatTime } from "@luxe-hair/shared";
import type { ChipTone } from "@/components/ui/chip";

export type TaskView = {
  id: string;
  title: string;
  type: "task" | "reminder";
  assignedTo: string;
  dueDate: string;
  dueTime: string | null;
  repeat: "none" | "daily" | "weekly" | "monthly";
  status: "open" | "done";
};

export function taskChip(t: TaskView, today: Date): { label: string; tone: ChipTone } {
  if (t.status === "done") return { label: "Done", tone: "neutral" };
  const due = new Date(t.dueDate);
  const diff = daysBetween(today, due);
  const time = t.dueTime ? ` ${formatTime(t.dueTime)}` : "";
  if (diff < 0) return { label: `Overdue · ${formatShortDate(due)}`, tone: "warn" };
  if (diff === 0) return { label: `Today${time}`, tone: "info" };
  if (diff === 1) return { label: `Tomorrow${time}`, tone: "neutral" };
  return { label: `${formatShortDate(due)}${time}`, tone: "neutral" };
}

export const taskMeta = (t: TaskView) =>
  [t.type === "task" ? "Task" : "Reminder", t.assignedTo, t.repeat !== "none" ? `Repeats ${t.repeat}` : null]
    .filter(Boolean)
    .join(" · ");
