"use client";

import { useState } from "react";
import { Mail, Pencil } from "lucide-react";
import { savePaymentInstructionsAction } from "@/app/payments/actions";
import { FormDialog } from "@/components/athletes/fields/FormDialog";
import { Label } from "@/components/ui/label";

/**
 * The fee reminders the API emails on its own, and the coach's payment
 * instructions that go at the foot of each one.
 */
export function PaymentInstructionsCard({ instructions }: { instructions?: string }) {
  return (
    <div
      className="flex flex-col gap-4 rounded-[18px] border p-5 shadow-[var(--shadow)] md:flex-row md:items-start md:justify-between"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div className="flex min-w-0 gap-3.5">
        <div
          className="flex size-10 flex-none items-center justify-center rounded-xl"
          style={{ background: "var(--coral-tint)", color: "var(--coral)" }}
        >
          <Mail size={19} />
        </div>
        <div className="min-w-0">
          <div className="text-base font-bold">Avisos de cobro</div>
          <p className="mt-1 text-[13px]" style={{ color: "var(--text-2)" }}>
            A las 8:00 se le escribe a quien debe: 3 días antes de que venza el mes, el día 1 si quedó sin pagar y cada
            semana mientras siga debiendo. Los lunes te llega un resumen.
          </p>
          <div className="mt-3 text-[12px] font-bold tracking-[.03em] uppercase" style={{ color: "var(--text-3)" }}>
            Cómo pagarte
          </div>
          {instructions ? (
            <p className="mt-1 text-[13.5px] whitespace-pre-line">{instructions}</p>
          ) : (
            <p className="mt-1 text-[13px]" style={{ color: "var(--text-3)" }}>
              Sin instrucciones: los avisos no dicen cómo pagarte.
            </p>
          )}
        </div>
      </div>

      <FormDialog
        title="Cómo pagarte"
        description="Va al pie de cada aviso de cobro. Por ejemplo, tu banco y número de cuenta. Déjalo vacío para quitarlo."
        action={savePaymentInstructionsAction}
        trigger={
          <button
            type="button"
            className="inline-flex h-9 flex-none items-center gap-1.5 self-start rounded-[8px] border px-3 text-[13px] font-bold transition-colors hover:bg-[var(--surface-2)]"
            style={{ borderColor: "var(--border)", color: "var(--text)" }}
          >
            <Pencil size={14} /> {instructions ? "Editar" : "Agregar"}
          </button>
        }
      >
        {() => <InstructionsField initial={instructions ?? ""} />}
      </FormDialog>
    </div>
  );
}

/** Controlled, so a rejected save keeps what was typed. */
function InstructionsField({ initial }: { initial: string }) {
  const [text, setText] = useState(initial);

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="paymentInstructions">Instrucciones de pago</Label>
      <textarea
        id="paymentInstructions"
        name="paymentInstructions"
        rows={4}
        maxLength={1000}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={"Banco Agrícola\nCuenta de ahorro 123-456789-0\nA nombre de …"}
        className="w-full resize-y rounded-[9px] border px-3 py-2 text-[13.5px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--coral)]/40"
        style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" }}
      />
      <span className="self-end text-[11.5px]" style={{ color: "var(--text-3)" }}>
        {text.length}/1000
      </span>
    </div>
  );
}
