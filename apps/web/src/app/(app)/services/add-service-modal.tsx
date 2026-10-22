"use client";

import { commissionFor } from "@luxe-hair/shared";
import { useActionState, useState } from "react";
import { Button, Field, FormError, Modal, inputBase, inputClass, useActionFeedback, useCloseModal } from "@/components/ui";
import { formatKES } from "@/lib/format";
import { createService } from "./actions";

export function AddServiceModal() {
  return (
    <Modal id="add-service" title="Add Service">
      <AddServiceForm />
    </Modal>
  );
}

function AddServiceForm() {
  const close = useCloseModal();
  const [state, action, pending] = useActionState(createService, undefined);
  useActionFeedback(state, close);
  const [price, setPrice] = useState("");
  const [commission, setCommission] = useState("");
  const [type, setType] = useState<"percent" | "flat">("percent");

  const ready = price !== "" && commission !== "";
  const earns = commissionFor({ commissionType: type, commission: Number(commission) }, Number(price));

  return (
    <form action={action} className="flex flex-col gap-4">
      <FormError message={state?.error} />
      <Field label="Service name" name="name" placeholder="e.g. Keratin Treatment" required autoComplete="off" />
      <Field
        label="Amount (KES)"
        name="price"
        type="number"
        inputMode="numeric"
        min={0}
        required
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      />
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-medium text-gray-600">Commission</span>
        <span className="flex gap-2">
          <input
            name="commission"
            type="number"
            inputMode="numeric"
            min={0}
            max={type === "percent" ? 100 : undefined}
            required
            value={commission}
            onChange={(e) => setCommission(e.target.value)}
            className={inputClass}
          />
          <select
            name="commissionType"
            aria-label="Commission type"
            value={type}
            onChange={(e) => setType(e.target.value as "percent" | "flat")}
            className={`${inputBase} w-44 shrink-0 px-2.5`}
          >
            <option value="percent">% of price</option>
            <option value="flat">KES per service</option>
          </select>
        </span>
        <span className="text-[13px] text-gray-500">
          {ready ? `Employee earns ${formatKES(earns)} each time.` : "Set a percentage of the price or a flat amount."}
        </span>
      </label>
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Adding…" : "Add Service"}
      </Button>
    </form>
  );
}
