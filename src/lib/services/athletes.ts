import { apiAthleteRepository } from "@/lib/db/repositories/athletes-repo.api";
import type { AthleteRepository, GoalInput, SportProfileInput } from "@/lib/domain/repositories";
import type {
  Athlete,
  AthleteDetail,
  AthleteSex,
  Discipline,
  ExperienceLevel,
  Goal,
  GoalModality,
  GoalType,
  Membership,
  MembershipMode,
  RaceRecord,
  RaceReference,
} from "@/lib/domain/types";
import { parseDuration } from "@/lib/domain/time";
import { FieldValidationError, type ValidationField } from "./errors";

export { FieldValidationError, ValidationErrors, type ValidationField } from "./errors";

/*
 * The athletes module runs on the Laravel API, which owns every rule
 * (required fields, ranges, invite and billing rules) and answers with
 * Spanish messages per field. This layer only turns form strings into the
 * values the API expects: "4:45" → 285 seconds, "7,5" → 7.5. Enum values
 * pass through as typed; the API rejects anything it doesn't know.
 */

function getRepo(): AthleteRepository {
  return apiAthleteRepository;
}

const blankToUndefined = (raw: string | undefined) => raw?.trim() || undefined;

/** "7,5" → 7.5. Something that isn't a number goes to the API as typed, so the API names the problem. */
function parseNumber(raw: string | undefined): number | undefined {
  const trimmed = blankToUndefined(raw);
  if (trimmed === undefined) return undefined;
  const n = Number(trimmed.replace(",", "."));
  return Number.isFinite(n) ? n : (trimmed as unknown as number);
}

/** "m:ss" → seconds. The format is the web's concern, so a malformed one is caught here. */
function parsePace(raw: string | undefined, field: ValidationField): number | undefined {
  const trimmed = blankToUndefined(raw);
  if (trimmed === undefined) return undefined;
  const parsed = parseDuration(trimmed);
  if (parsed === null) {
    throw new FieldValidationError(field, "Usa el formato m:ss (por ejemplo 4:45).");
  }
  return parsed;
}

/** Sport-profile fields as they arrive from a <form> — free-form strings, parsed here. */
export interface SportProfileFormInput {
  disciplines: string[];
  level?: string;
  weeklyAvailabilityDays?: string;
  weeklyAvailabilityHours?: string;
  runThresholdPace?: string;
  bikeFtpWatts?: string;
  swimThresholdPace?: string;
  maxHr?: string;
  restHr?: string;
}

function buildSportProfile(input: SportProfileFormInput): SportProfileInput {
  const thresholds = {
    runThresholdPaceSecPerKm: parsePace(input.runThresholdPace, "runPace"),
    bikeFtpWatts: parseNumber(input.bikeFtpWatts),
    swimThresholdPaceSecPer100m: parsePace(input.swimThresholdPace, "swimPace"),
    maxHr: parseNumber(input.maxHr),
    restHr: parseNumber(input.restHr),
  };

  return {
    disciplines: [...new Set(input.disciplines)] as Discipline[],
    level: blankToUndefined(input.level) as ExperienceLevel | undefined,
    weeklyAvailabilityDays: parseNumber(input.weeklyAvailabilityDays),
    weeklyAvailabilityHours: parseNumber(input.weeklyAvailabilityHours),
    thresholds: Object.values(thresholds).some((v) => v !== undefined) ? thresholds : undefined,
  };
}

export interface SaveGoalInput {
  type: string;
  raceName?: string;
  raceDate?: string;
  modality?: string;
  format?: string;
  /** Free-form "m:ss" as typed by the coach; parsed here. */
  targetPace?: string;
}

function buildGoalInput(input: SaveGoalInput): GoalInput {
  return {
    type: input.type as GoalType,
    raceName: blankToUndefined(input.raceName),
    raceDate: blankToUndefined(input.raceDate),
    modality: blankToUndefined(input.modality) as GoalModality | undefined,
    format: blankToUndefined(input.format),
    targetPaceSecPerKm: parsePace(input.targetPace, "targetPace"),
  };
}

export interface CreateAthleteInput extends SportProfileFormInput {
  fullName: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  sex?: string;
  goal: SaveGoalInput;
  sendInviteNow: boolean;
}

export async function listAthletes(coachId: string): Promise<Athlete[]> {
  return getRepo().listByCoach(coachId);
}

export async function listAthleteDetails(coachId: string): Promise<AthleteDetail[]> {
  return getRepo().listDetailsByCoach(coachId);
}

export async function getAthleteDetail(
  athleteId: string,
  coachId: string
): Promise<AthleteDetail | null> {
  return getRepo().getDetail(athleteId, coachId);
}

/** Creates the athlete as `draft`, or `invited` when `sendInviteNow` (which needs an email). */
export async function createAthlete(coachId: string, input: CreateAthleteInput): Promise<Athlete> {
  return getRepo().createAthlete(coachId, {
    fullName: input.fullName.trim(),
    email: blankToUndefined(input.email),
    phone: blankToUndefined(input.phone),
    birthDate: blankToUndefined(input.birthDate),
    sex: blankToUndefined(input.sex) as AthleteSex | undefined,
    ...buildSportProfile(input),
    goal: buildGoalInput(input.goal),
    sendInviteNow: input.sendInviteNow,
  });
}

/** Sends (or resends) the portal invite. `email` backfills a draft athlete that had none yet. */
export async function sendInvite(
  athleteId: string,
  coachId: string,
  email?: string
): Promise<Athlete> {
  return getRepo().sendInvite(athleteId, coachId, blankToUndefined(email));
}

export async function cancelInvite(athleteId: string, coachId: string): Promise<Athlete> {
  return getRepo().cancelInvite(athleteId, coachId);
}

export interface UpdateAthleteInput {
  fullName: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  sex?: string;
}

export async function updateAthlete(
  athleteId: string,
  coachId: string,
  input: UpdateAthleteInput
): Promise<Athlete> {
  return getRepo().updateAthlete(athleteId, coachId, {
    fullName: input.fullName.trim(),
    email: blankToUndefined(input.email),
    phone: blankToUndefined(input.phone),
    birthDate: blankToUndefined(input.birthDate),
    sex: blankToUndefined(input.sex) as AthleteSex | undefined,
  });
}

export async function saveSportProfile(
  athleteId: string,
  coachId: string,
  input: SportProfileFormInput
): Promise<Athlete> {
  return getRepo().updateSportProfile(athleteId, coachId, buildSportProfile(input));
}

export async function saveGoal(
  athleteId: string,
  coachId: string,
  input: SaveGoalInput
): Promise<Goal> {
  return getRepo().upsertActiveGoal(athleteId, coachId, buildGoalInput(input));
}

export interface SaveMembershipInput {
  mode: string;
  /** Free-form amount as typed; parsed here. */
  amount?: string;
  currency: string;
}

export async function saveMembership(
  athleteId: string,
  coachId: string,
  input: SaveMembershipInput
): Promise<Membership> {
  const mode = input.mode as MembershipMode;
  return getRepo().updateMembership(athleteId, coachId, {
    mode,
    amount: mode === "free" ? undefined : parseNumber(input.amount),
    currency: input.currency.trim(),
  });
}

export interface AddRecordInput {
  reference: string;
  /** Free-form "mm:ss" / "h:mm:ss" as typed; parsed here. */
  time: string;
  recordedOn: string;
  note?: string;
}

export async function addRaceRecord(
  athleteId: string,
  coachId: string,
  input: AddRecordInput
): Promise<RaceRecord> {
  const time = blankToUndefined(input.time);
  const timeSeconds = time === undefined ? undefined : parseDuration(time);
  if (timeSeconds === null) {
    throw new FieldValidationError("time", "Usa el formato mm:ss o h:mm:ss (por ejemplo 21:30).");
  }

  return getRepo().addRaceRecord(athleteId, coachId, {
    reference: input.reference as RaceReference,
    // Missing: the API answers "Indica el tiempo." next to the field.
    timeSeconds: timeSeconds as number,
    recordedOn: input.recordedOn.trim(),
    note: blankToUndefined(input.note),
  });
}

/** Marks the oldest owed month as paid. */
export async function markPeriodPaid(
  athleteId: string,
  coachId: string,
  note?: string
): Promise<void> {
  await getRepo().markCurrentPeriodPaid(athleteId, coachId, { note });
}
