"use server";

import { mutate, type ActionState } from "@/lib/action";
import { api, unwrap } from "@/lib/api";

export async function checkIn(id: string, client: string, _: ActionState): Promise<ActionState> {
  const c = await api();
  return mutate(
    async () => unwrap(await c.appointments[":id"].status.$patch({ param: { id }, json: { status: "checked_in" } })),
    { toast: `${client} checked in` },
  );
}
