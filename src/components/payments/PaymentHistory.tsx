"use client";

import { useState, useTransition } from "react";
import { Undo2 } from "lucide-react";
import { undoPaymentAction } from "@/app/payments/actions";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PAYMENT_KIND_LABEL, PAYMENT_METHOD_LABEL, PAYMENT_STATUS_META, formatMoney } from "@/lib/domain/payments";
import { formatDateEs } from "@/lib/domain/time";
import type { MembershipPayment } from "@/lib/domain/types";

/** How many months the card shows before "Ver todo". */
const VISIBLE = 6;

/**
 * Months settled, newest first. Only the latest can be undone (the API keeps
 * months settled oldest first), and it asks before doing it.
 */
export function PaymentHistory({ athleteId, payments }: { athleteId: string; payments: MembershipPayment[] }) {
  const [showAll, setShowAll] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const newestFirst = [...payments].reverse();
  const latest = newestFirst[0];
  const shown = showAll ? newestFirst : newestFirst.slice(0, VISIBLE);

  function undo() {
    if (!latest) return;
    startTransition(async () => {
      const result = await undoPaymentAction(athleteId, latest.id);
      setError(result.error);
      setConfirming(false);
    });
  }

  if (payments.length === 0) {
    return (
      <p className="py-2 text-[13px]" style={{ color: "var(--text-3)" }}>
        Aún no hay pagos registrados.
      </p>
    );
  }

  return (
    <div className="flex flex-col">
      {shown.map((p, i) => {
        const tone = p.kind === "paid" ? PAYMENT_STATUS_META.paid : PAYMENT_STATUS_META.waived;
        const details = [
          formatDateEs(p.paidOn),
          p.method && PAYMENT_METHOD_LABEL[p.method],
          p.note,
        ].filter(Boolean);

        return (
          <div
            key={p.id}
            className="flex items-center justify-between gap-3 py-2.5"
            style={i > 0 ? { borderTop: "1px solid var(--border)" } : undefined}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[13.5px] font-semibold">{p.periodLabel}</span>
                <span
                  className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-bold"
                  style={{ background: tone.bg, color: tone.colorVar }}
                >
                  {PAYMENT_KIND_LABEL[p.kind]}
                </span>
              </div>
              <div className="truncate text-[12px]" style={{ color: "var(--text-3)" }}>
                {p.kind === "waived" ? "Perdonado el " : ""}
                {details.join(" · ")}
              </div>
            </div>
            <div className="flex flex-none items-center gap-1.5">
              <span
                className="text-[13.5px] font-bold tabular-nums"
                style={p.kind === "waived" ? { color: "var(--text-3)", textDecoration: "line-through" } : undefined}
              >
                {formatMoney(p.amount, p.currency)}
              </span>
              {p.id === latest?.id && (
                <button
                  type="button"
                  onClick={() => setConfirming(true)}
                  aria-label={`Deshacer ${p.periodLabel}`}
                  title="Deshacer"
                  className="inline-flex size-7 items-center justify-center rounded-[8px] transition-colors hover:bg-[var(--surface-2)]"
                  style={{ color: "var(--text-3)" }}
                >
                  <Undo2 size={14} />
                </button>
              )}
            </div>
          </div>
        );
      })}

      {newestFirst.length > VISIBLE && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="mt-1 self-start text-[12.5px] font-semibold"
          style={{ color: "var(--coral)" }}
        >
          {showAll ? "Ver menos" : `Ver todo (${newestFirst.length})`}
        </button>
      )}

      {error && (
        <p className="mt-2 text-[12.5px] font-semibold" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}

      {latest && (
        <ConfirmDialog
          open={confirming}
          title={`¿Deshacer ${latest.periodLabel}?`}
          description={
            latest.kind === "paid"
              ? `Se borra el pago de ${formatMoney(latest.amount, latest.currency)}.`
              : "El mes vuelve a quedar pendiente."
          }
          confirmLabel="Deshacer"
          pending={pending}
          onConfirm={undo}
          onCancel={() => setConfirming(false)}
        />
      )}
    </div>
  );
}
