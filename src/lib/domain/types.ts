export type Discipline = "swim" | "bike" | "run" | "gym";

export type AthleteStatus = "active" | "archived";

/** Portal access lifecycle — independent of payment status. */
export type AccessStatus = "draft" | "invited" | "linked";

export type ExperienceLevel = "beginner" | "intermediate" | "advanced";

/** Only the two the age-grading tables the coach uses actually branch on. */
export type AthleteSex = "male" | "female";

/**
 * Per-discipline training thresholds. Nothing here is required — a runner
 * has no FTP, and a fresh athlete may have none of this yet.
 */
export interface AthleteThresholds {
  runThresholdPaceSecPerKm?: number;
  bikeFtpWatts?: number;
  swimThresholdPaceSecPer100m?: number;
  maxHr?: number;
  restHr?: number;
}

export interface Athlete {
  id: string;
  coachId: string;
  fullName: string;
  /** Optional until the coach wants to invite the athlete to the portal. */
  email?: string;
  phone?: string;
  birthDate?: string;
  sex?: AthleteSex;
  status: AthleteStatus;
  accessStatus: AccessStatus;
  disciplines: Discipline[];
  level?: ExperienceLevel;
  weeklyAvailabilityDays?: number;
  weeklyAvailabilityHours?: number;
  thresholds?: AthleteThresholds;
  avatarColor: string;
  createdAt: string;
}

export type RaceReference = "1k" | "5k" | "10k" | "21k";

export interface RaceRecord {
  id: string;
  athleteId: string;
  reference: RaceReference;
  timeSeconds: number;
  recordedOn: string;
  note?: string;
}

export type GoalType = "race" | "maintenance";

export type RaceSport = "road" | "trail" | "triathlon" | "duathlon" | "swim" | "cycling" | "hyrox" | "other";

/** What a race measures depends on its sport (see `RACE_DISTANCE_FIELDS`). */
export type RaceDistanceKey = "km" | "elevationM" | "swimKm" | "bikeKm" | "runKm" | "run1Km" | "run2Km" | "meters";
export type RaceDistances = Partial<Record<RaceDistanceKey, number>>;

/** A race in the coach's catalog: registered once, the goal of any number of athletes. */
export interface Race {
  id: string;
  name: string;
  date: string;
  location?: string;
  sport: RaceSport;
  /** Only for `other`: what kind of race it is ("Aguas abiertas"). */
  sportLabel?: string;
  format?: string;
  distances?: RaceDistances;
  /** Athletes with it as their active goal (catalog listings only). */
  athleteCount?: number;
}

export interface Goal {
  id: string;
  athleteId: string;
  type: GoalType;
  race?: Race;
  /** The race's name and date, kept flat for lists. */
  raceName?: string;
  raceDate?: string;
  /** Road and trail races aim for a pace; every other sport for a finish time. */
  targetPaceSecPerKm?: number;
  targetTimeSeconds?: number;
  status: "active" | "archived" | "completed";
}

export type MembershipMode = "manual" | "free" | "gateway";
export type PaymentPeriodStatus = "pending" | "paid" | "overdue" | "waived";

export interface Membership {
  id: string;
  athleteId: string;
  mode: MembershipMode;
  amount?: number;
  currency: string;
  currentPeriodLabel: string;
  currentPeriodStatus: PaymentPeriodStatus;
  paidOn?: string;
  lastPaymentNote?: string;
  /** When the next fee is due (computed by the API); absent when nothing is billed. */
  dueOn?: string;
}

export interface AssignedWorkout {
  id: string;
  athleteId: string;
  discipline: Discipline;
  name: string;
  scheduledDate: string;
}

export interface AthleteDetail {
  athlete: Athlete;
  records: RaceRecord[];
  activeGoal: Goal | null;
  membership: Membership;
  assignedWorkouts: AssignedWorkout[];
}
