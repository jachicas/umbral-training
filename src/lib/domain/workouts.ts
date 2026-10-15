import type { Discipline, RaceReference } from "./types";

/*
 * Weekly plans. The coach writes one week (Mon–Sun, any number of sessions
 * per day) for a fixed group of athletes; every athlete in the group gets it
 * with their own paces and, optionally, their own number of sets. An athlete
 * who drifts from the group (e.g. an earlier race) gets a custom copy.
 *
 * Each athlete follows their group's week until the coach edits *their*
 * week: the first edit copies the group's week into a custom one, which from
 * then on no longer receives the group's changes.
 *
 * These types are the contract with the backend, which owns pace resolution:
 * nothing in this app turns "85% of the 1k" into a pace.
 */

export type WorkoutStepKind = "warmup" | "work" | "recovery" | "cooldown";

export type StepDuration =
  | { kind: "distance"; meters: number }
  | { kind: "time"; seconds: number };

/** How the coach prescribes intensity for a step. */
export type IntensityTarget =
  /** e.g. "85% of the 1k pace" — resolved per athlete by the backend. */
  | { kind: "relative"; reference: RaceReference; percent: number }
  /** Free-form feel / RPE, the same for every athlete ("Suave", "RPE 7"). */
  | { kind: "feel"; label: string };

export interface WorkoutStep {
  type: "step";
  id: string;
  kind: WorkoutStepKind;
  duration: StepDuration;
  target: IntensityTarget;
}

export interface WorkoutRepeat {
  type: "repeat";
  id: string;
  times: number;
  steps: WorkoutStep[];
}

/** Free text (stretching, drills…): no duration or target, the same for everyone. */
export interface WorkoutNote {
  type: "note";
  id: string;
  text: string;
}

export type WorkoutNode = WorkoutStep | WorkoutRepeat | WorkoutNote;

/** One training session (a run, a swim, a gym block…). */
export interface WorkoutSession {
  id: string;
  name: string;
  discipline: Discipline;
  nodes: WorkoutNode[];
  /** On a session placed in a week: the library session it was copied from. */
  librarySessionId?: string | null;
}

/** A session as written in the editor: the API assigns node ids by position. */
export type WorkoutStepInput = Omit<WorkoutStep, "id">;
export type WorkoutNodeInput =
  | WorkoutStepInput
  | { type: "repeat"; times: number; steps: WorkoutStepInput[] }
  | { type: "note"; text: string };

export interface LibrarySessionInput {
  name: string;
  discipline: Discipline;
  nodes: WorkoutNodeInput[];
}

/** A fixed set of athletes who share the same weekly plan. */
export interface TrainingGroup {
  id: string;
  coachId: string;
  name: string;
  athleteIds: string[];
}

export type WeekPlanOwner =
  | { kind: "group"; groupId: string }
  /** A custom week for one athlete, copied from their group's week. */
  | { kind: "athlete"; athleteId: string; copiedFromPlanId: string };

export const DAYS_PER_WEEK = 7;

export interface WeekPlan {
  id: string;
  coachId: string;
  /** Monday of the week, "YYYY-MM-DD". */
  weekStart: string;
  owner: WeekPlanOwner;
  /** Seven entries, Monday first; each holds that day's sessions in order. */
  days: WorkoutSession[][];
}

/** A pace resolved by the backend; `estimated` when the reference time was derived from another distance. */
export interface ResolvedPace {
  paceSecPerKm: number;
  estimated: boolean;
}

/** Resolved paces for one athlete in a plan, keyed by `stepKey`. */
export type AthletePaces = Record<string, ResolvedPace>;

/** Step ids are only unique within a session, so plan-level keys include the session. */
export function stepKey(sessionId: string, stepId: string): string {
  return `${sessionId}/${stepId}`;
}

export function planSessions(plan: WeekPlan): WorkoutSession[] {
  return plan.days.flat();
}

export function sessionRepeats(session: WorkoutSession): WorkoutRepeat[] {
  return session.nodes.filter((n): n is WorkoutRepeat => n.type === "repeat");
}

/** Steps whose pace depends on the athlete. */
export function sessionRelativeSteps(session: WorkoutSession): WorkoutStep[] {
  return session.nodes
    .flatMap((n) => (n.type === "repeat" ? n.steps : n.type === "step" ? [n] : []))
    .filter((s) => s.target.kind === "relative");
}

/** Sessions that differ per athlete (paces or sets) — the ones worth reviewing athlete by athlete. */
export function isPersonalized(session: WorkoutSession): boolean {
  return sessionRelativeSteps(session).length > 0 || sessionRepeats(session).length > 0;
}

/**
 * The plan an athlete actually follows this week: their custom week if they
 * have one, otherwise their group's.
 */
export function effectivePlanFor(
  athleteId: string,
  groups: TrainingGroup[],
  plans: WeekPlan[]
): WeekPlan | null {
  const custom = customWeekOf(athleteId, plans);
  if (custom) return custom;
  const group = groupOf(athleteId, groups);
  if (!group) return null;
  return plans.find((p) => p.owner.kind === "group" && p.owner.groupId === group.id) ?? null;
}

export function customWeekOf(athleteId: string, plans: WeekPlan[]): WeekPlan | undefined {
  return plans.find((p) => p.owner.kind === "athlete" && p.owner.athleteId === athleteId);
}

export function groupOf(athleteId: string, groups: TrainingGroup[]): TrainingGroup | undefined {
  return groups.find((g) => g.athleteIds.includes(athleteId));
}

/* ------------------------------------------------------------------ */
/*  Changes made to an athlete's own week                              */
/* ------------------------------------------------------------------ */

interface PlanChangeBase {
  /** "YYYY-MM-DD" */
  on: string;
  dayIndex: number;
  sessionId: string;
  sessionName: string;
}

export type PlanChange =
  | (PlanChangeBase & { kind: "sets"; repeatId: string; from: number; to: number })
  /** A time-based step's length, in seconds. */
  | (PlanChangeBase & { kind: "duration"; stepId: string; stepKind: WorkoutStepKind; from: number; to: number })
  | (PlanChangeBase & { kind: "added" })
  | (PlanChangeBase & { kind: "removed" })
  /** The session itself was rewritten for this athlete (steps, targets, name). */
  | (PlanChangeBase & { kind: "edited" });
