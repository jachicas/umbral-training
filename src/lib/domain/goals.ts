import type { Goal } from "./types";
import { daysUntil, formatDuration } from "./time";
import { raceAimsForPace } from "./races";

export function isRaceGoal(goal: Goal | null): goal is Goal & { type: "race" } {
  return goal !== null && goal.type === "race";
}

/**
 * A race goal can exist before the coach knows which race it is — creating a
 * athlete profile only asks for the goal *type*. Until name and date are in, the detail
 * card must prompt for them rather than render a card full of blanks.
 */
export function isRaceGoalDefined(goal: Goal | null): boolean {
  return isRaceGoal(goal) && Boolean(goal.raceName) && Boolean(goal.raceDate);
}

/** "Carrera Maratón de Valencia" / "Mantenimiento" — used in list/detail summaries. */
export function goalSummaryLabel(goal: Goal | null): string {
  if (!goal || goal.type === "maintenance") return "Mantenimiento";
  return goal.raceName ? `Carrera · ${goal.raceName}` : "Carrera";
}

/** Where a race goal stands in time — a race that already happened has no "days left". */
export type RaceCountdown =
  | { status: "upcoming"; days: number }
  | { status: "today" }
  | { status: "past" };

export function raceCountdown(goal: Goal, from: Date = new Date()): RaceCountdown | null {
  if (!goal.raceDate) return null;
  const days = daysUntil(goal.raceDate, from);
  if (days > 0) return { status: "upcoming", days };
  return days === 0 ? { status: "today" } : { status: "past" };
}

/** The goal's target as shown on the card: a pace for road and trail, a finish time for the rest. */
export function goalTarget(goal: Goal): { value: string; label: string } {
  if (!goal.race || raceAimsForPace(goal.race.sport)) {
    return {
      value: goal.targetPaceSecPerKm ? `${formatDuration(goal.targetPaceSecPerKm)} /km` : "—",
      label: "ritmo objetivo",
    };
  }
  return {
    value: goal.targetTimeSeconds ? formatDuration(goal.targetTimeSeconds) : "—",
    label: "tiempo objetivo",
  };
}

/** Race goals within 30 days are flagged coral in the list to prompt taper planning. */
export const URGENT_RACE_THRESHOLD_DAYS = 30;
