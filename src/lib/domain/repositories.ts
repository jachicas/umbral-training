import type {
  Athlete,
  AthleteDetail,
  AthleteSex,
  AthleteThresholds,
  Discipline,
  ExperienceLevel,
  Goal,
  GoalModality,
  GoalType,
  Membership,
  MembershipMode,
  RaceRecord,
  RaceReference,
} from "./types";

/** Race detail is absent while the coach still only knows it's "a race". */
export interface GoalInput {
  type: GoalType;
  raceName?: string;
  raceDate?: string;
  modality?: GoalModality;
  format?: string;
  targetPaceSecPerKm?: number;
}

export interface MembershipInput {
  mode: MembershipMode;
  amount?: number;
  currency: string;
}

export interface RaceRecordInput {
  reference: RaceReference;
  timeSeconds: number;
  recordedOn: string;
  note?: string;
}

/** Name, contact and biographical basics — never framework- or discipline-specific. */
export interface AthleteIdentityInput {
  fullName: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  sex?: AthleteSex;
}

/** Disciplines, experience and the thresholds that condition on them. */
export interface SportProfileInput {
  disciplines: Discipline[];
  level?: ExperienceLevel;
  weeklyAvailabilityDays?: number;
  weeklyAvailabilityHours?: number;
  thresholds?: AthleteThresholds;
}

/**
 * Port implemented by the persistence layer (Drizzle/Supabase today: an
 * in-memory mock — see src/lib/db/repositories). Every query is already
 * scoped to `coachId`; RLS is the second, DB-level line of defense.
 */
export interface AthleteRepository {
  listByCoach(coachId: string): Promise<Athlete[]>;
  /** Full detail (records/goal/membership) for every athlete — powers the list card grid. */
  listDetailsByCoach(coachId: string): Promise<AthleteDetail[]>;
  getDetail(athleteId: string, coachId: string): Promise<AthleteDetail | null>;
  /** Creates the athlete's athlete profile. `sendInviteNow` (with an email) starts it as "invited" instead of "draft". */
  createAthlete(
    coachId: string,
    input: AthleteIdentityInput &
      SportProfileInput & {
        goal: GoalInput;
        sendInviteNow: boolean;
      }
  ): Promise<Athlete>;
  /** Sends (or resends) the portal invite. `email` backfills a draft athlete that had none yet. */
  sendInvite(athleteId: string, coachId: string, email?: string): Promise<Athlete>;
  cancelInvite(athleteId: string, coachId: string): Promise<Athlete>;
  updateAthlete(
    athleteId: string,
    coachId: string,
    input: AthleteIdentityInput
  ): Promise<Athlete>;
  updateSportProfile(
    athleteId: string,
    coachId: string,
    input: SportProfileInput
  ): Promise<Athlete>;
  /** Replaces the athlete's active goal (there is only ever one). */
  upsertActiveGoal(athleteId: string, coachId: string, input: GoalInput): Promise<Goal>;
  updateMembership(
    athleteId: string,
    coachId: string,
    input: MembershipInput
  ): Promise<Membership>;
  addRaceRecord(
    athleteId: string,
    coachId: string,
    input: RaceRecordInput
  ): Promise<RaceRecord>;
  markCurrentPeriodPaid(
    athleteId: string,
    coachId: string,
    input: { note?: string }
  ): Promise<void>;
}
