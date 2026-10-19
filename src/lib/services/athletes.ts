import { apiAthleteRepository } from "@/lib/db/repositories/athletes-repo.api";
import type { AthleteRepository, GoalInput, RaceInput, SportProfileInput } from "@/lib/domain/repositories";
import type {
  Athlete,
  AthleteDetail,
  AthleteSex,
  Discipline,
  ExperienceLevel,
  Goal,
  GoalType,
  Membership,
  MembershipMode,
  Race,
  RaceDistanceKey,
  RaceDistances,
  RaceRecord,
  RaceReference,
  RaceSport,
} from "@/lib/domain/types";
import { parseDuration } from "@/lib/domain/time";
import { FieldValidationError, ValidationErrors, type ValidationField } from "./errors";

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

/** A new race as typed in the goal wizard: every value a string, parsed here. */
export interface RaceFormInput {
  name?: string;
  date?: string;
  location?: string;
  sport?: string;
  sportLabel?: string;
  format?: string;
  distances?: Partial<Record<RaceDistanceKey, string>>;
}

export interface SaveGoalInput {
  type: string;
  /** A race from the catalog, or a new one in `race`. */
  raceId?: string;
  race?: RaceFormInput;
  /** Free-form "m:ss" / "h:mm:ss" as typed by the coach; parsed here. */
  targetPace?: string;
  targetTime?: string;
}

function buildRaceInput(input: RaceFormInput): RaceInput {
  const distances = Object.fromEntries(
    Object.entries(input.distances ?? {})
      .map(([key, raw]) => [key, parseNumber(raw)])
      .filter(([, value]) => value !== undefined)
  ) as RaceDistances;

  return {
    name: input.name?.trim() ?? "",
    date: input.date ?? "",
    location: blankToUndefined(input.location),
    sport: (input.sport ?? "") as RaceSport,
    sportLabel: blankToUndefined(input.sportLabel),
    format: blankToUndefined(input.format),
    distances,
  };
}

function buildGoalInput(input: SaveGoalInput): GoalInput {
  return {
    type: input.type as GoalType,
    raceId: blankToUndefined(input.raceId),
    race: input.race && !input.raceId ? buildRaceInput(input.race) : undefined,
    targetPaceSecPerKm: parsePace(input.targetPace, "targetPace"),
    targetTimeSeconds: parseTime(input.targetTime),
  };
}

/** "3:45:00" → seconds; a bare "45:00" reads as minutes and seconds. */
function parseTime(raw: string | undefined): number | undefined {
  const trimmed = blankToUndefined(raw);
  if (trimmed === undefined) return undefined;
  const parsed = parseDuration(trimmed);
  if (parsed === null) {
    throw new FieldValidationError("targetTime", "Usa el formato h:mm:ss (por ejemplo 3:45:00).");
  }
  return parsed;
}

/** Races a goal can point to: the coach's, from today on. */
export async function listUpcomingRaces(coachId: string): Promise<Race[]> {
  return getRepo().listUpcomingRaces(coachId);
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

export async function listArchivedAthleteDetails(): Promise<AthleteDetail[]> {
  return getRepo().listArchivedDetails();
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

export interface RecordEntry {
  /** Free-form "mm:ss" / "h:mm:ss"; a blank one is skipped. */
  time: string;
  recordedOn: string;
  note?: string;
}

/**
 * Records every distance the coach filled in, each with its own date and
 * note. All time formats are checked before saving anything; a rejection
 * from the API names the distance it was about.
 */
export async function addRaceRecords(
  athleteId: string,
  coachId: string,
  entries: Partial<Record<RaceReference, RecordEntry>>
): Promise<void> {
  const filled = (Object.entries(entries) as [RaceReference, RecordEntry][]).filter(([, e]) => e.time.trim() !== "");

  if (filled.length === 0) {
    throw new FieldValidationError("time", "No hay marcas nuevas: escribe o cambia el tiempo de alguna distancia.");
  }
  for (const [reference, e] of filled) {
    if (parseDuration(e.time.trim()) === null) {
      throw new FieldValidationError("time", `${reference.toUpperCase()}: usa el formato mm:ss o h:mm:ss (por ejemplo 21:30).`);
    }
  }

  for (const [reference, e] of filled) {
    try {
      await addRaceRecord(athleteId, coachId, { reference, time: e.time, recordedOn: e.recordedOn, note: e.note });
    } catch (error) {
      if (error instanceof ValidationErrors) {
        const field = error.errors.time ? "time" : "recordedOn";
        throw new FieldValidationError(field, `${reference.toUpperCase()}: ${error.message}`);
      }
      throw error;
    }
  }
}

export async function archiveAthlete(athleteId: string): Promise<Athlete> {
  return getRepo().archiveAthlete(athleteId);
}

export async function restoreAthlete(athleteId: string): Promise<Athlete> {
  return getRepo().restoreAthlete(athleteId);
}
