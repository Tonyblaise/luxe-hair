"use client";

import { EMPLOYMENT_LABELS, EMPLOYMENT_TYPES } from "@luxe-hair/shared";
import Link from "next/link";
import { useActionState, useState } from "react";
import { Button, Field, FormError, FormGrid, PillButton, SelectField } from "@/components/ui";
import { createEmployee } from "./actions";

export function NewEmployeeCard({ services }: { services: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(createEmployee, undefined);
  const [picked, setPicked] = useState<string[]>([]);
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  return (
    <form action={action} className="flex max-w-[720px] flex-col gap-5">
      <h2 className="text-[clamp(22px,5vw,26px)] leading-tight font-bold">New Employee</h2>
      <FormError message={state?.error} />
      <FormGrid>
        <Field label="First name" name="firstName" required placeholder="e.g. Maria" />
        <Field label="Last name" name="lastName" required placeholder="e.g. Gomez" />
        <SelectField label="Employment type" name="employmentType" defaultValue="full_time">
          {EMPLOYMENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {EMPLOYMENT_LABELS[t]}
            </option>
          ))}
        </SelectField>
        <Field label="Phone" name="phone" type="tel" />
      </FormGrid>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-[13px] font-medium text-gray-600">Services they perform</legend>
        {services.length === 0 ? (
          <p className="text-sm text-gray-600">
            Your salon has no services yet.{" "}
            <Link href="/services?modal=add-service" className="font-semibold text-cyan-600 hover:underline">
              Add a service
            </Link>{" "}
            first.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {services.map((s) => (
              <PillButton key={s.id} active={picked.includes(s.id)} onClick={() => toggle(s.id)}>
                {s.name}
              </PillButton>
            ))}
          </div>
        )}
        {picked.map((id) => (
          <input key={id} type="hidden" name="serviceIds" value={id} />
        ))}
      </fieldset>

      <p className="text-[13px] text-gray-500">You can set their schedule after adding them.</p>
      <div>
        <Button type="submit" size="lg" disabled={pending || picked.length === 0}>
          {pending ? "Adding…" : "Add Employee"}
        </Button>
      </div>
    </form>
  );
}
