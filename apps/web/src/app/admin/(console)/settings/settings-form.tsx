"use client";

import { useState, useTransition } from "react";
import { Button, Card, CardHeader, Field, FormError, Switch, inputBase, useToast } from "@/components/ui";
import { AdminPageHeader } from "../page-header";
import { saveSettings } from "./actions";

type Plan = { id: string; name: string; price: number; employeeLimit: number | null; companies: number };
export type SettingsView = {
  platformName: string;
  supportEmail: string;
  supportPhone: string;
  trialDays: number;
  inviteDays: number;
  notifySignup: boolean;
  notifyTrialEnd: boolean;
  notifyOverdue: boolean;
  notifyWeekly: boolean;
  plans: Plan[];
};

const NOTIFICATIONS = [
  { key: "notifySignup", label: "New company signs up", sub: "When an invite is accepted" },
  { key: "notifyTrialEnd", label: "Trial ending", sub: "3 days before a trial ends" },
  { key: "notifyOverdue", label: "Payment overdue", sub: "When a company misses a payment" },
  { key: "notifyWeekly", label: "Weekly summary", sub: "Every Monday morning" },
] as const;

export function SettingsForm({ initial }: { initial: SettingsView }) {
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [s, setS] = useState(initial);
  const [days, setDays] = useState({ trial: String(initial.trialDays), invite: String(initial.inviteDays) });
  // Numbers stay as strings while typing so fields can be cleared.
  const [plans, setPlans] = useState(
    initial.plans.map((p) => ({ ...p, price: String(p.price), limit: p.employeeLimit == null ? "" : String(p.employeeLimit) })),
  );

  const set = <K extends keyof SettingsView>(key: K, value: SettingsView[K]) => setS((prev) => ({ ...prev, [key]: value }));
  const setPlan = (id: string, patch: Partial<(typeof plans)[number]>) =>
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  function save() {
    const { plans: _, ...fields } = s;
    startTransition(async () => {
      const result = await saveSettings({
        ...fields,
        trialDays: Number(days.trial),
        inviteDays: Number(days.invite),
        plans: plans.map((p) => ({ id: p.id, price: Number(p.price), employeeLimit: p.limit === "" ? null : Number(p.limit) })),
      });
      setError(result?.error);
      if (result?.toast) toast(result.toast);
    });
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Platform"
        title="Settings"
        action={
          <Button className="px-5!" disabled={pending} onClick={save}>
            {pending ? "Saving…" : "Save Changes"}
          </Button>
        }
      />
      <FormError message={error} />

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="General" />
          <Field label="Platform name" value={s.platformName} onChange={(e) => set("platformName", e.target.value)} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Support email" type="email" value={s.supportEmail} onChange={(e) => set("supportEmail", e.target.value)} />
            <Field label="Support phone" type="tel" value={s.supportPhone} onChange={(e) => set("supportPhone", e.target.value)} />
            <Field
              label="Free trial (days)"
              type="number"
              min={0}
              value={days.trial}
              onChange={(e) => setDays((d) => ({ ...d, trial: e.target.value }))}
            />
            <Field
              label="Invite expiry (days)"
              type="number"
              min={1}
              value={days.invite}
              onChange={(e) => setDays((d) => ({ ...d, invite: e.target.value }))}
            />
          </div>
        </Card>

        <Card>
          <CardHeader title="Email Notifications" caption="Sent to your admin email." />
          <ul>
            {NOTIFICATIONS.map((n) => (
              <li key={n.key} className="flex items-center justify-between gap-4 border-t border-gray-200 py-3.5">
                <span>
                  <span className="block text-[15px] font-semibold">{n.label}</span>
                  <span className="block text-[13px] text-gray-600">{n.sub}</span>
                </span>
                <Switch label={n.label} checked={s[n.key]} onChange={(v) => set(n.key, v)} />
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card>
        <div className="flex flex-col gap-1">
          <CardHeader title="Plans" />
          <p className="text-sm text-gray-600">
            Monthly price in KES and employee limit per plan. Leave the limit empty for unlimited.
          </p>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[560px]">
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(120px,200px)_minmax(120px,200px)_100px] gap-3 pb-2 text-xs font-medium tracking-[0.04em] text-gray-500 uppercase">
              <span>Plan</span>
              <span>Price / Month (KES)</span>
              <span>Employee Limit</span>
              <span className="text-right">Companies</span>
            </div>
            <ul>
              {plans.map((p) => (
                <li
                  key={p.id}
                  className="grid grid-cols-[minmax(0,1fr)_minmax(120px,200px)_minmax(120px,200px)_100px] items-center gap-3 border-t border-gray-200 py-3"
                >
                  <span className="font-semibold">{p.name}</span>
                  <input
                    aria-label={`${p.name} price`}
                    type="number"
                    min={0}
                    value={p.price}
                    onChange={(e) => setPlan(p.id, { price: e.target.value })}
                    className={`${inputBase} w-full px-3 tabular-nums`}
                  />
                  <input
                    aria-label={`${p.name} employee limit`}
                    type="number"
                    min={1}
                    placeholder="Unlimited"
                    value={p.limit}
                    onChange={(e) => setPlan(p.id, { limit: e.target.value })}
                    className={`${inputBase} w-full px-3 tabular-nums`}
                  />
                  <span className="text-right tabular-nums">{p.companies}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>
    </>
  );
}
