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
  PaymentPeriodStatus,
  RaceRecord,
  RaceReference,
} from "./types";
import type {
  AthletePaces,
  PlanChange,
  ResolvedPace,
  TrainingGroup,
  WeekPlan,
  WorkoutSession,
} from "./workouts";

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
  /** Decided by the service (see `periodStatusAfterModeChange`), not by the adapter. */
  currentPeriodStatus: PaymentPeriodStatus;
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

/**
 * Port for groups and weekly plans. The real implementation will call the
 * backend API, which owns pace resolution; today it's an in-memory mock with
 * precomputed paces (src/lib/db/repositories/workouts-repo.mock.ts).
 */
export interface WorkoutRepository {
  listGroups(coachId: string): Promise<TrainingGroup[]>;
  /** `groupId` null takes the athlete out of every group. */
  moveAthleteToGroup(coachId: string, athleteId: string, groupId: string | null): Promise<void>;
  /** Saved sessions the coach picks from when filling a day. */
  listSessionLibrary(coachId: string): Promise<WorkoutSession[]>;
  listWeekPlans(coachId: string, weekStart: string): Promise<WeekPlan[]>;
  getWeekPlan(planId: string, coachId: string): Promise<WeekPlan | null>;
  /** Creates the group's week, empty or as a copy of the previous week's. */
  createGroupWeek(
    coachId: string,
    groupId: string,
    weekStart: string,
    copyPreviousWeek: boolean
  ): Promise<WeekPlan>;
  /** Copies `fromPlanId` (a group week) into a custom week for one athlete; returns the existing one if any. */
  createCustomWeek(coachId: string, athleteId: string, fromPlanId: string): Promise<WeekPlan>;
  /** Returns the session as placed in the plan (with its own id). */
  addSession(coachId: string, planId: string, dayIndex: number, librarySessionId: string): Promise<WorkoutSession>;
  removeSession(coachId: string, planId: string, sessionId: string): Promise<void>;
  /** Changes how many sets a repeat has in this plan. */
  setRepeatTimes(coachId: string, planId: string, sessionId: string, repeatId: string, times: number): Promise<void>;
  /** Changes a time-based step's length (seconds) in this plan. */
  setStepSeconds(coachId: string, planId: string, sessionId: string, stepId: string, seconds: number): Promise<void>;
  /** Date the week was sent to the athletes ("YYYY-MM-DD"), or null while it's still open. */
  getWeekSentOn(coachId: string, weekStart: string): Promise<string | null>;
  markWeekSent(coachId: string, weekStart: string, sentOn: string): Promise<void>;
  /** Raw log of edits made to an athlete's own week, oldest first. */
  listPlanChanges(coachId: string, planId: string): Promise<PlanChange[]>;
  addPlanChange(coachId: string, planId: string, change: PlanChange): Promise<void>;
  /** Backend-resolved paces for each athlete in a plan. */
  resolvePaces(coachId: string, planId: string, athleteIds: string[]): Promise<Record<string, AthletePaces>>;
  /** Latest reference pace per distance, with missing distances estimated. */
  getReferencePaces(
    coachId: string,
    athleteIds: string[]
  ): Promise<Record<string, Record<RaceReference, ResolvedPace>>>;
}
