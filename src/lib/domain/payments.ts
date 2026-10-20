import type { AthleteStatus, Membership, MembershipMode, PaymentKind, PaymentMethod, PaymentPeriodStatus } from "./types";

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
  paused: { label: "Pausado", colorVar: "var(--text-2)", bg: "var(--surface-3)" },
};

/** A manual fee whose current month the coach forgave reads "Perdonado", not "Gratis". */
const FORGIVEN_META: PaymentStatusMeta = { ...PAYMENT_STATUS_META.waived, label: "Perdonado" };

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

/** The pill for a membership as it stands today. */
export function membershipDisplayMeta(membership: Membership): PaymentStatusMeta {
  if (membership.currentPeriodStatus === "waived" && membership.mode !== "free") return FORGIVEN_META;
  return paymentDisplayMeta(membership.currentPeriodStatus, isMembershipConfigured(membership));
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

/** Only a configured manual fee that owes a month can be settled by hand (paid or waived). */
export function isPayActionable(membership: Membership): boolean {
  if (!isMembershipConfigured(membership)) return false;
  return membership.mode === "manual" && membership.periodsOwed > 0;
}

/** "Vence" while the month is owed, "Venció" once it's overdue, "Próximo pago" once it's settled. */
export function dueLabel(membership: Membership): string {
  if (membership.currentPeriodStatus === "overdue") return "Venció";
  if (membership.periodsOwed === 0) return "Próximo pago";
  return "Vence";
}

const MONTHS_ES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

/** "2026-10" → "octubre". */
export function monthName(period: string): string {
  return MONTHS_ES[Number(period.split("-")[1]) - 1];
}

/** "$45", "$45.50". */
export function formatMoney(amount: number, currency: string): string {
  return `${currency}${Number.isInteger(amount) ? amount : amount.toFixed(2)}`;
}

/** Totals per currency, "$160 · Q300"; "—" when there are none. */
export function formatTotals(totals: MoneyTotal[]): string {
  return totals.length ? totals.map((t) => formatMoney(t.amount, t.currency)).join(" · ") : "—";
}

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: "Efectivo",
  transfer: "Transferencia",
  other: "Otro",
};

export const PAYMENT_KIND_LABEL: Record<PaymentKind, string> = {
  paid: "Pagado",
  waived: "Perdonado",
};

export interface MoneyTotal {
  currency: string;
  amount: number;
}

export type PaymentReportStatus = "pending" | "confirmed" | "rejected";

/** A transfer the athlete reported from the portal, with a receipt; it settles nothing until the coach confirms it. */
export interface PaymentReport {
  id: string;
  athleteId: string;
  /** Only in the coach's list. */
  athleteName?: string;
  /** "YYYY-MM", oldest first. */
  periods: { period: string; amount: number }[];
  amount: number;
  currency: string;
  paidOn: string;
  note?: string;
  status: PaymentReportStatus;
  rejectionReason?: string;
  createdAt: string;
  /** When the coach confirmed or rejected it. */
  reviewedAt?: string;
  receiptMime: string;
  /** Only in the coach's list: a signed link that works for an hour. */
  receiptUrl?: string;
}

/** "2026-10" → "Octubre 2026". */
export function periodTitle(period: string): string {
  const name = monthName(period);
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${period.slice(0, 4)}`;
}

/** "Agosto y septiembre 2026", "Agosto 2026", or "Diciembre 2026 y enero 2027". */
export function periodsLabel(periods: { period: string }[]): string {
  if (periods.length === 0) return "";
  const first = periods[0].period;
  const last = periods[periods.length - 1].period;
  if (periods.length === 1) return periodTitle(first);
  const join = periods.length === 2 ? " y " : " a ";
  if (first.slice(0, 4) === last.slice(0, 4)) {
    const a = monthName(first);
    return `${a.charAt(0).toUpperCase()}${a.slice(1)}${join}${monthName(last)} ${last.slice(0, 4)}`;
  }
  return `${periodTitle(first)}${join}${periodTitle(last).toLowerCase()}`;
}

/** The coach's collections, as the API sums them up. */
export interface PaymentsOverview {
  /** "YYYY-MM", the current month. */
  month: string;
  summary: {
    owingCount: number;
    overdueCount: number;
    unconfiguredCount: number;
    /** Payments athletes reported, waiting for the coach. */
    pendingReportsCount: number;
    /** Every month owed, and the part of it from months that ended. */
    owed: MoneyTotal[];
    overdue: MoneyTotal[];
    /** Paid this month (by payment date); waivers left out. */
    collected: MoneyTotal[];
    /** A month of fees from the active athletes billed now. */
    expected: MoneyTotal[];
  };
  /** Active athletes, and archived ones who still owe, by name. */
  athletes: PaymentsAthlete[];
}

export interface PaymentsAthlete {
  athleteId: string;
  fullName: string;
  email?: string;
  status: AthleteStatus;
  groupId?: string;
  lastPaidOn?: string;
  membership: Membership;
}
