import { mockAthleteRepository } from "@/lib/db/repositories/athletes-repo.mock";
import type {
  AthleteRepository,
  GoalInput,
  MembershipInput,
  SportProfileInput,
} from "@/lib/domain/repositories";
import type {
  Athlete,
  AthleteDetail,
  AthleteSex,
  AthleteThresholds,
  Discipline,
  ExperienceLevel,
  Goal,
  GoalType,
  Membership,
  RaceRecord,
  RaceReference,
} from "@/lib/domain/types";
import { parseDuration } from "@/lib/domain/time";

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

function parseOptionalInt(
  raw: string | undefined,
  field: ValidationField,
  label: string
): number | undefined {
  const trimmed = raw?.trim();
  if (!trimmed) return undefined;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n <= 0) {
    throw new FieldValidationError(field, `${label} debe ser un número mayor que cero.`);
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
  disciplines: Discipline[];
  level?: ExperienceLevel;
  weeklyAvailabilityDays?: string;
  weeklyAvailabilityHours?: string;
  runThresholdPace?: string;
  bikeFtpWatts?: string;
  swimThresholdPace?: string;
  maxHr?: string;
  restHr?: string;
}

function buildSportProfile(input: SportProfileFormInput): SportProfileInput {
  const thresholds: AthleteThresholds = {
    runThresholdPaceSecPerKm: parseOptionalPace(input.runThresholdPace, "runPace"),
    bikeFtpWatts: parseOptionalInt(input.bikeFtpWatts, "ftp", "El FTP"),
    swimThresholdPaceSecPer100m: parseOptionalPace(input.swimThresholdPace, "swimPace"),
    maxHr: parseOptionalInt(input.maxHr, "maxHr", "La FC máxima"),
    restHr: parseOptionalInt(input.restHr, "restHr", "La FC de reposo"),
  };
  const hasThresholds = Object.values(thresholds).some((v) => v !== undefined);

  return {
    disciplines: input.disciplines,
    level: input.level,
    weeklyAvailabilityDays: parseOptionalInt(input.weeklyAvailabilityDays, "weeklyDays", "Los días"),
    weeklyAvailabilityHours: parseOptionalInt(
      input.weeklyAvailabilityHours,
      "weeklyHours",
      "Las horas"
    ),
    thresholds: hasThresholds ? thresholds : undefined,
  };
}

export interface SaveGoalInput {
  type: GoalType;
  raceName?: string;
  raceDate?: string;
  modality?: GoalInput["modality"];
  format?: string;
  /** Free-form "m:ss" as typed by the coach; parsed here. */
  targetPace?: string;
}

/** Validates + parses a goal form, whether it came from creation or the athlete profile's edit dialog. */
function buildGoalInput(input: SaveGoalInput): GoalInput {
  if (input.type === "maintenance") {
    return { type: "maintenance" };
  }

  const raceName = input.raceName?.trim() || undefined;
  const raceDate = input.raceDate?.trim() || undefined;

  if (!raceName) throw new FieldValidationError("raceName", "Indica el nombre de la carrera.");
  if (!raceDate) throw new FieldValidationError("raceDate", "Indica la fecha de la carrera.");
  if (Number.isNaN(new Date(raceDate).getTime())) {
    throw new FieldValidationError("raceDate", "La fecha no es válida.");
  }

  return {
    type: "race",
    raceName,
    raceDate,
    modality: input.modality,
    format: input.format,
    targetPaceSecPerKm: parseOptionalPace(input.targetPace, "targetPace"),
  };
}

export interface CreateAthleteInput extends SportProfileFormInput {
  fullName: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  sex?: AthleteSex;
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
    sex: input.sex,
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
  sex?: AthleteSex;
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
    sex: input.sex,
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
  mode: MembershipInput["mode"];
  /** Free-form amount as typed; parsed here. */
  amount?: string;
  currency: string;
}

export async function saveMembership(
  athleteId: string,
  coachId: string,
  input: SaveMembershipInput
): Promise<Membership> {
  if (input.mode === "free") {
    return getRepo().updateMembership(athleteId, coachId, {
      mode: "free",
      currency: input.currency,
    });
  }

  const raw = input.amount?.trim();
  if (!raw) throw new FieldValidationError("amount", "Indica el monto mensual.");

  const amount = Number(raw.replace(",", "."));
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new FieldValidationError("amount", "El monto debe ser un número mayor que cero.");
  }

  return getRepo().updateMembership(athleteId, coachId, {
    mode: input.mode,
    amount,
    currency: input.currency,
  });
}

export interface AddRecordInput {
  reference: RaceReference;
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
    reference: input.reference,
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
