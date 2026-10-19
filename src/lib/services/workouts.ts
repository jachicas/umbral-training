import { cache } from "react";
import { ApiValidationError } from "@/lib/api/client";
import { apiWorkoutRepository } from "@/lib/db/repositories/workouts-repo.api";
import type { AthleteWeek, DownloadFile, WorkoutRepository } from "@/lib/domain/repositories";
import type { RaceReference } from "@/lib/domain/types";
import type {
  AthletePaces,
  LibrarySessionInput,
  PlanChange,
  ResolvedPace,
  TrainingGroup,
  WeekPlan,
  WorkoutSession,
} from "@/lib/domain/workouts";

/*
 * The workouts module runs on the Laravel API, which owns every rule: one
 * week per group, the athlete's own copy on their first edit, the change
 * log, locking a sent week, resolving paces. These are thin pass-throughs;
 * the API answers rule violations with Spanish messages that the actions
 * show as-is.
 */

function getRepo(): WorkoutRepository {
  return apiWorkoutRepository;
}

/** One request per week per render: several pages read both its plans and its sent date. */
const getWeek = cache((weekStart: string) => getRepo().getWeek(weekStart));

export async function listWeekPlans(weekStart: string): Promise<WeekPlan[]> {
  return (await getWeek(weekStart)).plans;
}

export async function getWeekSentOn(weekStart: string): Promise<string | null> {
  return (await getWeek(weekStart)).sentOn;
}

export async function markWeekSent(weekStart: string): Promise<string> {
  return getRepo().markWeekSent(weekStart);
}

export async function getWeekPdf(athleteId: string, weekStart: string): Promise<DownloadFile> {
  return getRepo().getWeekPdf(athleteId, weekStart);
}

export async function getWeekPdfZip(weekStart: string): Promise<DownloadFile> {
  return getRepo().getWeekPdfZip(weekStart);
}

export const listGroups = cache((): Promise<TrainingGroup[]> => getRepo().listGroups());

export async function createGroup(name: string): Promise<TrainingGroup> {
  return getRepo().createGroup(name.trim());
}

export async function renameGroup(groupId: string, name: string): Promise<TrainingGroup> {
  return getRepo().renameGroup(groupId, name.trim());
}

export async function deleteGroup(groupId: string): Promise<void> {
  return getRepo().deleteGroup(groupId);
}

export async function moveAthleteToGroup(athleteId: string, groupId: string | null): Promise<void> {
  return getRepo().moveAthleteToGroup(athleteId, groupId);
}

export const listSessionLibrary = cache((): Promise<WorkoutSession[]> => getRepo().listSessionLibrary());

/** The API's rejections of a library session, keyed by path ("nodes.1.steps.0.duration.meters"). */
export class LibrarySessionErrors extends Error {
  constructor(public errors: Record<string, string>) {
    super(Object.values(errors)[0] ?? "Revisa la sesión.");
  }
}

async function withSessionErrors<T>(request: () => Promise<T>): Promise<T> {
  try {
    return await request();
  } catch (error) {
    if (error instanceof ApiValidationError) {
      throw new LibrarySessionErrors(
        Object.fromEntries(Object.entries(error.errors).map(([key, messages]) => [key, messages[0]]))
      );
    }
    throw error;
  }
}

export async function getLibrarySession(sessionId: string): Promise<WorkoutSession | null> {
  return getRepo().getLibrarySession(sessionId);
}

export async function createLibrarySession(input: LibrarySessionInput): Promise<WorkoutSession> {
  return withSessionErrors(() => getRepo().createLibrarySession(input));
}

export async function updateLibrarySession(sessionId: string, input: LibrarySessionInput): Promise<WorkoutSession> {
  return withSessionErrors(() => getRepo().updateLibrarySession(sessionId, input));
}

export async function deleteLibrarySession(sessionId: string): Promise<void> {
  return getRepo().deleteLibrarySession(sessionId);
}

export async function getWeekPlan(planId: string): Promise<WeekPlan | null> {
  return getRepo().getWeekPlan(planId);
}

export async function createGroupWeek(groupId: string, weekStart: string, copyPreviousWeek: boolean): Promise<WeekPlan> {
  return getRepo().createGroupWeek(groupId, weekStart, copyPreviousWeek);
}

export async function addSession(planId: string, dayIndex: number, librarySessionId: string): Promise<WeekPlan> {
  return getRepo().addSession(planId, dayIndex, librarySessionId);
}

export async function removeSession(planId: string, sessionId: string): Promise<WeekPlan> {
  return getRepo().removeSession(planId, sessionId);
}

/* ------------------------------------------------------------------ */
/*  One athlete's week: the first edit copies the group's week          */
/* ------------------------------------------------------------------ */

export const getAthleteWeek = cache(
  (athleteId: string, weekStart: string): Promise<AthleteWeek> => getRepo().getAthleteWeek(athleteId, weekStart)
);

export async function addAthleteSession(athleteId: string, weekStart: string, dayIndex: number, librarySessionId: string) {
  return getRepo().addAthleteSession(athleteId, weekStart, dayIndex, librarySessionId);
}

/** Rewrites one session for this athlete only; the API logs what changed. */
export async function replaceAthleteSession(
  athleteId: string,
  weekStart: string,
  sessionId: string,
  session: Pick<LibrarySessionInput, "name" | "nodes">
) {
  return withSessionErrors(() => getRepo().replaceAthleteSession(athleteId, weekStart, sessionId, session));
}

export async function removeAthleteSession(athleteId: string, weekStart: string, sessionId: string) {
  return getRepo().removeAthleteSession(athleteId, weekStart, sessionId);
}

export async function setAthleteRepeatTimes(
  athleteId: string,
  weekStart: string,
  sessionId: string,
  repeatId: string,
  times: number
) {
  return getRepo().setAthleteRepeatTimes(athleteId, weekStart, sessionId, repeatId, times);
}

/** The editor works in minutes; the API stores seconds. */
export async function setAthleteStepMinutes(
  athleteId: string,
  weekStart: string,
  sessionId: string,
  stepId: string,
  minutes: number
) {
  return getRepo().setAthleteStepSeconds(athleteId, weekStart, sessionId, stepId, minutes * 60);
}

/** Net changes made to an athlete's own week (empty for a group week). */
export async function getAthleteWeekChanges(plan: WeekPlan): Promise<PlanChange[]> {
  if (plan.owner.kind !== "athlete") return [];
  return (await getAthleteWeek(plan.owner.athleteId, plan.weekStart)).changes;
}

export async function resolvePaces(planId: string, athleteIds: string[]): Promise<Record<string, AthletePaces>> {
  return getRepo().resolvePaces(planId, athleteIds);
}

export async function getReferencePaces(
  athleteIds: string[]
): Promise<Record<string, Record<RaceReference, ResolvedPace>>> {
  return getRepo().getReferencePaces(athleteIds);
}
