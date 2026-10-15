"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as workoutsService from "@/lib/services/workouts";
import type { LibrarySessionInput } from "@/lib/domain/workouts";
import type { SessionEditorState } from "./library/actions";

export interface ActionState {
  error?: string;
}

function errorState(error: unknown): ActionState {
  return { error: error instanceof Error ? error.message : "Algo salió mal." };
}

/** Runs a mutation and refreshes every Entrenos screen; errors come back as state instead of throwing. */
async function mutate(run: () => Promise<unknown>): Promise<ActionState> {
  try {
    await run();
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
    planId = (await workoutsService.createGroupWeek(groupId, weekStart, copyPreviousWeek)).id;
  } catch (error) {
    return errorState(error);
  }
  revalidatePath("/workouts", "layout");
  redirect(`/workouts/plans/${planId}`);
}

export async function addSessionAction(planId: string, dayIndex: number, librarySessionId: string) {
  return mutate(() => workoutsService.addSession(planId, dayIndex, librarySessionId));
}

export async function removeSessionAction(planId: string, sessionId: string) {
  return mutate(() => workoutsService.removeSession(planId, sessionId));
}

/* Edits to one athlete's week: the first one copies the group's week for them. */

export async function addAthleteSessionAction(
  athleteId: string,
  weekStart: string,
  dayIndex: number,
  librarySessionId: string
) {
  return mutate(() =>
    workoutsService.addAthleteSession(athleteId, weekStart, dayIndex, librarySessionId)
  );
}

export async function removeAthleteSessionAction(athleteId: string, weekStart: string, sessionId: string) {
  return mutate(() => workoutsService.removeAthleteSession(athleteId, weekStart, sessionId));
}

export async function setAthleteRepeatTimesAction(
  athleteId: string,
  weekStart: string,
  sessionId: string,
  repeatId: string,
  times: number
) {
  return mutate(() =>
    workoutsService.setAthleteRepeatTimes(athleteId, weekStart, sessionId, repeatId, times)
  );
}

export async function setAthleteStepMinutesAction(
  athleteId: string,
  weekStart: string,
  sessionId: string,
  stepId: string,
  minutes: number
) {
  return mutate(() =>
    workoutsService.setAthleteStepMinutes(athleteId, weekStart, sessionId, stepId, minutes)
  );
}

/** Locks the week: once sent, nothing in it can change. */
export async function markWeekSentAction(weekStart: string) {
  return mutate(() => workoutsService.markWeekSent(weekStart));
}

export async function moveAthleteAction(athleteId: string, groupId: string | null) {
  return mutate(() => workoutsService.moveAthleteToGroup(athleteId, groupId));
}

/* Groups */

export async function createGroupAction(name: string) {
  return mutate(() => workoutsService.createGroup(name));
}

export async function renameGroupAction(groupId: string, name: string) {
  return mutate(() => workoutsService.renameGroup(groupId, name));
}

export async function deleteGroupAction(groupId: string) {
  return mutate(() => workoutsService.deleteGroup(groupId));
}

/* One session of an athlete's week, edited in full (from its own screen) */

export async function replaceAthleteSessionAction(
  athleteId: string,
  weekStart: string,
  sessionId: string,
  input: LibrarySessionInput
): Promise<SessionEditorState> {
  try {
    await workoutsService.replaceAthleteSession(athleteId, weekStart, sessionId, { name: input.name, nodes: input.nodes });
  } catch (error) {
    if (error instanceof workoutsService.LibrarySessionErrors) {
      return { fieldErrors: error.errors, error: "Revisa los campos marcados." };
    }
    return errorState(error);
  }
  revalidatePath("/workouts", "layout");
  redirect(`/workouts/athletes/${athleteId}?week=${weekStart}`);
}

/** From the session's screen: the editor goes back to the athlete's week once it resolves. */
export async function removeAthleteSessionFromEditorAction(
  athleteId: string,
  weekStart: string,
  sessionId: string
): Promise<SessionEditorState> {
  try {
    await workoutsService.removeAthleteSession(athleteId, weekStart, sessionId);
  } catch (error) {
    return errorState(error);
  }
  revalidatePath("/workouts", "layout");
  return {};
}
