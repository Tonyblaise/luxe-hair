"use server";

import { formatKES } from "@luxe-hair/shared";
import { mutate, type ActionState } from "@/lib/action";
import { api, unwrap } from "@/lib/api";

export async function payOut(employeeIds: string[] | null, _: ActionState): Promise<ActionState> {
  const client = await api();
  return mutate(
    async () => unwrap(await client.payouts.pay.$post({ json: employeeIds ? { employeeIds } : {} })),
    {
      toast: (r) => {
        const { paid, total, name } = r as { paid: number; total: number; name: string | null };
        if (paid === 0) return "Nothing left to pay this week";
        return name ? `${name} paid · ${formatKES(total)}` : `Paid ${paid} staff · ${formatKES(total)}`;
      },
    },
  );
}
