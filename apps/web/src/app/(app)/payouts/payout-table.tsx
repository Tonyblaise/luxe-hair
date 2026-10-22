"use client";

import { RETAIL_COMMISSION_PCT } from "@luxe-hair/shared";
import { Fragment, useState } from "react";
import { Avatar, Chip } from "@/components/ui";
import { formatKES } from "@/lib/format";
import { PayButton } from "./pay-button";

type Line = { serviceId: string; name: string; count: number; price: number; commissionType: "percent" | "flat"; commission: number; earned: number };
export type PayoutRowView = {
  employeeId: string;
  name: string;
  role: string;
  serviceSales: number;
  serviceCommission: number;
  retailSales: number;
  retailCommission: number;
  tips: number;
  total: number;
  status: "pending" | "paid";
  lines: Line[];
};

function Breakdown({ row }: { row: PayoutRowView }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-md bg-paper p-3.5 text-[13px] sm:ml-[42px]">
      {row.lines.map((l) => (
        <div key={l.serviceId} className="grid grid-cols-[1fr_auto] gap-x-3 sm:grid-cols-[minmax(140px,1.4fr)_1fr_90px_110px]">
          <span className="font-semibold">{l.name}</span>
          <span className="text-gray-600 tabular-nums max-sm:hidden">
            {l.count} × {formatKES(l.price)}
          </span>
          <span className="text-gray-600 tabular-nums max-sm:hidden">
            {l.commissionType === "percent" ? `${l.commission}%` : `${formatKES(l.commission)} each`}
          </span>
          <span className="text-right font-semibold tabular-nums">{formatKES(l.earned)}</span>
          <span className="col-span-2 text-gray-600 sm:hidden">
            {l.count} × {formatKES(l.price)} · {l.commissionType === "percent" ? `${l.commission}%` : `${formatKES(l.commission)} each`}
          </span>
        </div>
      ))}
      <div className="grid grid-cols-[1fr_auto] gap-x-3 border-t border-gray-200 pt-1.5 sm:grid-cols-[minmax(140px,1.4fr)_1fr_90px_110px]">
        <span className="font-semibold">Retail sales</span>
        <span className="text-gray-600 tabular-nums max-sm:hidden">{formatKES(row.retailSales)}</span>
        <span className="text-gray-600 max-sm:hidden">{RETAIL_COMMISSION_PCT}%</span>
        <span className="text-right font-semibold tabular-nums">{formatKES(row.retailCommission)}</span>
      </div>
    </div>
  );
}

const status = (row: PayoutRowView) =>
  row.status === "paid" ? (
    <Chip tone="neutral">Paid</Chip>
  ) : (
    <PayButton employeeIds={[row.employeeId]} confirmText={`Mark ${row.name}'s ${formatKES(row.total)} as paid?`} className="max-sm:h-10">
      Mark Paid
    </PayButton>
  );

export function PayoutTable({ rows }: { rows: PayoutRowView[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const toggle = (id: string) => setOpen((cur) => (cur === id ? null : id));

  return (
    <>
      <div className="overflow-x-auto max-sm:hidden">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="text-xs font-medium tracking-[0.04em] text-gray-500 uppercase">
              <th className="py-2 pr-3 font-medium">Staff</th>
              <th className="px-3 py-2 text-right font-medium">Service Sales</th>
              <th className="px-3 py-2 text-right font-medium">Service Comm.</th>
              <th className="px-3 py-2 text-right font-medium">Retail Comm.</th>
              <th className="px-3 py-2 text-right font-medium">Tips</th>
              <th className="px-3 py-2 text-right font-medium">Payout</th>
              <th className="py-2 pl-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <Fragment key={r.employeeId}>
                <tr
                  onClick={() => toggle(r.employeeId)}
                  aria-expanded={open === r.employeeId}
                  className="cursor-pointer border-t border-gray-200 transition-ui hover:bg-paper"
                >
                  <td className="py-3 pr-3">
                    <span className="flex items-center gap-2.5">
                      <Avatar name={r.name} size={32} />
                      <span className="min-w-0">
                        <span className="block font-semibold">{r.name}</span>
                        <span className="block text-xs text-gray-500">{r.role}</span>
                      </span>
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">{formatKES(r.serviceSales)}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{formatKES(r.serviceCommission)}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{formatKES(r.retailCommission)}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{formatKES(r.tips)}</td>
                  <td className="px-3 py-3 text-right font-bold tabular-nums">{formatKES(r.total)}</td>
                  <td className="py-3 pl-3">{status(r)}</td>
                </tr>
                {open === r.employeeId && (
                  <tr>
                    <td colSpan={7} className="pb-3">
                      <Breakdown row={r} />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="sm:hidden">
        {rows.map((r) => (
          <li key={r.employeeId} className="flex flex-col gap-2.5 border-t border-gray-200 py-3.5">
            <button
              type="button"
              onClick={() => toggle(r.employeeId)}
              aria-expanded={open === r.employeeId}
              className="flex items-center gap-3 text-left"
            >
              <Avatar name={r.name} size={36} />
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{r.name}</span>
                <span className="block text-xs text-gray-600">
                  Sales {formatKES(r.serviceSales)} · Tips {formatKES(r.tips)}
                </span>
              </span>
              <span className="text-[17px] font-bold tabular-nums">{formatKES(r.total)}</span>
            </button>
            <div className="flex items-center justify-between gap-3 pl-12">
              <p className="text-xs text-gray-600">
                Service {formatKES(r.serviceCommission)} · Retail {formatKES(r.retailCommission)}
              </p>
              {status(r)}
            </div>
            {open === r.employeeId && <Breakdown row={r} />}
          </li>
        ))}
      </ul>
    </>
  );
}
