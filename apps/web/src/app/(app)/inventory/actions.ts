"use server";

import { mutate, type ActionState } from "@/lib/action";
import { api, unwrap } from "@/lib/api";

export async function adjustStock(id: string, delta: number): Promise<ActionState> {
  const client = await api();
  return mutate(async () => unwrap(await client.inventory[":id"].adjust.$patch({ param: { id }, json: { delta } })));
}
