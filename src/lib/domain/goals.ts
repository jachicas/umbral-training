import type { Goal, GoalModality, GoalType, RunningFormat, TriathlonFormat } from "./types";
import { daysUntil, formatDuration } from "./time";

export const GOAL_TYPES: GoalType[] = ["race", "maintenance"];

export const GOAL_MODALITIES: GoalModality[] = ["running", "triathlon"];

export const GOAL_MODALITY_LABEL: Record<GoalModality, string> = {
  running: "Running",
  triathlon: "Triatlón",
};

export const RUNNING_FORMAT_LABEL: Record<RunningFormat, string> = {
  "5k": "5K",
  "10k": "10K",
  "21k": "Media maratón",
  "42k": "Maratón",
  other: "Otro",
};

export const TRIATHLON_FORMAT_LABEL: Record<TriathlonFormat, string> = {
  sprint: "Sprint",
  olympic: "Olímpico",
  "70.3": "70.3",
  "140.6": "140.6",
  other: "Otro",
};

/** Formats available for a modality — drives the dependent select in the goal form. */
export function formatsFor(modality: GoalModality): { id: string; label: string }[] {
  const source = modality === "running" ? RUNNING_FORMAT_LABEL : TRIATHLON_FORMAT_LABEL;
  return Object.entries(source).map(([id, label]) => ({ id, label }));
}

/** True when `format` is one of the formats offered for `modality` (e.g. no "sprint" marathon). */
export function isFormatFor(modality: GoalModality, format: string): boolean {
  return formatsFor(modality).some((o) => o.id === format);
}

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

export function formatGoalPace(goal: Goal): string {
  if (!goal.targetPaceSecPerKm) return "—";
  return `${formatDuration(goal.targetPaceSecPerKm)} /km`;
}

/** Human-readable label for a goal's format, e.g. "olympic" -> "Olímpico". */
export function goalFormatLabel(goal: Pick<Goal, "modality" | "format">): string | undefined {
  if (!goal.format) return undefined;
  return goal.modality === "triathlon"
    ? TRIATHLON_FORMAT_LABEL[goal.format as TriathlonFormat]
    : RUNNING_FORMAT_LABEL[goal.format as RunningFormat];
}

/** Race goals within 30 days are flagged coral in the list to prompt taper planning. */
export const URGENT_RACE_THRESHOLD_DAYS = 30;
