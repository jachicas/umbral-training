"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentCoachId } from "@/lib/supabase/auth";
import * as workoutsService from "@/lib/services/workouts";

export interface ActionState {
  error?: string;
}

function errorState(error: unknown): ActionState {
  return { error: error instanceof Error ? error.message : "Algo salió mal." };
}

/** Runs a mutation and refreshes every Entrenos screen; errors come back as state instead of throwing. */
async function mutate(run: (coachId: string) => Promise<unknown>): Promise<ActionState> {
  try {
    await run(await getCurrentCoachId());
  } catch (error) {
    return errorState(error);
  }
  revalidatePath("/workouts", "layout");
  return {};
}

export async function createGroupWeekAction(
  groupId: string,
  weekStart: string,
  copyPreviousWeek: boolean
): Promise<ActionState> {
  let planId: string;
  try {
    const coachId = await getCurrentCoachId();
    planId = (await workoutsService.createGroupWeek(coachId, groupId, weekStart, copyPreviousWeek)).id;
  } catch (error) {
    return errorState(error);
  }
  revalidatePath("/workouts", "layout");
  redirect(`/workouts/plans/${planId}`);
}

export async function addSessionAction(planId: string, dayIndex: number, librarySessionId: string) {
  return mutate((coachId) => workoutsService.addSession(coachId, planId, dayIndex, librarySessionId));
}

export async function removeSessionAction(planId: string, sessionId: string) {
  return mutate((coachId) => workoutsService.removeSession(coachId, planId, sessionId));
}

/* Edits to one athlete's week: the first one copies the group's week for them. */

export async function addAthleteSessionAction(
  athleteId: string,
  weekStart: string,
  dayIndex: number,
  librarySessionId: string
) {
  return mutate((coachId) =>
    workoutsService.addAthleteSession(coachId, athleteId, weekStart, dayIndex, librarySessionId)
  );
}

export async function removeAthleteSessionAction(athleteId: string, weekStart: string, sessionId: string) {
  return mutate((coachId) => workoutsService.removeAthleteSession(coachId, athleteId, weekStart, sessionId));
}

export async function setAthleteRepeatTimesAction(
  athleteId: string,
  weekStart: string,
  sessionId: string,
  repeatId: string,
  times: number
) {
  return mutate((coachId) =>
    workoutsService.setAthleteRepeatTimes(coachId, athleteId, weekStart, sessionId, repeatId, times)
  );
}

export async function setAthleteStepMinutesAction(
  athleteId: string,
  weekStart: string,
  sessionId: string,
  stepId: string,
  minutes: number
) {
  return mutate((coachId) =>
    workoutsService.setAthleteStepMinutes(coachId, athleteId, weekStart, sessionId, stepId, minutes)
  );
}

/** Locks the week: once sent, nothing in it can change. */
export async function markWeekSentAction(weekStart: string) {
  return mutate((coachId) => workoutsService.markWeekSent(coachId, weekStart));
}

export async function moveAthleteAction(athleteId: string, groupId: string | null) {
  return mutate((coachId) => workoutsService.moveAthleteToGroup(coachId, athleteId, groupId));
}
