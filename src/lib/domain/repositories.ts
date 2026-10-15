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
 * Port implemented by the HTTP adapter for the Laravel API
 * (src/lib/db/repositories/athletes-repo.api.ts). The API scopes everything
 * to the signed-in coach from the access token, so `coachId` is not sent;
 * it stays in the signature for the workouts mock and for callers.
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

/** What one athlete follows in a week: their own copy, else their group's week. */
export interface AthleteWeek {
  plan: WeekPlan | null;
  groupId: string | null;
  /** Net changes made to their own week (already summarized by the API). */
  changes: PlanChange[];
}

/**
 * Port for groups, the session library, weekly plans and paces, implemented
 * by the HTTP adapter for the Laravel API (workouts-repo.api.ts). The API
 * scopes everything to the signed-in coach and owns every rule: copying the
 * group's week on an athlete's first edit, the change log, locking sent
 * weeks, resolving paces.
 */
export interface WorkoutRepository {
  listGroups(): Promise<TrainingGroup[]>;
  createGroup(name: string): Promise<TrainingGroup>;
  renameGroup(groupId: string, name: string): Promise<TrainingGroup>;
  deleteGroup(groupId: string): Promise<void>;
  /** `groupId` null takes the athlete out of every group. */
  moveAthleteToGroup(athleteId: string, groupId: string | null): Promise<void>;
  /** Saved sessions the coach picks from when filling a day. */
  listSessionLibrary(): Promise<WorkoutSession[]>;
  /** Every plan of the week (groups' and athletes' own) and the date it was sent, if it was. */
  getWeek(weekStart: string): Promise<{ plans: WeekPlan[]; sentOn: string | null }>;
  getWeekPlan(planId: string): Promise<WeekPlan | null>;
  /** Creates the group's week, empty or as a copy of the previous week's; returns the existing one if any. */
  createGroupWeek(groupId: string, weekStart: string, copyPreviousWeek: boolean): Promise<WeekPlan>;
  /** Group weeks only: an athlete's own week changes through the athlete methods below. */
  addSession(planId: string, dayIndex: number, librarySessionId: string): Promise<WeekPlan>;
  removeSession(planId: string, sessionId: string): Promise<WeekPlan>;
  getAthleteWeek(athleteId: string, weekStart: string): Promise<AthleteWeek>;
  addAthleteSession(athleteId: string, weekStart: string, dayIndex: number, librarySessionId: string): Promise<AthleteWeek>;
  removeAthleteSession(athleteId: string, weekStart: string, sessionId: string): Promise<AthleteWeek>;
  setAthleteRepeatTimes(athleteId: string, weekStart: string, sessionId: string, repeatId: string, times: number): Promise<AthleteWeek>;
  setAthleteStepSeconds(athleteId: string, weekStart: string, sessionId: string, stepId: string, seconds: number): Promise<AthleteWeek>;
  /** Sends the week to the athletes and locks it; returns the date it was sent. */
  markWeekSent(weekStart: string): Promise<string>;
  /** Each athlete's pace for every relative step in the plan, keyed by `stepKey`. */
  resolvePaces(planId: string, athleteIds: string[]): Promise<Record<string, AthletePaces>>;
  /** Pace per reference distance (latest time, or estimated from another distance). */
  getReferencePaces(athleteIds: string[]): Promise<Record<string, Record<RaceReference, ResolvedPace>>>;
}
