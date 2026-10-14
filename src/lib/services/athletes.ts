import { mockAthleteRepository } from "@/lib/db/repositories/athletes-repo.mock";
import type { AthleteRepository, GoalInput, SportProfileInput } from "@/lib/domain/repositories";
import type {
  Athlete,
  AthleteDetail,
  AthleteThresholds,
  Goal,
  Membership,
  RaceRecord,
} from "@/lib/domain/types";
import { RACE_REFERENCES, daysUntil, parseDuration } from "@/lib/domain/time";
import { DISCIPLINE_ORDER } from "@/lib/domain/discipline";
import {
  ATHLETE_SEXES,
  EXPERIENCE_LEVEL_ORDER,
  MAX_HR_RANGE,
  REST_HR_RANGE,
  WEEKLY_DAYS_RANGE,
  WEEKLY_HOURS_RANGE,
  type NumberRange,
} from "@/lib/domain/athlete-profile";
import { GOAL_MODALITIES, GOAL_TYPES, isFormatFor } from "@/lib/domain/goals";
import { MEMBERSHIP_MODES, periodStatusAfterModeChange } from "@/lib/domain/payments";

function getRepo(): AthleteRepository {
  return mockAthleteRepository;
}

export type ValidationField =
  | "fullName"
  | "email"
  | "birthDate"
  | "raceName"
  | "raceDate"
  | "targetPace"
  | "amount"
  | "time"
  | "recordedOn"
  | "runPace"
  | "swimPace"
  | "ftp"
  | "maxHr"
  | "restHr"
  | "weeklyDays"
  | "weeklyHours"
  | "general";

/** Business-rule violation tied to a specific form field, so the UI can show it inline. */
export class FieldValidationError extends Error {
  constructor(
    public field: ValidationField,
    message: string
  ) {
    super(message);
  }
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Narrows an untrusted form value to one of `allowed`. The UI only ever offers
 * valid options, so a miss means a stale or tampered request — reject it
 * before it reaches storage and breaks every page that renders the athlete.
 */
function parseEnum<T extends string>(allowed: readonly T[], raw: string, label: string): T {
  if (!(allowed as readonly string[]).includes(raw)) {
    throw new FieldValidationError("general", `Valor no válido para «${label}».`);
  }
  return raw as T;
}

function parseOptionalEnum<T extends string>(
  allowed: readonly T[],
  raw: string | undefined,
  label: string
): T | undefined {
  const trimmed = raw?.trim();
  return trimmed ? parseEnum(allowed, trimmed, label) : undefined;
}

function parseOptionalNumber(
  raw: string | undefined,
  field: ValidationField,
  label: string,
  { range, integer = false }: { range?: NumberRange; integer?: boolean } = {}
): number | undefined {
  const trimmed = raw?.trim();
  if (!trimmed) return undefined;
  const n = Number(trimmed.replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) {
    throw new FieldValidationError(field, `${label} debe ser un número mayor que cero.`);
  }
  if (integer && !Number.isInteger(n)) {
    throw new FieldValidationError(field, `${label} debe ser un número entero.`);
  }
  if (range && (n < range.min || n > range.max)) {
    throw new FieldValidationError(field, `${label} debe estar entre ${range.min} y ${range.max}.`);
  }
  return n;
}

function parseOptionalPace(raw: string | undefined, field: ValidationField): number | undefined {
  const trimmed = raw?.trim();
  if (!trimmed) return undefined;
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
  const disciplines = [...new Set(input.disciplines)].map((d) =>
    parseEnum(DISCIPLINE_ORDER, d, "Disciplinas")
  );

  const thresholds: AthleteThresholds = {
    runThresholdPaceSecPerKm: parseOptionalPace(input.runThresholdPace, "runPace"),
    bikeFtpWatts: parseOptionalNumber(input.bikeFtpWatts, "ftp", "El FTP", { integer: true }),
    swimThresholdPaceSecPer100m: parseOptionalPace(input.swimThresholdPace, "swimPace"),
    maxHr: parseOptionalNumber(input.maxHr, "maxHr", "La FC máxima", {
      range: MAX_HR_RANGE,
      integer: true,
    }),
    restHr: parseOptionalNumber(input.restHr, "restHr", "La FC de reposo", {
      range: REST_HR_RANGE,
      integer: true,
    }),
  };
  if (thresholds.maxHr && thresholds.restHr && thresholds.restHr >= thresholds.maxHr) {
    throw new FieldValidationError("restHr", "La FC de reposo debe ser menor que la máxima.");
  }
  const hasThresholds = Object.values(thresholds).some((v) => v !== undefined);

  return {
    disciplines,
    level: parseOptionalEnum(EXPERIENCE_LEVEL_ORDER, input.level, "Nivel"),
    weeklyAvailabilityDays: parseOptionalNumber(
      input.weeklyAvailabilityDays,
      "weeklyDays",
      "El número de días",
      { range: WEEKLY_DAYS_RANGE, integer: true }
    ),
    weeklyAvailabilityHours: parseOptionalNumber(
      input.weeklyAvailabilityHours,
      "weeklyHours",
      "El número de horas",
      { range: WEEKLY_HOURS_RANGE }
    ),
    thresholds: hasThresholds ? thresholds : undefined,
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

/** Validates + parses a goal form, whether it came from creation or the athlete profile's edit dialog. */
function buildGoalInput(input: SaveGoalInput): GoalInput {
  const type = parseEnum(GOAL_TYPES, input.type, "Objetivo");
  if (type === "maintenance") {
    return { type: "maintenance" };
  }

  const raceName = input.raceName?.trim() || undefined;
  const raceDate = input.raceDate?.trim() || undefined;

  if (!raceName) throw new FieldValidationError("raceName", "Indica el nombre de la carrera.");
  if (!raceDate) throw new FieldValidationError("raceDate", "Indica la fecha de la carrera.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raceDate) || Number.isNaN(new Date(raceDate).getTime())) {
    throw new FieldValidationError("raceDate", "La fecha no es válida.");
  }
  // An active goal points forward; a race that already happened is a result, not a goal.
  if (daysUntil(raceDate) < 0) {
    throw new FieldValidationError("raceDate", "La fecha de la carrera ya pasó.");
  }

  const modality = parseOptionalEnum(GOAL_MODALITIES, input.modality, "Modalidad");
  const format = input.format?.trim() || undefined;
  if (format && (!modality || !isFormatFor(modality, format))) {
    throw new FieldValidationError("general", "Valor no válido para «Formato».");
  }

  return {
    type: "race",
    raceName,
    raceDate,
    modality,
    format,
    targetPaceSecPerKm: parseOptionalPace(input.targetPace, "targetPace"),
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

/** Creates the athlete's athlete profile as `draft`, or `invited` when `sendInviteNow` + a valid email are given. */
export async function createAthlete(coachId: string, input: CreateAthleteInput): Promise<Athlete> {
  const fullName = input.fullName.trim();
  const email = input.email?.trim() || undefined;
  const phone = input.phone?.trim() || undefined;
  const birthDate = input.birthDate?.trim() || undefined;

  if (!fullName) throw new FieldValidationError("fullName", "El nombre es obligatorio.");
  if (email && !isValidEmail(email)) {
    throw new FieldValidationError("email", "Introduce un email válido.");
  }
  if (input.sendInviteNow && !email) {
    throw new FieldValidationError("email", "Necesitas un email para invitar ahora.");
  }
  if (birthDate && Number.isNaN(new Date(birthDate).getTime())) {
    throw new FieldValidationError("birthDate", "La fecha de nacimiento no es válida.");
  }

  const profile = buildSportProfile(input);
  const goal = buildGoalInput(input.goal);

  return getRepo().createAthlete(coachId, {
    fullName,
    email,
    phone,
    birthDate,
    sex: parseOptionalEnum(ATHLETE_SEXES, input.sex, "Sexo"),
    ...profile,
    goal,
    sendInviteNow: input.sendInviteNow,
  });
}

/** Sends (or resends) the portal invite. `email` backfills a draft athlete that had none yet. */
export async function sendInvite(
  athleteId: string,
  coachId: string,
  email?: string
): Promise<Athlete> {
  const trimmed = email?.trim() || undefined;
  if (trimmed && !isValidEmail(trimmed)) {
    throw new FieldValidationError("email", "Introduce un email válido.");
  }
  return getRepo().sendInvite(athleteId, coachId, trimmed);
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
  const fullName = input.fullName.trim();
  const email = input.email?.trim() || undefined;
  const phone = input.phone?.trim() || undefined;
  const birthDate = input.birthDate?.trim() || undefined;

  if (!fullName) throw new FieldValidationError("fullName", "El nombre es obligatorio.");
  if (email && !isValidEmail(email)) {
    throw new FieldValidationError("email", "Introduce un email válido.");
  }
  if (birthDate && Number.isNaN(new Date(birthDate).getTime())) {
    throw new FieldValidationError("birthDate", "La fecha de nacimiento no es válida.");
  }
  const sex = parseOptionalEnum(ATHLETE_SEXES, input.sex, "Sexo");

  // Clearing the email of an already-invited athlete would leave the invite
  // pointing nowhere, so it stays required once access has been granted.
  const current = await getRepo().getDetail(athleteId, coachId);
  if (!email && current && current.athlete.accessStatus !== "draft") {
    throw new FieldValidationError(
      "email",
      "No puedes quitar el email de un atleta ya invitado. Cancela la invitación primero."
    );
  }

  return getRepo().updateAthlete(athleteId, coachId, {
    fullName,
    email,
    phone,
    birthDate,
    sex,
  });
}

export async function saveSportProfile(
  athleteId: string,
  coachId: string,
  input: SportProfileFormInput
): Promise<Athlete> {
  const profile = buildSportProfile(input);
  return getRepo().updateSportProfile(athleteId, coachId, profile);
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
  const mode = parseEnum(MEMBERSHIP_MODES, input.mode, "Modo de pago");

  const current = await getRepo().getDetail(athleteId, coachId);
  if (!current) throw new Error("Atleta no encontrado");
  const currentPeriodStatus = periodStatusAfterModeChange(current.membership, mode);

  if (mode === "free") {
    return getRepo().updateMembership(athleteId, coachId, {
      mode,
      currency: input.currency,
      currentPeriodStatus,
    });
  }

  const raw = input.amount?.trim();
  if (!raw) throw new FieldValidationError("amount", "Indica el monto mensual.");

  const amount = Number(raw.replace(",", "."));
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new FieldValidationError("amount", "El monto debe ser un número mayor que cero.");
  }

  return getRepo().updateMembership(athleteId, coachId, {
    mode,
    amount,
    currency: input.currency,
    currentPeriodStatus,
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
  const reference = parseEnum(RACE_REFERENCES, input.reference, "Distancia");
  const timeSeconds = parseDuration(input.time);
  if (timeSeconds === null || timeSeconds <= 0) {
    throw new FieldValidationError("time", "Usa el formato mm:ss o h:mm:ss (por ejemplo 21:30).");
  }

  const recordedOn = input.recordedOn.trim();
  if (!recordedOn) throw new FieldValidationError("recordedOn", "Indica la fecha de la marca.");
  if (Number.isNaN(new Date(recordedOn).getTime())) {
    throw new FieldValidationError("recordedOn", "La fecha no es válida.");
  }

  return getRepo().addRaceRecord(athleteId, coachId, {
    reference,
    timeSeconds,
    recordedOn,
    note: input.note?.trim() || undefined,
  });
}

export async function markPeriodPaid(
  athleteId: string,
  coachId: string,
  note?: string
): Promise<void> {
  await getRepo().markCurrentPeriodPaid(athleteId, coachId, { note });
}
