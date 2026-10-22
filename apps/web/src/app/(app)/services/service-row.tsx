"use client";

import { commissionFor, type ServiceUpdateInput } from "@luxe-hair/shared";
import { useState, useTransition } from "react";
import { DeleteButton } from "@/components/delete-button";
import { useToast } from "@/components/ui/toast";
import { formatKES, plural } from "@/lib/format";
import { deleteService, updateService } from "./actions";

export type ServiceView = {
  id: string;
  name: string;
  price: number;
  commissionType: "percent" | "flat";
  commission: number;
  employeeCount: number;
  inUse: boolean;
};

const control =
  "h-10 min-w-0 rounded-md border border-gray-300 bg-white text-[15px] tabular-nums outline-none transition-ui focus:border-cyan-400";
const numberInput = `${control} w-full px-3`;
const label = "text-xs font-medium text-gray-500";

export function ServiceRow({ service }: { service: ServiceView }) {
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [name, setName] = useState(service.name);
  const [price, setPrice] = useState(String(service.price));
  const [commission, setCommission] = useState(String(service.commission));
  const [type, setType] = useState(service.commissionType);

  const earns = commissionFor({ commissionType: type, commission: Number(commission) || 0 }, Number(price) || 0);

  function save(patch: ServiceUpdateInput) {
    const changed = Object.entries(patch).some(([k, v]) => service[k as keyof ServiceView] !== v);
    if (!changed) return;
    startTransition(async () => {
      const result = await updateService(service.id, patch);
      if (result?.error) {
        setError(result.error);
        setName(service.name);
        setPrice(String(service.price));
        setCommission(String(service.commission));
        setType(service.commissionType);
      } else {
        setError(undefined);
        if (result?.toast) toast(result.toast);
      }
    });
  }

  return (
    <li className={`flex flex-col gap-3 border-t border-gray-200 py-4 ${pending ? "opacity-70" : ""}`}>
      <div className="flex items-center justify-between gap-3">
        <input
          aria-label="Service name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => name.trim() && save({ name: name.trim() })}
          className="-ml-2 h-10 min-w-0 flex-1 rounded-md border border-transparent px-2 text-[15px] font-semibold outline-none transition-ui hover:border-gray-300 focus:border-cyan-400"
        />
        {service.inUse ? (
          <span className="shrink-0 text-[13px] text-gray-500">{plural(service.employeeCount, "employee")}</span>
        ) : (
          <DeleteButton action={deleteService.bind(null, service.id)} confirmText={`Delete ${service.name}?`} />
        )}
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] items-end gap-3">
        <label className="flex flex-col gap-1">
          <span className={label}>Amount (KES)</span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            onBlur={() => save({ price: Number(price) })}
            className={numberInput}
          />
        </label>
        <div className="flex flex-col gap-1">
          <span className={label}>Commission</span>
          <div className="flex gap-2">
            <input
              aria-label="Commission"
              type="number"
              min={0}
              inputMode="numeric"
              value={commission}
              onChange={(e) => setCommission(e.target.value)}
              onBlur={() => save({ commission: Number(commission) })}
              className={numberInput}
            />
            <select
              aria-label="Commission type"
              value={type}
              onChange={(e) => {
                const next = e.target.value as ServiceView["commissionType"];
                setType(next);
                save({ commissionType: next, commission: Number(commission) });
              }}
              className={`${control} w-20 shrink-0 px-2`}
            >
              <option value="percent">%</option>
              <option value="flat">KES</option>
            </select>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <span className={label}>Employee earns</span>
          <span className="flex h-10 items-center text-[15px] font-bold tabular-nums">{formatKES(earns)}</span>
        </div>
      </div>
      {error && <p className="text-[13px] text-[#b03a2e]">{error}</p>}
    </li>
  );
}
