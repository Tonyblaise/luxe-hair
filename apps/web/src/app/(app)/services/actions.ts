"use server";

import { serviceCreateSchema, serviceUpdateSchema, type ServiceUpdateInput } from "@luxe-hair/shared";
import { fail, firstIssue, mutate, type ActionState } from "@/lib/action";
import { api, unwrap } from "@/lib/api";

export async function createService(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = serviceCreateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(firstIssue(parsed.error, "Enter a name, an amount and a commission."));
  const client = await api();
  return mutate(async () => unwrap(await client.services.$post({ json: parsed.data })), {
    toast: `${parsed.data.name} added`,
  });
}

export async function updateService(id: string, patch: ServiceUpdateInput): Promise<ActionState> {
  const parsed = serviceUpdateSchema.safeParse(patch);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const client = await api();
  return mutate(
    async () => unwrap(await client.services[":id"].$patch({ param: { id }, json: parsed.data })),
    { toast: "Service updated" },
  );
}

export async function deleteService(id: string, _: ActionState): Promise<ActionState> {
  const client = await api();
  return mutate(async () => unwrap(await client.services[":id"].$delete({ param: { id } })), {
    toast: "Service deleted",
  });
}
