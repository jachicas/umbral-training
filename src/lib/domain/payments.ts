import type { Membership, MembershipMode, PaymentPeriodStatus } from "./types";

export interface PaymentStatusMeta {
  label: string;
  colorVar: string;
  bg: string;
}

export const PAYMENT_STATUS_META: Record<PaymentPeriodStatus, PaymentStatusMeta> = {
  paid: { label: "Pagado", colorVar: "var(--ok)", bg: "rgba(22,163,74,.12)" },
  pending: { label: "Pendiente", colorVar: "var(--pend)", bg: "rgba(217,119,6,.12)" },
  overdue: { label: "Vencido", colorVar: "var(--danger)", bg: "rgba(220,38,38,.12)" },
  waived: { label: "Gratis", colorVar: "var(--free)", bg: "rgba(124,58,237,.12)" },
};

/** Shown instead of a period status until the coach agrees a price with the athlete. */
export const UNCONFIGURED_PAYMENT_META: PaymentStatusMeta = {
  label: "Sin configurar",
  colorVar: "var(--text-3)",
  bg: "transparent",
};

/**
 * A paid plan needs an agreed amount before any period status means anything —
 * a freshly created athlete owes nothing yet, so it must not read "Pendiente".
 */
export function isMembershipConfigured(membership: Membership): boolean {
  if (membership.mode === "free") return true;
  return membership.amount !== undefined && membership.amount > 0;
}

export function paymentDisplayMeta(
  status: PaymentPeriodStatus,
  configured: boolean
): PaymentStatusMeta {
  return configured ? PAYMENT_STATUS_META[status] : UNCONFIGURED_PAYMENT_META;
}

/** "Pendientes" filter on the athlete list also covers overdue accounts. */
export function isPendingOrOverdue(status: PaymentPeriodStatus): boolean {
  return status === "pending" || status === "overdue";
}

export const MEMBERSHIP_MODE_LABEL: Record<MembershipMode, string> = {
  manual: "Manual",
  free: "Gratis",
  gateway: "Pasarela (pronto)",
};

export function formatMonthlyAmount(membership: Membership): string {
  if (membership.mode === "free" || !membership.amount) return "—";
  return `${membership.currency}${membership.amount}/mes`;
}

/** A manual, configured, unpaid membership is the only one the coach can mark as paid by hand. */
export function isPayActionable(membership: Membership): boolean {
  if (!isMembershipConfigured(membership)) return false;
  return membership.mode === "manual" && membership.currentPeriodStatus !== "paid";
}

/** "Vence" while the month is owed, "Venció" once it's overdue, "Próximo pago" after paying it. */
export function dueLabel(membership: Membership): string {
  if (membership.currentPeriodStatus === "overdue") return "Venció";
  if (membership.currentPeriodStatus === "paid") return "Próximo pago";
  return "Vence";
}
