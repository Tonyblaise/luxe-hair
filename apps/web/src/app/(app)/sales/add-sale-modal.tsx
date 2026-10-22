"use client";

import { PAYMENT_LABELS, PAYMENT_METHODS, formatKES } from "@luxe-hair/shared";
import { useActionState, useState } from "react";
import { Button, Field, FormError, Modal, Notice, Segmented, SelectField, useActionFeedback, useCloseModal } from "@/components/ui";
import { createSale } from "./actions";

type Options = {
  services: { id: string; name: string; price: number }[];
  employees: { id: string; firstName: string; name: string; serviceIds: string[] }[];
};

export function AddSaleModal({ options, today }: { options: Options; today: string }) {
  return (
    <Modal id="add-sale" title="Add Sale">
      <AddSaleForm options={options} today={today} />
    </Modal>
  );
}

function AddSaleForm({ options, today }: { options: Options; today: string }) {
  const close = useCloseModal();
  const [state, action, pending] = useActionState(createSale, undefined);
  useActionFeedback(state, close);

  const [serviceId, setServiceId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [amount, setAmount] = useState("");

  const employee = options.employees.find((e) => e.id === employeeId);
  const notSetUp = employee && serviceId && !employee.serviceIds.includes(serviceId);

  return (
    <form action={action} className="flex flex-col gap-4">
      <FormError message={state?.error} />
      <SelectField
        label="Service"
        name="serviceId"
        required
        value={serviceId}
        onChange={(e) => {
          setServiceId(e.target.value);
          const s = options.services.find((x) => x.id === e.target.value);
          if (s) setAmount(String(s.price));
        }}
      >
        <option value="" disabled>
          Choose a service
        </option>
        {options.services.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name} · {formatKES(s.price)}
          </option>
        ))}
      </SelectField>
      <SelectField label="Employee" name="employeeId" required value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
        <option value="" disabled>
          Who did it?
        </option>
        {options.employees.map((e) => (
          <option key={e.id} value={e.id}>
            {e.name}
          </option>
        ))}
      </SelectField>
      {notSetUp && <Notice>{employee.firstName} isn&apos;t set up for this service. You can still log it.</Notice>}
      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Price (KES)"
          name="amount"
          type="number"
          inputMode="numeric"
          min={0}
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <Field label="Date" name="date" type="date" required defaultValue={today} max={today} />
      </div>
      <Field label="Client (optional)" name="clientName" placeholder="e.g. Maya Torres" autoComplete="off" />
      <Segmented
        name="paymentMethod"
        label="Payment"
        defaultValue="card"
        options={PAYMENT_METHODS.map((m) => ({ value: m, label: PAYMENT_LABELS[m] }))}
      />
      <Button type="submit" size="lg" disabled={pending || !serviceId || !employeeId}>
        {pending ? "Adding…" : `Add Sale${amount ? ` · ${formatKES(Number(amount))}` : ""}`}
      </Button>
    </form>
  );
}
