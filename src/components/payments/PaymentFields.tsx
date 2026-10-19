"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { FieldError } from "@/components/athletes/fields/FieldError";
import { PAYMENT_METHOD_LABEL } from "@/lib/domain/payments";
import type { PaymentMethod } from "@/lib/domain/types";
import type { ValidationField } from "@/lib/services/errors";

type Errors = Partial<Record<ValidationField, string>>;

/** Today in the browser's timezone, "YYYY-MM-DD" (the coach's, in practice). */
function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** When and how the athlete paid. Controlled, so a rejected submit keeps what was typed. */
export function PaymentFields({ errors }: { errors: Errors }) {
  const [paidOn, setPaidOn] = useState(todayISO);
  const [method, setMethod] = useState<PaymentMethod | "">("");
  const [note, setNote] = useState("");

  return (
    <>
      <div className="flex gap-2.5">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="paidOn">Fecha de pago</Label>
          <Input id="paidOn" name="paidOn" type="date" max={todayISO()} value={paidOn} onChange={(e) => setPaidOn(e.target.value)} />
          <FieldError message={errors.paidOn} />
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="method">Método</Label>
          <NativeSelect
            id="method"
            name="method"
            value={method}
            onChange={(e) => setMethod(e.target.value as PaymentMethod | "")}
            className="h-9 w-full"
          >
            <option value="">Sin indicar</option>
            {(Object.keys(PAYMENT_METHOD_LABEL) as PaymentMethod[]).map((m) => (
              <option key={m} value={m}>
                {PAYMENT_METHOD_LABEL[m]}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>
      <NoteField value={note} onChange={setNote} placeholder="Opcional" />
    </>
  );
}

export function NoteField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="note">Nota</Label>
      <Input id="note" name="note" maxLength={500} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
