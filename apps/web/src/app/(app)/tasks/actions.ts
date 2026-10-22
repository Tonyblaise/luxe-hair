"use server";

import { formatShortDate, taskCreateSchema } from "@luxe-hair/shared";
import { fail, firstIssue, mutate, type ActionState } from "@/lib/action";
import { api, unwrap } from "@/lib/api";

export async function toggleTask(id: string, done: boolean, _: ActionState): Promise<ActionState> {
  const client = await api();
  return mutate(
    async () => unwrap(await client.tasks[":id"].$patch({ param: { id }, json: { done } })),
    {
      toast: (r) => {
        const result = r as { next: string | null };
        if (!done) return "Marked as open";
        return result.next ? `Done · next one set for ${formatShortDate(new Date(result.next))}` : "Done";
      },
    },
  );
}

export async function createTask(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = taskCreateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(firstIssue(parsed.error, "Add a title and a due date."));
  const client = await api();
  return mutate(async () => unwrap(await client.tasks.$post({ json: parsed.data })), {
    toast: `${parsed.data.type === "task" ? "Task" : "Reminder"} added`,
  });
}

export async function deleteTask(id: string, _: ActionState): Promise<ActionState> {
  const client = await api();
  return mutate(async () => unwrap(await client.tasks[":id"].$delete({ param: { id } })), {
    toast: "Task deleted",
  });
}
