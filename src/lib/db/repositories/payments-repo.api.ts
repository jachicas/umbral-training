import { apiFetch } from "@/lib/api/client";
import type { PaymentsAthlete, PaymentsOverview } from "@/lib/domain/payments";
import type { PaymentsRepository } from "@/lib/domain/repositories";
import type { AthleteStatus, MembershipPayment, PaymentKind, PaymentMethod } from "@/lib/domain/types";
import { type ApiMembership, athletePath, call, periodLabel, toMembership } from "./athletes-repo.api";

/* API shapes (docs/api.md in ../umbral-training-api): null where the domain uses undefined. */

interface ApiPaymentsAthlete {
  athleteId: string;
  fullName: string;
  status: AthleteStatus;
  groupId: string | null;
  lastPaidOn: string | null;
  membership: ApiMembership;
}

type ApiPaymentsOverview = Omit<PaymentsOverview, "athletes"> & { athletes: ApiPaymentsAthlete[] };

interface ApiMembershipPayment {
  id: string;
  period: string;
  kind: PaymentKind;
  method: PaymentMethod | null;
  paidOn: string;
  amount: number;
  currency: string;
  note: string | null;
}

function toPaymentsAthlete(api: ApiPaymentsAthlete): PaymentsAthlete {
  return {
    athleteId: api.athleteId,
    fullName: api.fullName,
    status: api.status,
    groupId: api.groupId ?? undefined,
    lastPaidOn: api.lastPaidOn ?? undefined,
    membership: toMembership(api.membership),
  };
}

function toPayment(api: ApiMembershipPayment): MembershipPayment {
  return {
    ...api,
    periodLabel: periodLabel(api.period),
    method: api.method ?? undefined,
    note: api.note ?? undefined,
  };
}

const membershipPath = (athleteId: string) => `${athletePath(athleteId)}/membership`;

export const apiPaymentsRepository: PaymentsRepository = {
  async getOverview() {
    const api = await apiFetch<ApiPaymentsOverview>("GET", "/v1/payments");
    return { ...api, athletes: api.athletes.map(toPaymentsAthlete) };
  },

  async listPayments(athleteId) {
    const payments = await apiFetch<ApiMembershipPayment[]>("GET", `${membershipPath(athleteId)}/payments`);
    return payments.map(toPayment);
  },

  async markPaid(athleteId, input) {
    const membership = await call(() =>
      apiFetch<ApiMembership>("POST", `${membershipPath(athleteId)}/payments`, {
        paidOn: input.paidOn ?? null,
        method: input.method ?? null,
        note: input.note ?? null,
      })
    );
    return toMembership(membership);
  },

  async waive(athleteId, note) {
    const membership = await call(() =>
      apiFetch<ApiMembership>("POST", `${membershipPath(athleteId)}/waivers`, { note: note ?? null })
    );
    return toMembership(membership);
  },

  async undo(athleteId, paymentId) {
    const membership = await call(() =>
      apiFetch<ApiMembership>("DELETE", `${membershipPath(athleteId)}/payments/${encodeURIComponent(paymentId)}`)
    );
    return toMembership(membership);
  },
};
