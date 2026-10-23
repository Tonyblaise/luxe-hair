"use server";

import { expenseCreateSchema, formatKES } from "@luxe-hair/shared";
import { fail, firstIssue, mutate, type ActionState } from "@/lib/action";
import { api, unwrap } from "@/lib/api";

export async function createExpense(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = expenseCreateSchema.safeParse({
    amount: formData.get("amount"),
    category: formData.get("category"),
    description: formData.get("description"),
    date: formData.get("date") || undefined,
    repeatsMonthly: formData.get("repeatsMonthly") ?? undefined,
  });
  if (!parsed.success) return fail(firstIssue(parsed.error, "Enter an amount, a category and a description."));

  const receipt = formData.get("receipt");
  const form = {
    amount: String(parsed.data.amount),
    category: parsed.data.category,
    description: parsed.data.description,
    ...(parsed.data.date ? { date: parsed.data.date } : {}),
    repeatsMonthly: parsed.data.repeatsMonthly ? ("true" as const) : ("false" as const),
    ...(receipt instanceof File && receipt.size > 0 ? { receipt } : {}),
  };

  const client = await api();
  return mutate(async () => unwrap(await client.expenses.$post({ form })), {
    toast: `Expense added · ${formatKES(parsed.data.amount)}`,
  });
}
