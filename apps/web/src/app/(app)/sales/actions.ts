"use server";

import { formatKES, saleCreateSchema } from "@luxe-hair/shared";
import { fail, firstIssue, mutate, type ActionState } from "@/lib/action";
import { api, unwrap } from "@/lib/api";

export async function createSale(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = saleCreateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(firstIssue(parsed.error, "Pick a service, an employee and a price."));
  const client = await api();
  return mutate(async () => unwrap(await client.sales.$post({ json: parsed.data })), {
    toast: `Sale added · ${formatKES(parsed.data.amount)}`,
  });
}

export async function deleteSale(id: string, _: ActionState): Promise<ActionState> {
  const client = await api();
  return mutate(async () => unwrap(await client.sales[":id"].$delete({ param: { id } })), {
    toast: "Sale removed",
  });
}
