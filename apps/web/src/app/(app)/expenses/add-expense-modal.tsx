"use client";

import { CATEGORY_LABELS, EXPENSE_CATEGORIES } from "@luxe-hair/shared";
import { useActionState, useRef, useState } from "react";
import { Button, Checkbox, Field, FormError, Modal, SelectField, useActionFeedback, useCloseModal } from "@/components/ui";
import { createExpense } from "./actions";

export function AddExpenseModal({ today }: { today: string }) {
  return (
    <Modal id="add-expense" title="Add Expense">
      <AddExpenseForm today={today} />
    </Modal>
  );
}

function AddExpenseForm({ today }: { today: string }) {
  const close = useCloseModal();
  const [state, action, pending] = useActionState(createExpense, undefined);
  useActionFeedback(state, close);
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>();

  return (
    <form action={action} className="flex flex-col gap-4">
      <FormError message={state?.error} />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Amount (KES)" name="amount" type="number" inputMode="numeric" min={1} required />
        <SelectField label="Category" name="category" defaultValue="products_supplies">
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </SelectField>
      </div>
      <Field label="Date" name="date" type="date" required defaultValue={today} max={today} />
      <Field label="Vendor or description" name="description" required placeholder="e.g. Kerra Lab color order" />
      <input
        ref={fileRef}
        type="file"
        name="receipt"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => setFileName(e.target.files?.[0]?.name)}
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="flex h-10 max-w-full items-center gap-2 self-start truncate rounded-md border border-gray-300 bg-white px-3.5 text-sm font-semibold text-navy-800 transition-ui hover:bg-paper"
      >
        {fileName ? `Receipt: ${fileName}` : "Snap or Attach Receipt"}
      </button>
      <Checkbox name="repeatsMonthly" label="Repeats monthly" />
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Adding…" : "Add Expense"}
      </Button>
    </form>
  );
}
