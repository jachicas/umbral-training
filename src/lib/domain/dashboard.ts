import type { Discipline, PaymentPeriodStatus, RaceDistances, RaceSport } from "./types";
import type { CheckinOverview } from "./checkins";

/*
 * The coach's day at a glance, as the API computes it (GET /v1/dashboard in
 * ../umbral-training-api). Dates are "YYYY-MM-DD" in the coach's timezone.
 */

export interface DashboardAthlete {
  id: string;
  fullName: string;
}

export interface DashboardOwing {
  athleteId: string;
  fullName: string;
  /** "YYYY-MM": the oldest month owed. */
  period: string;
  status: Extract<PaymentPeriodStatus, "pending" | "overdue">;
  periodsOwed: number;
  amountOwed: number;
  currency: string;
}

export interface DashboardRace {
  id: string;
  name: string;
  date: string;
  sport: RaceSport;
  sportLabel?: string;
  format?: string;
  distances?: RaceDistances;
  daysLeft: number;
  athletes: DashboardAthlete[];
}

export interface DashboardDay {
  date: string;
  /** Sessions the athletes have that day, per discipline. */
  sessions: Record<Discipline, number>;
}

export interface DashboardSession {
  date: string;
  athleteId: string;
  athleteName: string;
  sessionId: string;
  sessionName: string;
  discipline: Discipline;
}

export interface Dashboard {
  coachName: string;
  today: string;
  weekStart: string;
  weekSentOn: string | null;
  athletes: { total: number; withWeek: number; withoutWeek: DashboardAthlete[] };
  payments: {
    owingCount: number;
    overdueCount: number;
    unconfiguredCount: number;
    totals: { currency: string; amount: number }[];
    owing: DashboardOwing[];
  };
  races: { upcomingCount: number; next: DashboardRace[] };
  /** The newest week's check-ins (last week's until Saturday); null when nobody was asked. */
  checkins: CheckinOverview | null;
  week: DashboardDay[];
  /** Today's and tomorrow's, by day then athlete. */
  upcomingSessions: DashboardSession[];
}
