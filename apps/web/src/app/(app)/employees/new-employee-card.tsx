"use client";

import { EMPLOYEE_ROLES, EMPLOYMENT_LABELS, EMPLOYMENT_TYPES } from "@luxe-hair/shared";
import { useActionState } from "react";
import { Button, Field, FormError, FormGrid, SelectField } from "@/components/ui";
import { createEmployee } from "./actions";

export function NewEmployeeCard() {
  const [state, action, pending] = useActionState(createEmployee, undefined);

  return (
    <form action={action} className="flex max-w-[720px] flex-col gap-5">
      <h2 className="text-[clamp(22px,5vw,26px)] leading-tight font-bold">New Employee</h2>
      <FormError message={state?.error} />
      <FormGrid>
        <Field label="First name" name="firstName" required placeholder="e.g. Maria" />
        <Field label="Last name" name="lastName" required placeholder="e.g. Gomez" />
        <SelectField label="Role" name="role" defaultValue="Stylist">
          {EMPLOYEE_ROLES.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </SelectField>
        <SelectField label="Employment type" name="employmentType" defaultValue="full_time">
          {EMPLOYMENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {EMPLOYMENT_LABELS[t]}
            </option>
          ))}
        </SelectField>
        <Field label="Phone" name="phone" type="tel" />
      </FormGrid>
      <p className="text-[13px] text-gray-500">You can set their schedule and services after adding them.</p>
      <div>
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Adding…" : "Add Employee"}
        </Button>
      </div>
    </form>
  );
}
