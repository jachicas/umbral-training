import type {
  AthleteStatus,
  Discipline,
  ExperienceLevel,
  Goal,
  MembershipMode,
  PaymentKind,
  PaymentMethod,
  PaymentPeriodStatus,
  RaceRecord,
  RaceReference,
} from "./types";
import type { AthletePaces, ResolvedPace, WeekPlan } from "./workouts";
import type { PaymentReport } from "./payments";
import type { PortalCheckin } from "./checkins";

/* The athlete's own portal, as the API serves it (/v1/portal). Read-only but for the profile basics. */

/** Who a signed-in account is: the coach's panel, or an athlete's portal. */
export type AccountRole = "coach" | "athlete";

export interface PortalAthlete {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  status: AthleteStatus;
  disciplines: Discipline[];
  level?: ExperienceLevel;
  weeklyAvailabilityDays?: number;
  weeklyAvailabilityHours?: number;
  groupName?: string;
}

export interface PortalHome {
  /** In the coach's timezone. */
  today: string;
  /** This week's Monday. */
  weekStart: string;
  /** The Monday of the newest week the coach sent (maybe next week's). */
  latestSentWeek?: string;
  athlete: PortalAthlete;
  coach: { fullName: string; email: string };
  goal: Goal | null;
  /** Oldest first. */
  records: RaceRecord[];
  /** Latest time per distance as a pace, or estimated from another distance. */
  referencePaces: Partial<Record<RaceReference, ResolvedPace>>;
  /** Last week's check-in, while it's open and they haven't answered. */
  pendingCheckin?: { weekStart: string; closesOn: string };
}

/** A week once the coach sent it; before that (or with nothing to train) there's no plan. */
export interface PortalWeek {
  weekStart: string;
  sentOn?: string;
  plan: WeekPlan | null;
  paces: AthletePaces;
  /** Null when they aren't asked about this week (not sent, or nothing to train). */
  checkin: PortalCheckin | null;
}

export interface PortalMembership {
  mode: MembershipMode;
  amount?: number;
  currency: string;
  configured: boolean;
  /** "YYYY-MM": the oldest owed month, else the current one. */
  currentPeriod: string;
  currentPeriodStatus: PaymentPeriodStatus;
  periodsOwed: number;
  amountOwed: number;
  dueOn?: string;
}

export interface PortalOwedMonth {
  period: string;
  amount: number;
  currency: string;
}

export interface PortalPayment {
  id: string;
  period: string;
  kind: PaymentKind;
  method?: PaymentMethod;
  paidOn: string;
  amount: number;
  currency: string;
}

/** A month the athlete can report as paid now: owed, or the next one ahead once up to date. */
export interface PayableMonth {
  period: string;
  amount: number;
  currency: string;
  advance: boolean;
}

export interface PortalPayments {
  membership: PortalMembership;
  /** Oldest first. */
  owed: PortalOwedMonth[];
  /** Newest first. */
  history: PortalPayment[];
  paymentInstructions?: string;
  /** Oldest first. */
  payable: PayableMonth[];
  /** Their latest reports, newest first. */
  reports: PaymentReport[];
}

/** What athletes may change about themselves. */
export interface PortalProfileInput {
  phone?: string;
  weeklyAvailabilityDays?: number;
  weeklyAvailabilityHours?: number;
}
