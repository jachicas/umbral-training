import { ApiNotFoundError, ApiValidationError, apiFetch } from "@/lib/api/client";
import { DISCIPLINE_META } from "@/lib/domain/discipline";
import type { AthleteRepository, GoalInput, InvitesResult, RaceGoalInput, RaceInput } from "@/lib/domain/repositories";
import type {
  AccessStatus,
  Athlete,
  AthleteDetail,
  AthleteSex,
  AthleteStatus,
  AthleteThresholds,
  Discipline,
  ExperienceLevel,
  Goal,
  GoalType,
  Membership,
  MembershipMode,
  PaymentPeriodStatus,
  Race,
  RaceDistances,
  RaceRecord,
  RaceReference,
  RaceSport,
} from "@/lib/domain/types";
import { EntryErrors, ValidationErrors, type ValidationField } from "@/lib/services/athletes";

/* ------------------------------------------------------------------ */
/* API shapes (docs/api.md in ../umbral-training-api): camelCase, null  */
/* where the domain uses undefined.                                     */
/* ------------------------------------------------------------------ */

export interface ApiRace {
  id: string;
  name: string;
  date: string;
  location: string | null;
  sport: RaceSport;
  sportLabel: string | null;
  format: string | null;
  distances: RaceDistances | null;
  athleteCount?: number;
  athletes?: {
    id: string;
    fullName: string;
    disciplines: Discipline[];
    goalId: string;
    targetPaceSecPerKm: number | null;
    targetTimeSeconds: number | null;
  }[];
}

export interface ApiGoal {
  id: string;
  athleteId: string;
  type: GoalType;
  status: Goal["status"];
  race: ApiRace | null;
  raceName: string | null;
  raceDate: string | null;
  targetPaceSecPerKm: number | null;
  targetTimeSeconds: number | null;
}

export interface ApiRecord {
  id: string;
  athleteId: string;
  reference: RaceReference;
  timeSeconds: number;
  recordedOn: string;
  note: string | null;
}

export interface ApiMembership {
  id: string;
  athleteId: string;
  mode: MembershipMode;
  amount: number | null;
  currency: string;
  billingStartsOn: string | null;
  currentPeriod: string;
  currentPeriodStatus: PaymentPeriodStatus;
  periodsOwed: number;
  amountOwed: number;
  paidOn: string | null;
  lastPaymentNote: string | null;
  dueOn: string | null;
  lastRemindedOn?: string | null;
}

interface ApiAthlete {
  id: string;
  coachId: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  birthDate: string | null;
  sex: AthleteSex | null;
  status: AthleteStatus;
  accessStatus: AccessStatus;
  disciplines: Discipline[];
  level: ExperienceLevel | null;
  weeklyAvailabilityDays: number | null;
  weeklyAvailabilityHours: number | null;
  thresholds: Record<keyof AthleteThresholds, number | null> | null;
  activeGoal: ApiGoal | null;
  goals: ApiGoal[];
  records: ApiRecord[];
  membership: ApiMembership;
  createdAt: string;
}

export const orUndefined = <T,>(value: T | null): T | undefined => (value === null ? undefined : value);

const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

/** "2026-08" → "Agosto 2026". */
export function periodLabel(period: string): string {
  const [year, month] = period.split("-").map(Number);
  return `${MONTHS_ES[month - 1]} ${year}`;
}

function toThresholds(api: ApiAthlete["thresholds"]): AthleteThresholds | undefined {
  if (!api) return undefined;
  return Object.fromEntries(
    Object.entries(api).map(([key, value]) => [key, orUndefined(value)])
  ) as AthleteThresholds;
}

function toAthlete(api: ApiAthlete): Athlete {
  return {
    id: api.id,
    coachId: api.coachId,
    fullName: api.fullName,
    email: orUndefined(api.email),
    phone: orUndefined(api.phone),
    birthDate: orUndefined(api.birthDate),
    sex: orUndefined(api.sex),
    status: api.status,
    accessStatus: api.accessStatus,
    disciplines: api.disciplines,
    level: orUndefined(api.level),
    weeklyAvailabilityDays: orUndefined(api.weeklyAvailabilityDays),
    weeklyAvailabilityHours: orUndefined(api.weeklyAvailabilityHours),
    thresholds: toThresholds(api.thresholds),
    avatarColor: avatarColorOf(api.disciplines),
    createdAt: api.createdAt.slice(0, 10),
  };
}

export function toGoal(api: ApiGoal): Goal {
  return {
    id: api.id,
    athleteId: api.athleteId,
    type: api.type,
    status: api.status,
    race: api.race ? toRace(api.race) : undefined,
    raceName: orUndefined(api.raceName),
    raceDate: orUndefined(api.raceDate),
    targetPaceSecPerKm: orUndefined(api.targetPaceSecPerKm),
    targetTimeSeconds: orUndefined(api.targetTimeSeconds),
  };
}

/** Presentation only: the API doesn't store colors. */
const avatarColorOf = (disciplines: Discipline[]) =>
  disciplines[0] ? DISCIPLINE_META[disciplines[0]].colorVar : "var(--coral)";

export function toRace(api: ApiRace): Race {
  return {
    id: api.id,
    name: api.name,
    date: api.date,
    location: orUndefined(api.location),
    sport: api.sport,
    sportLabel: orUndefined(api.sportLabel),
    format: orUndefined(api.format),
    distances: orUndefined(api.distances),
    athleteCount: api.athleteCount,
    athletes: api.athletes?.map((a) => ({
      id: a.id,
      fullName: a.fullName,
      avatarColor: avatarColorOf(a.disciplines),
      goalId: a.goalId,
      targetPaceSecPerKm: orUndefined(a.targetPaceSecPerKm),
      targetTimeSeconds: orUndefined(a.targetTimeSeconds),
    })),
  };
}

export function toRecord(api: ApiRecord): RaceRecord {
  return { ...api, note: orUndefined(api.note) };
}

export function toMembership(api: ApiMembership): Membership {
  return {
    id: api.id,
    athleteId: api.athleteId,
    mode: api.mode,
    amount: orUndefined(api.amount),
    currency: api.currency,
    billingStartsOn: orUndefined(api.billingStartsOn),
    currentPeriodLabel: periodLabel(api.currentPeriod),
    currentPeriodStatus: api.currentPeriodStatus,
    periodsOwed: api.periodsOwed,
    amountOwed: api.amountOwed,
    paidOn: orUndefined(api.paidOn),
    lastPaymentNote: orUndefined(api.lastPaymentNote),
    dueOn: orUndefined(api.dueOn),
    lastRemindedOn: api.lastRemindedOn ?? undefined,
  };
}

function toDetail(api: ApiAthlete): AthleteDetail {
  return {
    athlete: toAthlete(api),
    records: api.records.map(toRecord),
    activeGoal: api.activeGoal ? toGoal(api.activeGoal) : null,
    goals: api.goals.map(toGoal),
    membership: toMembership(api.membership),
    // Comes from the workouts module once it moves to the API.
    assignedWorkouts: [],
  };
}

/* ------------------------------------------------------------------ */
/* Request bodies and error keys                                        */
/* ------------------------------------------------------------------ */

function goalBody(goal: GoalInput) {
  return { type: goal.type, ...raceGoalBody(goal) };
}

export function raceBody(race: RaceInput) {
  return {
    name: race.name,
    date: race.date,
    location: race.location ?? null,
    sport: race.sport,
    sportLabel: race.sportLabel ?? null,
    format: race.format ?? null,
    distances: race.distances,
  };
}

function raceGoalBody(goal: RaceGoalInput) {
  return {
    raceId: goal.raceId ?? null,
    race: goal.race ? raceBody(goal.race) : null,
    targetPaceSecPerKm: goal.targetPaceSecPerKm ?? null,
    targetTimeSeconds: goal.targetTimeSeconds ?? null,
  };
}

/** The form field that shows each API error; anything unlisted goes to the form's general error. */
const FIELD_FOR_API_KEY: Record<string, ValidationField> = {
  fullName: "fullName",
  email: "email",
  phone: "phone",
  birthDate: "birthDate",
  weeklyAvailabilityDays: "weeklyDays",
  weeklyAvailabilityHours: "weeklyHours",
  "thresholds.runThresholdPaceSecPerKm": "runPace",
  "thresholds.bikeFtpWatts": "ftp",
  "thresholds.swimThresholdPaceSecPer100m": "swimPace",
  "thresholds.maxHr": "maxHr",
  "thresholds.restHr": "restHr",
  raceId: "race",
  race: "race",
  "race.name": "raceName",
  "race.date": "raceDate",
  "race.location": "raceLocation",
  "race.sport": "raceSport",
  "race.sportLabel": "raceSportLabel",
  "race.format": "raceFormat",
  targetPaceSecPerKm: "targetPace",
  targetTimeSeconds: "targetTime",
  amount: "amount",
  billingStartsOn: "billingStartsOn",
  timeSeconds: "time",
  recordedOn: "recordedOn",
  paidOn: "paidOn",
  months: "months",
  receipt: "receipt",
  note: "note",
  feeling: "feeling",
  effort: "effort",
  completion: "completion",
  pain: "pain",
  painNote: "painNote",
  comment: "comment",
};

function fieldFor(apiKey: string): ValidationField {
  // Goal fields arrive prefixed when sent inside an athlete ("goal.race.date").
  const key = apiKey.replace(/^goal\./, "");
  if (key.startsWith("race.distances.")) return "raceDistances";
  return FIELD_FOR_API_KEY[apiKey] ?? FIELD_FOR_API_KEY[key] ?? "general";
}

/**
 * Runs an API call, turning a 422 into field errors the forms can show.
 * `keyPrefix` reads the API's keys as nested ones ("race." makes `name` the race's).
 */
export async function call<T>(request: () => Promise<T>, keyPrefix = ""): Promise<T> {
  try {
    return await request();
  } catch (error) {
    if (error instanceof ApiValidationError) {
      const errors: Partial<Record<ValidationField, string>> = {};
      for (const [key, messages] of Object.entries(error.errors)) {
        const field = fieldFor(keyPrefix + key);
        errors[field] ??= messages[0];
      }
      throw new ValidationErrors(errors);
    }
    throw error;
  }
}

export const athletePath = (athleteId: string) => `/v1/athletes/${encodeURIComponent(athleteId)}`;

export const apiAthleteRepository: AthleteRepository = {
  async listByCoach() {
    const athletes = await call(() => apiFetch<ApiAthlete[]>("GET", "/v1/athletes"));
    return athletes.map(toAthlete);
  },

  async listDetailsByCoach() {
    const athletes = await call(() => apiFetch<ApiAthlete[]>("GET", "/v1/athletes"));
    return athletes.map(toDetail);
  },

  async listArchivedDetails() {
    const athletes = await call(() => apiFetch<ApiAthlete[]>("GET", "/v1/athletes?archived=1"));
    return athletes.map(toDetail);
  },

  async getDetail(athleteId) {
    try {
      return toDetail(await apiFetch<ApiAthlete>("GET", athletePath(athleteId)));
    } catch (error) {
      if (error instanceof ApiNotFoundError) return null;
      throw error;
    }
  },

  async createAthlete(_coachId, input) {
    const athlete = await call(() =>
      apiFetch<ApiAthlete>("POST", "/v1/athletes", {
        fullName: input.fullName,
        email: input.email ?? null,
        phone: input.phone ?? null,
        birthDate: input.birthDate ?? null,
        sex: input.sex ?? null,
        disciplines: input.disciplines,
        level: input.level ?? null,
        weeklyAvailabilityDays: input.weeklyAvailabilityDays ?? null,
        weeklyAvailabilityHours: input.weeklyAvailabilityHours ?? null,
        thresholds: input.thresholds ?? null,
        goal: goalBody(input.goal),
        sendInviteNow: input.sendInviteNow,
      })
    );
    return toAthlete(athlete);
  },

  async sendInvite(athleteId, _coachId, email) {
    const athlete = await call(() =>
      apiFetch<ApiAthlete>("POST", `${athletePath(athleteId)}/invite`, { email: email ?? null })
    );
    return toAthlete(athlete);
  },

  async cancelInvite(athleteId) {
    return toAthlete(await call(() => apiFetch<ApiAthlete>("DELETE", `${athletePath(athleteId)}/invite`)));
  },

  async sendInvites(athleteIds) {
    return call(() => apiFetch<InvitesResult>("POST", "/v1/athletes/invites", { athleteIds }));
  },

  async updateAthlete(athleteId, _coachId, input) {
    const athlete = await call(() =>
      apiFetch<ApiAthlete>("PUT", athletePath(athleteId), {
        fullName: input.fullName,
        email: input.email ?? null,
        phone: input.phone ?? null,
        birthDate: input.birthDate ?? null,
        sex: input.sex ?? null,
      })
    );
    return toAthlete(athlete);
  },

  async updateSportProfile(athleteId, _coachId, input) {
    const athlete = await call(() =>
      apiFetch<ApiAthlete>("PUT", `${athletePath(athleteId)}/sport-profile`, {
        disciplines: input.disciplines,
        level: input.level ?? null,
        weeklyAvailabilityDays: input.weeklyAvailabilityDays ?? null,
        weeklyAvailabilityHours: input.weeklyAvailabilityHours ?? null,
        thresholds: input.thresholds ?? null,
      })
    );
    return toAthlete(athlete);
  },

  async listUpcomingRaces() {
    const races = await call(() => apiFetch<ApiRace[]>("GET", "/v1/races?upcoming=1"));
    return races.map(toRace);
  },

  async addRaceGoal(athleteId, _coachId, input) {
    return toGoal(await call(() => apiFetch<ApiGoal>("POST", `${athletePath(athleteId)}/goals`, raceGoalBody(input))));
  },

  async updateRaceGoal(athleteId, _coachId, goalId, input) {
    const path = `${athletePath(athleteId)}/goals/${encodeURIComponent(goalId)}`;
    return toGoal(await call(() => apiFetch<ApiGoal>("PUT", path, raceGoalBody(input))));
  },

  async removeRaceGoal(athleteId, _coachId, goalId) {
    await call(() => apiFetch<void>("DELETE", `${athletePath(athleteId)}/goals/${encodeURIComponent(goalId)}`));
  },

  async updateMembership(athleteId, _coachId, input) {
    const membership = await call(() =>
      apiFetch<ApiMembership>("PUT", `${athletePath(athleteId)}/membership`, {
        mode: input.mode,
        amount: input.amount ?? null,
        currency: input.currency,
        billingStartsOn: input.billingStartsOn ?? null,
      })
    );
    return toMembership(membership);
  },

  async addRaceRecord(athleteId, _coachId, input) {
    const record = await call(() =>
      apiFetch<ApiRecord>("POST", `${athletePath(athleteId)}/records`, {
        reference: input.reference,
        timeSeconds: input.timeSeconds,
        recordedOn: input.recordedOn,
        note: input.note ?? null,
      })
    );
    return toRecord(record);
  },

  async addRaceRecords(entries) {
    try {
      const records = await apiFetch<ApiRecord[]>("POST", "/v1/records", {
        records: entries.map((e) => ({
          athleteId: e.athleteId,
          reference: e.reference,
          timeSeconds: e.timeSeconds,
          recordedOn: e.recordedOn,
          note: e.note ?? null,
        })),
      });
      return records.map(toRecord);
    } catch (error) {
      if (error instanceof ApiValidationError) {
        // Keyed by entry: "records.3.timeSeconds".
        const byEntry: Record<number, string> = {};
        for (const [key, messages] of Object.entries(error.errors)) {
          const index = Number(/^records\.(\d+)\./.exec(key)?.[1]);
          if (Number.isInteger(index)) byEntry[index] ??= messages[0];
        }
        throw Object.keys(byEntry).length > 0 ? new EntryErrors(byEntry) : new Error(error.message);
      }
      throw error;
    }
  },

  async archiveAthlete(athleteId) {
    return toAthlete(await call(() => apiFetch<ApiAthlete>("POST", `${athletePath(athleteId)}/archive`)));
  },

  async restoreAthlete(athleteId) {
    return toAthlete(await call(() => apiFetch<ApiAthlete>("DELETE", `${athletePath(athleteId)}/archive`)));
  },
};
