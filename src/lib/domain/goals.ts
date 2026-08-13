import type { Goal, GoalModality, RunningFormat, TriathlonFormat } from "./types";
import { daysUntil, formatDuration } from "./time";

export const GOAL_MODALITY_LABEL: Record<GoalModality, string> = {
  running: "Running",
  triathlon: "Triatlón",
};

export const RUNNING_FORMAT_LABEL: Record<RunningFormat, string> = {
  "5k": "5K",
  "10k": "10K",
  "21k": "Media maratón",
  "42k": "Maratón",
  otro: "Otro",
};

export const TRIATHLON_FORMAT_LABEL: Record<TriathlonFormat, string> = {
  sprint: "Sprint",
  olimpico: "Olímpico",
  "70.3": "70.3",
  "140.6": "140.6",
  otro: "Otro",
};

/** Formats available for a modality — drives the dependent select in the goal form. */
export function formatsFor(modality: GoalModality): { id: string; label: string }[] {
  const source = modality === "running" ? RUNNING_FORMAT_LABEL : TRIATHLON_FORMAT_LABEL;
  return Object.entries(source).map(([id, label]) => ({ id, label }));
}

export function isRaceGoal(goal: Goal | null): goal is Goal & { type: "race" } {
  return goal !== null && goal.type === "race";
}

/**
 * A race goal can exist before the coach knows which race it is — creating a
 * ficha only asks for the goal *type*. Until name and date are in, the detail
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

export function goalDaysRemaining(goal: Goal): number | null {
  if (!goal.raceDate) return null;
  return daysUntil(goal.raceDate);
}

export function formatGoalPace(goal: Goal): string {
  if (!goal.targetPaceSecPerKm) return "—";
  return `${formatDuration(goal.targetPaceSecPerKm)} /km`;
}

/** Race goals within 30 days are flagged coral in the list to prompt taper planning. */
export const URGENT_RACE_THRESHOLD_DAYS = 30;
