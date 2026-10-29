import { apiFetch, apiFile, apiUpload } from "@/lib/api/client";
import type { PortalRepository } from "@/lib/domain/repositories";
import type {
  PortalAthlete,
  PortalHome,
  PortalMembership,
  PortalPayment,
  PortalPayments,
} from "@/lib/domain/portal";
import type { AthleteStatus, Discipline, ExperienceLevel, RaceReference } from "@/lib/domain/types";
import type { AthletePaces, ResolvedPace, WeekPlan } from "@/lib/domain/workouts";
import type { PortalCheckin } from "@/lib/domain/checkins";
import { toCheckin, type ApiCheckin } from "./checkins-repo.api";
import { call, orUndefined, toGoal, toRecord, type ApiGoal, type ApiRecord } from "./athletes-repo.api";
import { toReport, type ApiPaymentReport } from "./payments-repo.api";

/* The API's /v1/portal shapes (docs/api.md in ../umbral-training-api): null where the domain uses undefined. */

interface ApiPortalAthlete {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  status: AthleteStatus;
  disciplines: Discipline[];
  level: ExperienceLevel | null;
  weeklyAvailabilityDays: number | null;
  weeklyAvailabilityHours: number | null;
  groupName: string | null;
}

interface ApiPortalHome {
  today: string;
  weekStart: string;
  latestSentWeek: string | null;
  athlete: ApiPortalAthlete;
  coach: { fullName: string; email: string };
  goal: ApiGoal | null;
  goals: ApiGoal[];
  records: ApiRecord[];
  referencePaces: Partial<Record<RaceReference, ResolvedPace>>;
  pendingCheckin: { weekStart: string; closesOn: string } | null;
}

interface ApiPortalCheckin {
  status: PortalCheckin["status"];
  opensOn: string;
  closesOn: string;
  answer: ApiCheckin | null;
}

interface ApiPortalWeek {
  weekStart: string;
  sentOn: string | null;
  plan: WeekPlan | null;
  paces: AthletePaces;
  checkin: ApiPortalCheckin | null;
}

const toPortalCheckin = (api: ApiPortalCheckin): PortalCheckin => ({
  ...api,
  answer: api.answer ? toCheckin(api.answer) : null,
});

type Nullable<T> = { [K in keyof T]-?: undefined extends T[K] ? Exclude<T[K], undefined> | null : T[K] };

interface ApiPortalPayments {
  membership: Nullable<PortalMembership>;
  owed: PortalPayments["owed"];
  history: Nullable<PortalPayment>[];
  paymentInstructions: string | null;
  payable: PortalPayments["payable"];
  reports: ApiPaymentReport[];
}

const toPayments = (api: ApiPortalPayments): PortalPayments => {
  const m = api.membership;
  return {
    membership: { ...m, amount: orUndefined(m.amount), dueOn: orUndefined(m.dueOn) },
    owed: api.owed,
    history: api.history.map((p) => ({ ...p, method: orUndefined(p.method) })),
    paymentInstructions: orUndefined(api.paymentInstructions),
    payable: api.payable,
    reports: api.reports.map(toReport),
  };
};

const toAthlete = (api: ApiPortalAthlete): PortalAthlete => ({
  id: api.id,
  fullName: api.fullName,
  email: orUndefined(api.email),
  phone: orUndefined(api.phone),
  status: api.status,
  disciplines: api.disciplines,
  level: orUndefined(api.level),
  weeklyAvailabilityDays: orUndefined(api.weeklyAvailabilityDays),
  weeklyAvailabilityHours: orUndefined(api.weeklyAvailabilityHours),
  groupName: orUndefined(api.groupName),
});

const toHome = (api: ApiPortalHome): PortalHome => ({
  today: api.today,
  weekStart: api.weekStart,
  latestSentWeek: orUndefined(api.latestSentWeek),
  athlete: toAthlete(api.athlete),
  coach: api.coach,
  goal: api.goal ? toGoal(api.goal) : null,
  goals: api.goals.map(toGoal),
  records: api.records.map(toRecord),
  referencePaces: api.referencePaces,
  pendingCheckin: orUndefined(api.pendingCheckin),
});

const path = (...parts: string[]) => "/v1/portal" + parts.map((p) => "/" + encodeURIComponent(p)).join("");

export const apiPortalRepository: PortalRepository = {
  async getHome() {
    return toHome(await apiFetch<ApiPortalHome>("GET", path()));
  },

  async getWeek(weekStart) {
    const api = await apiFetch<ApiPortalWeek>("GET", path("weeks", weekStart));
    return { ...api, sentOn: orUndefined(api.sentOn), checkin: api.checkin ? toPortalCheckin(api.checkin) : null };
  },

  getWeekPdf: (weekStart) => apiFile(path("weeks", weekStart, "pdf")),

  async saveCheckin(weekStart, input) {
    return toPortalCheckin(
      await call(() => apiFetch<ApiPortalCheckin>("PUT", path("weeks", weekStart, "checkin"), input))
    );
  },

  async getPayments() {
    return toPayments(await apiFetch<ApiPortalPayments>("GET", path("payments")));
  },

  async reportPayment(form) {
    return toPayments(await call(() => apiUpload<ApiPortalPayments>(path("payments", "reports"), form)));
  },

  async updateProfile(input) {
    return toHome(await call(() => apiFetch<ApiPortalHome>("PUT", path("profile"), input)));
  },
};
