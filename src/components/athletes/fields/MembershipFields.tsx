"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { periodTitle } from "@/lib/domain/payments";
import type { Membership, MembershipMode } from "@/lib/domain/types";
import type { ValidationField } from "@/lib/services/athletes";
import { FieldError } from "./FieldError";
import { Segmented } from "./Segmented";

type Errors = Partial<Record<ValidationField, string>>;

/** "YYYY-MM", `offset` months from this one. */
function monthFromNow(offset: number): string {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** The months billing can start in: a year either side of this one, and the current start if it's older. */
function startMonths(current: string): string[] {
  const months = Array.from({ length: 25 }, (_, i) => monthFromNow(i - 12));
  return current < months[0] ? [current, ...months] : months;
}

/**
 * Payment mode and, for a paid plan, the agreed monthly amount and the month
 * billing starts in (this one unless the coach picks another). "Pasarela" is
 * shown but disabled — a payment gateway is out of scope for now, and hiding
 * it entirely would make the roadmap invisible to the coach.
 */
export function MembershipFields({
  membership,
  errors,
}: {
  membership?: Membership | null;
  errors?: Errors;
}) {
  const [mode, setMode] = useState<MembershipMode>(membership?.mode ?? "manual");
  // Controlled on purpose: React resets uncontrolled fields once a form action
  // completes, which would wipe the coach's input every failed validation.
  const [currency, setCurrency] = useState(membership?.currency ?? "$");
  const [amount, setAmount] = useState(membership?.amount?.toString() ?? "");
  const [startsOn, setStartsOn] = useState(membership?.billingStartsOn ?? monthFromNow(0));

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <span id="mode-label" className="text-sm font-medium">
          Modo de pago
        </span>
        <Segmented
          name="mode"
          labelId="mode-label"
          value={mode}
          onChange={setMode}
          options={[
            { id: "manual", label: "Manual" },
            { id: "free", label: "Gratis" },
            { id: "gateway", label: "Pasarela", disabled: true, hint: "Disponible pronto" },
          ]}
        />
      </div>

      {mode === "free" ? (
        <p className="text-[12.5px]" style={{ color: "var(--text-2)" }}>
          Sin cuota.
        </p>
      ) : (
        <div className="flex gap-2.5">
          <div className="flex w-[88px] flex-col gap-1.5">
            <Label htmlFor="currency">Moneda</Label>
            <Input
              id="currency"
              name="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            />
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="amount">Monto mensual</Label>
            <Input
              id="amount"
              name="amount"
              inputMode="decimal"
              placeholder="45"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <FieldError message={errors?.amount} />
          </div>
        </div>
      )}

      {mode !== "free" && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="billingStartsOn">Cobrar desde</Label>
          <NativeSelect
            id="billingStartsOn"
            name="billingStartsOn"
            value={startsOn}
            onChange={(e) => setStartsOn(e.target.value)}
            className="w-full"
          >
            {startMonths(startsOn).map((m) => (
              <option key={m} value={m}>
                {periodTitle(m)}
              </option>
            ))}
          </NativeSelect>
          <FieldError message={errors?.billingStartsOn} />
        </div>
      )}
    </>
  );
}
