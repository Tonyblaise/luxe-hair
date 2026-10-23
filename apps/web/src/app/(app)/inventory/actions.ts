"use server";

import { productSchema } from "@luxe-hair/shared";
import { fail, firstIssue, mutate, type ActionState } from "@/lib/action";
import { api, unwrap } from "@/lib/api";

export async function adjustStock(id: string, delta: number): Promise<ActionState> {
  const client = await api();
  return mutate(async () => unwrap(await client.inventory[":id"].adjust.$patch({ param: { id }, json: { delta } })));
}

/** Creates a product, or updates it when `id` is given. */
export async function saveProduct(id: string | null, _: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = productSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const client = await api();
  const json = parsed.data;
  return mutate(
    async () =>
      unwrap(
        id
          ? await client.inventory[":id"].$patch({ param: { id }, json })
          : await client.inventory.$post({ json }),
      ),
    { toast: `${parsed.data.name} ${id ? "updated" : "added"}` },
  );
}

export async function deleteProduct(id: string, name: string): Promise<ActionState> {
  const client = await api();
  return mutate(async () => unwrap(await client.inventory[":id"].$delete({ param: { id } })), {
    toast: `${name} deleted`,
  });
}
