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
  MembershipMode,
  MembershipPayment,
  PaymentMethod,
  Race,
  RaceDistances,
  RaceRecord,
  RaceReference,
  RaceSport,
} from "./types";
import type {
  AthletePaces,
  LibrarySessionInput,
  PlanChange,
  ResolvedPace,
  TrainingGroup,
  WeekPlan,
  WorkoutSession,
} from "./workouts";
import type { CheckinInput, PortalCheckin, WeeklyCheckin } from "./checkins";
import type { Dashboard } from "./dashboard";
import type { GuestChange } from "./guest-changes";
import type { PaymentReport, PaymentsOverview } from "./payments";
import type { PortalHome, PortalPayments, PortalProfileInput, PortalWeek } from "./portal";

/** A file to hand to the browser as a download. */
export interface DownloadFile {
  body: ArrayBuffer;
  contentType: string;
  disposition: string;
}

/** A new race for the catalog; only the fields its sport asks for are kept. */
export interface RaceInput {
  name: string;
  date: string;
  location?: string;
  sport: RaceSport;
  sportLabel?: string;
  format?: string;
  distances: RaceDistances;
}

/** A race goal points to a catalog race (`raceId`) or registers a new one (`race`). */
export interface GoalInput {
  type: GoalType;
  raceId?: string;
  race?: RaceInput;
  targetPaceSecPerKm?: number;
  targetTimeSeconds?: number;
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
  /** Archived athletes, with the same detail, to find and restore them. */
  listArchivedDetails(): Promise<AthleteDetail[]>;
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
  /** The coach's races from today on, by date — what a goal can point to. */
  listUpcomingRaces(coachId: string): Promise<Race[]>;
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
  /** Takes the athlete off the lists; their fee stops accruing from this month (what they owed stays). */
  archiveAthlete(athleteId: string): Promise<Athlete>;
  /** Brings an archived athlete back; billing resumes this month. */
  restoreAthlete(athleteId: string): Promise<Athlete>;
}

export interface MarkPaidInput {
  /** "YYYY-MM-DD"; today when left out. */
  paidOn?: string;
  method?: PaymentMethod;
  note?: string;
}

/**
 * Port for the coach's collections, implemented by the HTTP adapter for the
 * Laravel API (payments-repo.api.ts). The API owns every billing rule: which
 * months are owed and at what amount, settling the oldest first, undoing only
 * the latest. Each write returns the membership's new standing.
 */
export interface PaymentsRepository {
  getOverview(): Promise<PaymentsOverview>;
  /** Months settled (paid or waived), oldest first. */
  listPayments(athleteId: string): Promise<MembershipPayment[]>;
  /** Pays the oldest owed month. */
  markPaid(athleteId: string, input: MarkPaidInput): Promise<Membership>;
  /** Forgives the oldest owed month. */
  waive(athleteId: string, note?: string): Promise<Membership>;
  /** Emails the athlete a fee reminder now (the overdue one, or the heads-up). */
  remind(athleteId: string): Promise<Membership>;
  /** Undoes the latest settled month, which is owed again. */
  undo(athleteId: string, paymentId: string): Promise<Membership>;
  /** Reports waiting for review (oldest first), or the latest reviewed ones (newest first). */
  listReports(status: "pending" | "reviewed"): Promise<PaymentReport[]>;
  /** The money arrived: its months are settled as paid by transfer. */
  confirmReport(reportId: string): Promise<PaymentReport>;
  /** Sends it back to the athlete, with a reason they'll see. */
  rejectReport(reportId: string, reason?: string): Promise<PaymentReport>;
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
  getLibrarySession(sessionId: string): Promise<WorkoutSession | null>;
  createLibrarySession(input: LibrarySessionInput): Promise<WorkoutSession>;
  /** Weeks that already hold the session keep their copy. */
  updateLibrarySession(sessionId: string, input: LibrarySessionInput): Promise<WorkoutSession>;
  deleteLibrarySession(sessionId: string): Promise<void>;
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
  /** Rewrites one session (name and steps) in the athlete's own week; the discipline stays. */
  replaceAthleteSession(
    athleteId: string,
    weekStart: string,
    sessionId: string,
    session: Pick<LibrarySessionInput, "name" | "nodes">
  ): Promise<AthleteWeek>;
  setAthleteRepeatTimes(athleteId: string, weekStart: string, sessionId: string, repeatId: string, times: number): Promise<AthleteWeek>;
  setAthleteStepSeconds(athleteId: string, weekStart: string, sessionId: string, stepId: string, seconds: number): Promise<AthleteWeek>;
  /** Sends the week to the athletes and locks it (each one with an email gets their PDF); returns the date it was sent. */
  markWeekSent(weekStart: string): Promise<string>;
  /** The athlete's week as they receive it, as a PDF. */
  getWeekPdf(athleteId: string, weekStart: string): Promise<DownloadFile>;
  /** Every athlete's PDF of the week, in a zip. */
  getWeekPdfZip(weekStart: string): Promise<DownloadFile>;
  /** Each athlete's pace for every relative step in the plan, keyed by `stepKey`. */
  resolvePaces(planId: string, athleteIds: string[]): Promise<Record<string, AthletePaces>>;
  /** Pace per reference distance (latest time, or estimated from another distance). */
  getReferencePaces(athleteIds: string[]): Promise<Record<string, Record<RaceReference, ResolvedPace>>>;
}

/** The coach's own settings, kept by the API. */
export interface CoachSettings {
  /** How athletes pay the coach (bank, account); at the foot of every fee reminder. */
  paymentInstructions?: string;
}

export interface SettingsRepository {
  getSettings(): Promise<CoachSettings>;
  /** Blank clears them. */
  savePaymentInstructions(text: string): Promise<CoachSettings>;
}

/** The coach's view of an athlete's weekly check-ins. */
export interface CheckinRepository {
  /** Newest first (the last 12). */
  listForAthlete(athleteId: string): Promise<WeeklyCheckin[]>;
}

/** The coach's day at a glance; the API computes it. */
export interface DashboardRepository {
  getDashboard(): Promise<Dashboard>;
}

/** What the super admin changed as a guest; only the coach reads it. */
export interface GuestChangeRepository {
  /** The unseen ones, newest first. */
  listUnseen(): Promise<GuestChange[]>;
  markSeen(): Promise<void>;
}

/** The signed-in athlete's own portal; every call is about them, so nothing takes an id. */
export interface PortalRepository {
  getHome(): Promise<PortalHome>;
  getWeek(weekStart: string): Promise<PortalWeek>;
  getWeekPdf(weekStart: string): Promise<DownloadFile>;
  /** Saves (or changes, while it's open) the week's check-in; answers with it. */
  saveCheckin(weekStart: string, input: CheckinInput): Promise<PortalCheckin>;
  getPayments(): Promise<PortalPayments>;
  updateProfile(input: PortalProfileInput): Promise<PortalHome>;
  /** A transfer with its receipt (`months`, `paidOn`, `note?`, `receipt`); answers with the payments page. */
  reportPayment(form: FormData): Promise<PortalPayments>;
}
