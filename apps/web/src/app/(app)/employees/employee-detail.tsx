"use client";

import {
  EMPLOYEE_ROLES,
  EMPLOYMENT_LABELS,
  EMPLOYMENT_TYPES,
  WEEKDAYS,
  type EmployeeUpdateInput,
} from "@luxe-hair/shared";
import { useState, useTransition } from "react";
import { Avatar, Button, Chip, Field, FormGrid, MiniKpi, PillButton, SectionLabel, SelectField, useToast } from "@/components/ui";
import { formatKES } from "@/lib/format";
import { updateEmployee } from "./actions";

export type EmployeeView = {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  employmentType: "full_time" | "contractor";
  phone: string;
  status: "active" | "inactive";
  scheduleDays: string[];
  serviceIds: string[];
  stats: { salesThisWeek: number; payoutThisWeek: number; appointmentsToday: number };
};

const ShortLabel = ({ long, short }: { long: string; short: string }) => (
  <>
    <span className="max-sm:hidden">{long}</span>
    <span className="sm:hidden">{short}</span>
  </>
);

export function EmployeeDetail({
  employee,
  services,
}: {
  employee: EmployeeView;
  services: { id: string; name: string }[];
}) {
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [days, setDays] = useState(employee.scheduleDays);
  const [serviceIds, setServiceIds] = useState(employee.serviceIds);
  const name = `${employee.firstName} ${employee.lastName}`;
  const active = employee.status === "active";

  function save(patch: EmployeeUpdateInput, message: string) {
    startTransition(async () => {
      const result = await updateEmployee(employee.id, patch, message);
      toast(result?.error ?? result?.toast ?? message);
    });
  }

  const onBlurText = (field: "firstName" | "lastName" | "phone") => (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    if (value === employee[field] || (field !== "phone" && !value)) return;
    save({ [field]: value }, "Details saved");
  };

  const toggleDay = (day: string) => {
    const next = days.includes(day) ? days.filter((d) => d !== day) : [...days, day];
    const ordered = WEEKDAYS.filter((d) => next.includes(d));
    setDays(ordered);
    save({ scheduleDays: ordered }, "Schedule saved");
  };

  const toggleService = (id: string) => {
    const next = serviceIds.includes(id) ? serviceIds.filter((s) => s !== id) : [...serviceIds, id];
    setServiceIds(next);
    save({ serviceIds: next }, "Services saved");
  };

  return (
    <div className={`flex flex-col gap-7 transition-ui ${pending ? "opacity-80" : ""}`}>
      <div className="flex flex-wrap items-center gap-4">
        <Avatar name={name} tone="navy" size={64} className="max-sm:size-[52px]!" />
        <div className="min-w-0 flex-1">
          <h2 className="text-[clamp(22px,5vw,26px)] leading-tight font-bold">{name}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-600">
            <span>
              {employee.role} · {EMPLOYMENT_LABELS[employee.employmentType]}
            </span>
            <Chip tone={active ? "info" : "neutral"}>{active ? "Active" : "Inactive"}</Chip>
          </div>
        </div>
        <div className="max-sm:basis-full max-sm:pl-[68px]">
          <Button
            variant="outline"
            onClick={() =>
              save({ status: active ? "inactive" : "active" }, `${name} ${active ? "deactivated" : "reactivated"}`)
            }
          >
            {active ? "Deactivate" : "Reactivate"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <MiniKpi label={<ShortLabel long="Sales This Week" short="Sales · Wk" />} value={formatKES(employee.stats.salesThisWeek)} />
        <MiniKpi label={<ShortLabel long="Payout This Week" short="Payout · Wk" />} value={formatKES(employee.stats.payoutThisWeek)} />
        <MiniKpi label={<ShortLabel long="Appointments Today" short="Appts Today" />} value={employee.stats.appointmentsToday} />
      </div>

      <section className="flex flex-col gap-4">
        <SectionLabel>Details</SectionLabel>
        <FormGrid>
          <Field label="First name" defaultValue={employee.firstName} onBlur={onBlurText("firstName")} />
          <Field label="Last name" defaultValue={employee.lastName} onBlur={onBlurText("lastName")} />
          <SelectField
            label="Role"
            defaultValue={employee.role}
            onChange={(e) => save({ role: e.target.value as (typeof EMPLOYEE_ROLES)[number] }, "Role saved")}
          >
            {EMPLOYEE_ROLES.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </SelectField>
          <SelectField
            label="Employment type"
            defaultValue={employee.employmentType}
            onChange={(e) =>
              save({ employmentType: e.target.value as EmployeeView["employmentType"] }, "Employment type saved")
            }
          >
            {EMPLOYMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {EMPLOYMENT_LABELS[t]}
              </option>
            ))}
          </SelectField>
          <Field label="Phone" type="tel" defaultValue={employee.phone} onBlur={onBlurText("phone")} />
        </FormGrid>
      </section>

      <section className="flex flex-col gap-4">
        <SectionLabel>
          Weekly schedule · {days.length} {days.length === 1 ? "day" : "days"} a week
        </SectionLabel>
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {WEEKDAYS.map((d) => {
            const on = days.includes(d);
            return (
              <button
                key={d}
                type="button"
                aria-pressed={on}
                onClick={() => toggleDay(d)}
                className={`h-9 rounded-md text-sm font-semibold transition-ui sm:h-11 ${
                  on ? "bg-navy-800 text-white" : "border border-gray-300 bg-white text-navy-800 hover:bg-paper"
                }`}
              >
                <span className="max-sm:hidden">{d}</span>
                <span className="sm:hidden">{d.slice(0, 2)}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionLabel>Services they perform</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {services.map((s) => (
            <PillButton key={s.id} active={serviceIds.includes(s.id)} onClick={() => toggleService(s.id)}>
              {s.name}
            </PillButton>
          ))}
        </div>
      </section>
    </div>
  );
}
