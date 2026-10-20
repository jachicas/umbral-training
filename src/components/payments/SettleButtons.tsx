"use client";

import { useState } from "react";
import { Check, HeartHandshake } from "lucide-react";
import { markPaidAction, waiveAction } from "@/app/payments/actions";
import { FormDialog } from "@/components/athletes/fields/FormDialog";
import type { Membership } from "@/lib/domain/types";
import { NoteField, PaymentFields } from "./PaymentFields";
import { SendReminderButton } from "./SendReminderButton";

/** What settling the shown month leaves: "Queda debiendo 2 meses." */
function owedAfter(membership: Membership): string {
  const left = membership.periodsOwed - 1;
  if (left === 0) return "Queda al día.";
  return `Queda debiendo ${left === 1 ? "1 mes" : `${left} meses`}.`;
}

/**
 * "Marcar como pagado" and "Perdonar" for the oldest owed month. `variant`
 * "card" is the athlete page's full-width pair; "row" fits a table row.
 */
export function SettleButtons({
  athleteId,
  athleteName,
  email,
  membership,
  variant,
}: {
  athleteId: string;
  athleteName: string;
  /** Without one, the reminder button is off. */
  email?: string;
  membership: Membership;
  variant: "card" | "row";
}) {
  const period = membership.currentPeriodLabel;

  const payTrigger =
    variant === "card" ? (
      <button
        type="button"
        className="flex h-[42px] flex-1 items-center justify-center gap-2 rounded-[10px] text-[13.5px] font-bold text-white"
        style={{ background: "var(--coral)" }}
      >
        <Check size={16} /> Marcar como pagado
      </button>
    ) : (
      <button
        type="button"
        className="inline-flex h-8 items-center gap-1.5 rounded-[8px] px-3 text-[12.5px] font-bold text-white"
        style={{ background: "var(--coral)" }}
      >
        <Check size={14} /> Cobrar
      </button>
    );

  const waiveTrigger =
    variant === "card" ? (
      <button
        type="button"
        className="flex h-[42px] items-center justify-center gap-2 rounded-[10px] border px-4 text-[13.5px] font-bold transition-colors hover:bg-[var(--surface-2)]"
        style={{ borderColor: "var(--border)", color: "var(--text)" }}
      >
        <HeartHandshake size={16} /> Perdonar
      </button>
    ) : (
      <button
        type="button"
        aria-label={`Perdonar ${period} a ${athleteName}`}
        title="Perdonar el mes"
        className="inline-flex size-8 items-center justify-center rounded-[8px] border transition-colors hover:bg-[var(--surface-2)]"
        style={{ borderColor: "var(--border)", color: "var(--text-2)" }}
      >
        <HeartHandshake size={14} />
      </button>
    );

  const reminder = (
    <SendReminderButton
      athleteId={athleteId}
      athleteName={athleteName}
      email={email}
      lastRemindedOn={membership.lastRemindedOn}
      variant={variant}
    />
  );

  return (
    <>
    <div className={variant === "card" ? "mt-4 flex gap-2" : "flex items-center justify-end gap-1.5"}>
      <FormDialog
        title={`Registrar pago · ${period}`}
        description={owedAfter(membership)}
        action={markPaidAction.bind(null, athleteId)}
        submitLabel="Registrar pago"
        trigger={payTrigger}
      >
        {(errors) => <PaymentFields errors={errors} />}
      </FormDialog>
      <FormDialog
        title={`Perdonar ${period}`}
        description={owedAfter(membership)}
        action={waiveAction.bind(null, athleteId)}
        submitLabel="Perdonar mes"
        pendingLabel="Perdonando…"
        trigger={waiveTrigger}
      >
        {() => <WaiveNote />}
      </FormDialog>
      {variant === "row" && reminder}
    </div>
    {variant === "card" && reminder}
    </>
  );
}

function WaiveNote() {
  const [note, setNote] = useState("");
  return <NoteField value={note} onChange={setNote} placeholder="Por ejemplo: lesión" />;
}
