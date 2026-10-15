import { rekeyedWorkoutRepository } from "@/lib/db/repositories/workouts-repo.rekeyed";
import { listAthletes } from "./athletes";
import type { WorkoutRepository } from "@/lib/domain/repositories";
import type { RaceReference } from "@/lib/domain/types";
import type {
  AthletePaces,
  PlanChange,
  ResolvedPace,
  TrainingGroup,
  WeekPlan,
  WorkoutSession,
} from "@/lib/domain/workouts";
import { DAYS_PER_WEEK, effectivePlanFor, groupOf, summarizeChanges } from "@/lib/domain/workouts";
import { toISODate } from "@/lib/domain/time";

function getRepo(): WorkoutRepository {
  return rekeyedWorkoutRepository;
}

const MAX_REPEAT_TIMES = 50;
const MAX_STEP_MINUTES = 600;

async function requireOwnAthlete(coachId: string, athleteId: string) {
  const own = await listAthletes(coachId);
  if (!own.some((a) => a.id === athleteId)) throw new Error("Atleta no encontrado.");
}

async function requirePlan(planId: string, coachId: string): Promise<WeekPlan> {
  const plan = await getRepo().getWeekPlan(planId, coachId);
  if (!plan) throw new Error("Semana no encontrada.");
  return plan;
}

/** A sent week is final: nothing in it can change anymore. */
async function assertWeekOpen(coachId: string, weekStart: string) {
  if (await getRepo().getWeekSentOn(coachId, weekStart)) {
    throw new Error("Esta semana ya se envió y no se puede cambiar.");
  }
}

/** Plan that can still be edited (its week hasn't been sent). */
async function requireOpenPlan(planId: string, coachId: string): Promise<WeekPlan> {
  const plan = await requirePlan(planId, coachId);
  await assertWeekOpen(coachId, plan.weekStart);
  return plan;
}

export async function getWeekSentOn(coachId: string, weekStart: string): Promise<string | null> {
  return getRepo().getWeekSentOn(coachId, weekStart);
}

export async function markWeekSent(coachId: string, weekStart: string) {
  await assertWeekOpen(coachId, weekStart);
  const plans = await getRepo().listWeekPlans(coachId, weekStart);
  if (plans.length === 0) throw new Error("No hay nada armado esta semana.");
  return getRepo().markWeekSent(coachId, weekStart, toISODate(new Date()));
}

export async function listGroups(coachId: string): Promise<TrainingGroup[]> {
  return getRepo().listGroups(coachId);
}

export async function moveAthleteToGroup(coachId: string, athleteId: string, groupId: string | null) {
  await requireOwnAthlete(coachId, athleteId);
  return getRepo().moveAthleteToGroup(coachId, athleteId, groupId);
}

export async function listSessionLibrary(coachId: string): Promise<WorkoutSession[]> {
  return getRepo().listSessionLibrary(coachId);
}

export async function listWeekPlans(coachId: string, weekStart: string): Promise<WeekPlan[]> {
  return getRepo().listWeekPlans(coachId, weekStart);
}

export async function getWeekPlan(planId: string, coachId: string): Promise<WeekPlan | null> {
  return getRepo().getWeekPlan(planId, coachId);
}

export async function createGroupWeek(
  coachId: string,
  groupId: string,
  weekStart: string,
  copyPreviousWeek: boolean
): Promise<WeekPlan> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) throw new Error("Semana no válida.");
  const groups = await getRepo().listGroups(coachId);
  if (!groups.some((g) => g.id === groupId)) throw new Error("Grupo no encontrado.");
  await assertWeekOpen(coachId, weekStart);
  return getRepo().createGroupWeek(coachId, groupId, weekStart, copyPreviousWeek);
}

export async function addSession(coachId: string, planId: string, dayIndex: number, librarySessionId: string) {
  if (!Number.isInteger(dayIndex) || dayIndex < 0 || dayIndex >= DAYS_PER_WEEK) throw new Error("Día no válido.");
  await requireOpenPlan(planId, coachId);
  const library = await getRepo().listSessionLibrary(coachId);
  if (!library.some((s) => s.id === librarySessionId)) throw new Error("Entreno no encontrado.");
  return getRepo().addSession(coachId, planId, dayIndex, librarySessionId);
}

export async function removeSession(coachId: string, planId: string, sessionId: string) {
  await requireOpenPlan(planId, coachId);
  return getRepo().removeSession(coachId, planId, sessionId);
}

/* ------------------------------------------------------------------ */
/*  One athlete's week                                                 */
/* ------------------------------------------------------------------ */

export interface AthleteWeek {
  /** The plan the athlete follows: their own copy, or their group's week. */
  plan: WeekPlan | null;
  group: TrainingGroup | null;
}

export async function getAthleteWeek(coachId: string, athleteId: string, weekStart: string): Promise<AthleteWeek> {
  await requireOwnAthlete(coachId, athleteId);
  const [groups, plans] = await Promise.all([getRepo().listGroups(coachId), getRepo().listWeekPlans(coachId, weekStart)]);
  const plan = effectivePlanFor(athleteId, groups, plans);
  return { plan, group: groupOf(athleteId, groups) ?? null };
}

/**
 * The athlete's own copy of the week, created from their group's week on the
 * first edit. From then on it no longer follows changes to the group's week.
 */
async function ensureCustomWeek(coachId: string, athleteId: string, weekStart: string): Promise<WeekPlan> {
  await assertWeekOpen(coachId, weekStart);
  const { plan } = await getAthleteWeek(coachId, athleteId, weekStart);
  if (!plan) throw new Error("Su grupo todavía no tiene la semana armada.");
  if (plan.owner.kind === "athlete") return plan;
  return getRepo().createCustomWeek(coachId, athleteId, plan.id);
}

function findSession(plan: WeekPlan, sessionId: string) {
  for (const [dayIndex, sessions] of plan.days.entries()) {
    const session = sessions.find((s) => s.id === sessionId);
    if (session) return { session, dayIndex };
  }
  return null;
}

export async function addAthleteSession(
  coachId: string,
  athleteId: string,
  weekStart: string,
  dayIndex: number,
  librarySessionId: string
) {
  const plan = await ensureCustomWeek(coachId, athleteId, weekStart);
  const session = await addSession(coachId, plan.id, dayIndex, librarySessionId);
  await getRepo().addPlanChange(coachId, plan.id, {
    kind: "added",
    on: toISODate(new Date()),
    dayIndex,
    sessionId: session.id,
    sessionName: session.name,
  });
}

export async function removeAthleteSession(coachId: string, athleteId: string, weekStart: string, sessionId: string) {
  const plan = await ensureCustomWeek(coachId, athleteId, weekStart);
  const found = findSession(plan, sessionId);
  if (!found) throw new Error("Entreno no encontrado.");
  await getRepo().removeSession(coachId, plan.id, sessionId);
  await getRepo().addPlanChange(coachId, plan.id, {
    kind: "removed",
    on: toISODate(new Date()),
    dayIndex: found.dayIndex,
    sessionId,
    sessionName: found.session.name,
  });
}

export async function setAthleteRepeatTimes(
  coachId: string,
  athleteId: string,
  weekStart: string,
  sessionId: string,
  repeatId: string,
  times: number
) {
  if (!Number.isInteger(times) || times < 1 || times > MAX_REPEAT_TIMES) {
    throw new Error(`Las series deben estar entre 1 y ${MAX_REPEAT_TIMES}.`);
  }
  const plan = await ensureCustomWeek(coachId, athleteId, weekStart);
  const found = findSession(plan, sessionId);
  const repeat = found?.session.nodes.find((n) => n.type === "repeat" && n.id === repeatId);
  if (!found || !repeat || repeat.type !== "repeat") throw new Error("Bloque de series no válido.");
  const from = repeat.times;
  await getRepo().setRepeatTimes(coachId, plan.id, sessionId, repeatId, times);
  await getRepo().addPlanChange(coachId, plan.id, {
    kind: "sets",
    on: toISODate(new Date()),
    dayIndex: found.dayIndex,
    sessionId,
    sessionName: found.session.name,
    repeatId,
    from,
    to: times,
  });
}

/** Changes how many minutes a time-based step lasts in the athlete's week. */
export async function setAthleteStepMinutes(
  coachId: string,
  athleteId: string,
  weekStart: string,
  sessionId: string,
  stepId: string,
  minutes: number
) {
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > MAX_STEP_MINUTES) {
    throw new Error(`Los minutos deben estar entre 1 y ${MAX_STEP_MINUTES}.`);
  }
  const plan = await ensureCustomWeek(coachId, athleteId, weekStart);
  const found = findSession(plan, sessionId);
  const step = found?.session.nodes
    .flatMap((n) => (n.type === "repeat" ? n.steps : [n]))
    .find((st) => st.id === stepId);
  if (!found || !step || step.duration.kind !== "time") throw new Error("Paso no válido.");
  const from = step.duration.seconds;
  await getRepo().setStepSeconds(coachId, plan.id, sessionId, stepId, minutes * 60);
  await getRepo().addPlanChange(coachId, plan.id, {
    kind: "duration",
    on: toISODate(new Date()),
    dayIndex: found.dayIndex,
    sessionId,
    sessionName: found.session.name,
    stepId,
    stepKind: step.kind,
    from,
    to: minutes * 60,
  });
}

/** Net changes made to an athlete's own week (empty while they follow the group's). */
export async function getAthleteWeekChanges(coachId: string, plan: WeekPlan): Promise<PlanChange[]> {
  if (plan.owner.kind !== "athlete") return [];
  return summarizeChanges(await getRepo().listPlanChanges(coachId, plan.id));
}

export async function resolvePaces(
  coachId: string,
  planId: string,
  athleteIds: string[]
): Promise<Record<string, AthletePaces>> {
  return getRepo().resolvePaces(coachId, planId, athleteIds);
}

export async function getReferencePaces(
  coachId: string,
  athleteIds: string[]
): Promise<Record<string, Record<RaceReference, ResolvedPace>>> {
  return getRepo().getReferencePaces(coachId, athleteIds);
}
