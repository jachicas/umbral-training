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
export type GoalModality = "running" | "triathlon";
export type RunningFormat = "5k" | "10k" | "21k" | "42k" | "otro";
export type TriathlonFormat = "sprint" | "olimpico" | "70.3" | "140.6" | "otro";

export interface Goal {
  id: string;
  athleteId: string;
  type: GoalType;
  raceName?: string;
  raceDate?: string;
  modality?: GoalModality;
  format?: RunningFormat | TriathlonFormat;
  targetPaceSecPerKm?: number;
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
