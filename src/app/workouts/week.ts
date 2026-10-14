import { mondayOfISO, toISODate, weekDatesISO } from "@/lib/domain/time";
import type { AthleteDetail } from "@/lib/domain/types";
import { isRaceGoal } from "@/lib/domain/goals";

/** The week a `?week=YYYY-MM-DD` param points at (any day in it), defaulting to the current one. */
export function resolveWeek(param: string | string[] | undefined) {
  const todayISO = toISODate(new Date());
  const requested = typeof param === "string" && /^\d{4}-\d{2}-\d{2}$/.test(param) ? param : todayISO;
  const monday = mondayOfISO(requested);
  return { monday, dates: weekDatesISO(monday), todayISO };
}

export function objectiveLabel(detail: AthleteDetail): string {
  const goal = detail.activeGoal;
  return isRaceGoal(goal) ? goal.raceName ?? "Carrera" : "Mantenimiento";
}
