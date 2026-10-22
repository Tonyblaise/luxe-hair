"use server";

import { employeeCreateSchema, employeeUpdateSchema, type EmployeeUpdateInput } from "@luxe-hair/shared";
import { redirect } from "next/navigation";
import { fail, firstIssue, mutate, type ActionState } from "@/lib/action";
import { api, unwrap } from "@/lib/api";

export async function updateEmployee(id: string, patch: EmployeeUpdateInput, toast: string): Promise<ActionState> {
  const parsed = employeeUpdateSchema.safeParse(patch);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const client = await api();
  return mutate(
    async () => unwrap(await client.employees[":id"].$patch({ param: { id }, json: parsed.data })),
    { toast },
  );
}

export async function createEmployee(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = employeeCreateSchema.safeParse({
    ...Object.fromEntries(formData),
    serviceIds: formData.getAll("serviceIds"),
  });
  if (!parsed.success) return fail(firstIssue(parsed.error, "Enter a name and pick their services."));
  const client = await api();
  let id = "";
  const result = await mutate(async () => {
    id = (await unwrap(await client.employees.$post({ json: parsed.data }))).id;
  });
  if (!result?.ok) return result;
  redirect(`/employees?emp=${id}`);
}
