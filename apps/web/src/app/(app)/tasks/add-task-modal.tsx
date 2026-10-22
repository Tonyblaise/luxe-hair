"use client";

import { TASK_REPEATS, TASK_REPEAT_LABELS } from "@luxe-hair/shared";
import { useActionState, useState } from "react";
import { Button, Field, FormError, Modal, Segmented, SelectField, useActionFeedback, useCloseModal } from "@/components/ui";
import { createTask } from "./actions";

export function AddTaskModal({ assignees, today }: { assignees: string[]; today: string }) {
  return (
    <Modal id="add-task" title="Add Task">
      <AddTaskForm assignees={assignees} today={today} />
    </Modal>
  );
}

function AddTaskForm({ assignees, today }: { assignees: string[]; today: string }) {
  const close = useCloseModal();
  const [state, action, pending] = useActionState(createTask, undefined);
  useActionFeedback(state, close);
  const [type, setType] = useState<"task" | "reminder">("task");

  return (
    <form action={action} className="flex flex-col gap-4">
      <FormError message={state?.error} />
      <Segmented
        name="type"
        label="Type"
        value={type}
        onChange={setType}
        options={[
          { value: "task", label: "Task" },
          { value: "reminder", label: "Reminder" },
        ]}
      />
      <Field
        label="What needs doing"
        name="title"
        required
        autoComplete="off"
        placeholder={type === "task" ? "e.g. Restock towels" : "e.g. Confirm Saturday bookings"}
      />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-4">
        <Field label="Due date" name="dueDate" type="date" required defaultValue={today} />
        {type === "reminder" && <Field label="Remind at" name="dueTime" type="time" required defaultValue="09:00" />}
      </div>
      <SelectField label="Assign to" name="assignedTo" defaultValue="Owner">
        {assignees.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </SelectField>
      <SelectField label="Repeats" name="repeat" defaultValue="none">
        {TASK_REPEATS.map((r) => (
          <option key={r} value={r}>
            {TASK_REPEAT_LABELS[r]}
          </option>
        ))}
      </SelectField>
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Adding…" : type === "task" ? "Add Task" : "Add Reminder"}
      </Button>
    </form>
  );
}
