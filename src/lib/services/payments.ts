import { apiPaymentsRepository } from "@/lib/db/repositories/payments-repo.api";
import type { PaymentReport, PaymentsOverview } from "@/lib/domain/payments";
import type { PaymentsRepository } from "@/lib/domain/repositories";
import type { Membership, MembershipPayment, PaymentMethod } from "@/lib/domain/types";

/*
 * The API owns every billing rule (what's owed, at which amount, oldest
 * first) and answers with Spanish messages per field. This layer only turns
 * form strings into what the API expects.
 */

function getRepo(): PaymentsRepository {
  return apiPaymentsRepository;
}

const blankToUndefined = (raw: string | undefined) => raw?.trim() || undefined;

export async function getPaymentsOverview(): Promise<PaymentsOverview> {
  return getRepo().getOverview();
}

/** How many athletes owe their fee, how many are late, and how many payments wait to be confirmed: the sidebar's alert. */
export async function getOwingCounts(): Promise<{ owing: number; overdue: number; pendingReports: number }> {
  const { summary } = await getRepo().getOverview();
  return { owing: summary.owingCount, overdue: summary.overdueCount, pendingReports: summary.pendingReportsCount };
}

export async function listMembershipPayments(athleteId: string): Promise<MembershipPayment[]> {
  return getRepo().listPayments(athleteId);
}

/** Payment fields as they arrive from a <form>. */
export interface MarkPaidFormInput {
  paidOn?: string;
  method?: string;
  note?: string;
}

/** Pays the oldest owed month. */
export async function markPeriodPaid(athleteId: string, input: MarkPaidFormInput): Promise<Membership> {
  return getRepo().markPaid(athleteId, {
    paidOn: blankToUndefined(input.paidOn),
    // Passed as typed: the API rejects a method it doesn't know.
    method: blankToUndefined(input.method) as PaymentMethod | undefined,
    note: blankToUndefined(input.note),
  });
}

/** Forgives the oldest owed month. */
export async function waivePeriod(athleteId: string, note?: string): Promise<Membership> {
  return getRepo().waive(athleteId, blankToUndefined(note));
}

/** Emails the athlete a fee reminder now. */
export async function sendReminder(athleteId: string): Promise<Membership> {
  return getRepo().remind(athleteId);
}

/** Receipts athletes sent: waiting for review, or already confirmed or rejected. */
export async function listReports(status: "pending" | "reviewed"): Promise<PaymentReport[]> {
  return getRepo().listReports(status);
}

/** The money arrived: the reported months are settled as paid. */
export async function confirmReport(reportId: string): Promise<PaymentReport> {
  return getRepo().confirmReport(reportId);
}

export async function rejectReport(reportId: string, reason?: string): Promise<PaymentReport> {
  return getRepo().rejectReport(reportId, blankToUndefined(reason));
}

/** Undoes the latest settled month. */
export async function undoPayment(athleteId: string, paymentId: string): Promise<Membership> {
  return getRepo().undo(athleteId, paymentId);
}
