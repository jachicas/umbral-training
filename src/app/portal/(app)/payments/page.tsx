import type { Metadata } from "next";
import { CircleCheck, CircleAlert, Hourglass, XCircle } from "lucide-react";
import { getPortalPayments } from "@/lib/services/portal";
import {
  PAYMENT_KIND_LABEL,
  PAYMENT_METHOD_LABEL,
  PAYMENT_STATUS_META,
  formatMoney,
  monthName,
  periodsLabel,
  type PaymentReport,
} from "@/lib/domain/payments";
import { formatDateEs, toISODate } from "@/lib/domain/time";
import type { PayableMonth, PortalMembership } from "@/lib/domain/portal";
import { PortalCard, PortalLabel } from "@/components/portal/PortalShell";
import { ReportPaymentDialog } from "@/components/portal/ReportPaymentDialog";

export const metadata: Metadata = { title: "Mis pagos · Umbral Training" };

/** What the athlete owes their coach, how to pay, and what they already paid. */
export default async function PortalPaymentsPage() {
  const { membership, owed, history, paymentInstructions, payable, reports } = await getPortalPayments();
  const owes = membership.periodsOwed > 0;
  const currentMonth = toISODate(new Date()).slice(0, 7);

  return (
    <>
      <h1 className="m-0 px-1 pt-1 text-[26px] font-extrabold tracking-[-.5px]">Pagos</h1>

      <PortalCard>
        <Standing membership={membership} />

        {owes && (
          <ul className="mt-4 mb-0 flex list-none flex-col p-0">
            {owed.map((month) => {
              // A month that already ended is late.
              const meta = PAYMENT_STATUS_META[month.period < currentMonth ? "overdue" : "pending"];
              return (
                <li
                  key={month.period}
                  className="flex items-center gap-3 py-2.5 text-[14px]"
                  style={{ borderTop: "1px solid var(--border)" }}
                >
                  <span className="flex-1 font-semibold">{periodLabel(month.period)}</span>
                  <span
                    className="rounded-full px-2 py-0.5 text-[11px] font-bold"
                    style={{ color: meta.colorVar, background: meta.bg }}
                  >
                    {meta.label}
                  </span>
                  <span className="w-20 text-right font-bold tabular-nums">{formatMoney(month.amount, month.currency)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </PortalCard>

      {paymentInstructions && (
        <PortalCard>
          <PortalLabel>Cómo pagar</PortalLabel>
          <p className="mt-2 mb-0 text-[14.5px] whitespace-pre-line">{paymentInstructions}</p>
        </PortalCard>
      )}

      <ReportCard payable={payable} latest={reports[0]} today={toISODate(new Date())} />

      <PortalCard>
        <PortalLabel>Historial</PortalLabel>
        {history.length === 0 ? (
          <p className="mt-2 mb-0 text-[13.5px]" style={{ color: "var(--text-3)" }}>
            Todavía no hay pagos registrados.
          </p>
        ) : (
          <ul className="mt-2 mb-0 flex list-none flex-col p-0">
            {history.map((payment, i) => (
              <li
                key={payment.id}
                className="flex items-center gap-3 py-2.5 text-[13.5px]"
                style={i > 0 ? { borderTop: "1px solid var(--border)" } : undefined}
              >
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{periodLabel(payment.period)}</div>
                  <div className="text-[12px]" style={{ color: "var(--text-3)" }}>
                    {PAYMENT_KIND_LABEL[payment.kind]}
                    {payment.method ? ` · ${PAYMENT_METHOD_LABEL[payment.method]}` : ""} · {formatDateEs(payment.paidOn)}
                  </div>
                </div>
                <span
                  className="font-bold tabular-nums"
                  style={payment.kind === "waived" ? { color: "var(--text-3)", textDecoration: "line-through" } : undefined}
                >
                  {formatMoney(payment.amount, payment.currency)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </PortalCard>
    </>
  );
}

/**
 * Paying: a report waiting for the coach, or the button to report a
 * transfer (with why the last one came back, if it did).
 */
function ReportCard({ payable, latest, today }: { payable: PayableMonth[]; latest?: PaymentReport; today: string }) {
  if (latest?.status === "pending") {
    return (
      <PortalCard className="flex items-center gap-3.5">
        <div
          className="flex size-12 flex-none items-center justify-center rounded-full"
          style={{ color: "var(--pend)", background: "color-mix(in srgb, var(--pend) 14%, transparent)" }}
        >
          <Hourglass size={22} />
        </div>
        <div className="min-w-0">
          <div className="text-[16px] font-bold">Tu pago está por confirmar</div>
          <div className="text-[13.5px]" style={{ color: "var(--text-2)" }}>
            {formatMoney(latest.amount, latest.currency)} · {periodsLabel(latest.periods)}. Tu coach lo confirma cuando vea la
            transferencia.
          </div>
        </div>
      </PortalCard>
    );
  }

  if (payable.length === 0) return null;
  const advance = payable[0].advance;

  return (
    <PortalCard className="flex flex-col gap-3">
      {latest?.status === "rejected" && (
        <div
          className="flex items-start gap-2.5 rounded-[14px] px-3.5 py-3 text-[13.5px]"
          style={{ background: "color-mix(in srgb, var(--danger) 12%, transparent)" }}
        >
          <XCircle size={17} className="mt-0.5 flex-none" style={{ color: "var(--danger)" }} />
          <span>
            <b>Tu coach no confirmó tu pago de {formatMoney(latest.amount, latest.currency)}</b>
            {latest.rejectionReason ? `: ${latest.rejectionReason}` : "."} Revísalo y repórtalo de nuevo.
          </span>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[16px] font-bold">{advance ? "¿Quieres adelantar tu cuota?" : "¿Ya pagaste?"}</div>
          <div className="text-[13.5px]" style={{ color: "var(--text-2)" }}>
            {advance
              ? periodsLabel(payable)
              : "Sube el comprobante de tu transferencia."}
          </div>
        </div>
        <ReportPaymentDialog payable={payable} today={today} />
      </div>
    </PortalCard>
  );
}

/** "2026-10" → "Octubre 2026". */
function periodLabel(period: string): string {
  const name = monthName(period);
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${period.slice(0, 4)}`;
}

/** The headline: what they owe and by when, or that they're up to date. */
function Standing({ membership }: { membership: PortalMembership }) {
  if (membership.mode === "free") {
    return <Headline ok title="Tu plan no tiene cuota" />;
  }
  if (!membership.configured) {
    return <Headline ok title="Sin cuota por ahora" />;
  }
  if (membership.periodsOwed === 0) {
    return (
      <Headline
        ok
        title="Estás al día"
        detail={`${membership.amount ? `${formatMoney(membership.amount, membership.currency)} al mes. ` : ""}${
          membership.dueOn ? `Próximo pago: ${formatDateEs(membership.dueOn)}.` : ""
        }`}
      />
    );
  }

  const overdue = membership.currentPeriodStatus === "overdue";
  const months = membership.periodsOwed === 1 ? "1 mes" : `${membership.periodsOwed} meses`;
  return (
    <Headline
      title={formatMoney(membership.amountOwed, membership.currency)}
      detail={`Debes ${months}.${membership.dueOn ? ` ${overdue ? "Venció" : "Vence"} el ${formatDateEs(membership.dueOn)}.` : ""}`}
      danger={overdue}
    />
  );
}

function Headline({ title, detail, ok, danger }: { title: string; detail?: string; ok?: boolean; danger?: boolean }) {
  const color = ok ? "var(--ok)" : danger ? "var(--danger)" : "var(--pend)";
  const Icon = ok ? CircleCheck : CircleAlert;
  return (
    <div className="flex items-center gap-3.5">
      <div
        className="flex size-12 flex-none items-center justify-center rounded-full"
        style={{ color, background: `color-mix(in srgb, ${color} 14%, transparent)` }}
      >
        <Icon size={24} />
      </div>
      <div>
        <div className="text-[22px] leading-tight font-extrabold tracking-tight tabular-nums">{title}</div>
        {detail && (
          <div className="text-[13.5px]" style={{ color: "var(--text-2)" }}>
            {detail}
          </div>
        )}
      </div>
    </div>
  );
}
