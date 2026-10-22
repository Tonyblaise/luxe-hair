"use client";

import { useActionState } from "react";
import { toggleTask } from "@/app/(app)/tasks/actions";
import { TaskCheck } from "@/components/ui/task-check";
import { useActionFeedback } from "@/components/ui/toast";

export function TaskToggle({ id, title, done, size = 28 }: { id: string; title: string; done: boolean; size?: number }) {
  const [state, action, pending] = useActionState(toggleTask.bind(null, id, !done), undefined);
  useActionFeedback(state);

  return (
    <form action={action} className="flex">
      <button
        type="submit"
        disabled={pending}
        aria-label={done ? `Mark "${title}" as not done` : `Mark "${title}" as done`}
        className="rounded-[8px] disabled:opacity-60"
      >
        <TaskCheck done={done} size={size} />
      </button>
    </form>
  );
}
