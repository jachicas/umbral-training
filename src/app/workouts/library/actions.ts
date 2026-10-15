"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as workoutsService from "@/lib/services/workouts";
import type { LibrarySessionInput } from "@/lib/domain/workouts";

export interface SessionEditorState {
  /** Form-level message. */
  error?: string;
  /** The API's messages keyed by path ("name", "nodes.1.steps.0.duration.meters"). */
  fieldErrors?: Record<string, string>;
}

/** When the session is created from a day of a group's week, it's added to that day too. */
export interface AddToWeek {
  planId: string;
  dayIndex: number;
}

/** Bound by the page (`sessionId`, `addTo`); the editor passes the input. */
export async function saveLibrarySessionAction(
  sessionId: string | null,
  addTo: AddToWeek | null,
  input: LibrarySessionInput
): Promise<SessionEditorState> {
  let destination: string;

  try {
    const session = sessionId
      ? await workoutsService.updateLibrarySession(sessionId, input)
      : await workoutsService.createLibrarySession(input);

    if (addTo) {
      await workoutsService.addSession(addTo.planId, addTo.dayIndex, session.id);
      destination = `/workouts/plans/${addTo.planId}`;
    } else {
      destination = "/workouts/library";
    }
  } catch (error) {
    if (error instanceof workoutsService.LibrarySessionErrors) {
      return { fieldErrors: error.errors, error: "Revisa los campos marcados." };
    }
    return { error: error instanceof Error ? error.message : "No se pudo guardar la sesión." };
  }

  revalidatePath("/workouts", "layout");
  redirect(destination);
}

export async function deleteLibrarySessionAction(sessionId: string): Promise<SessionEditorState> {
  try {
    await workoutsService.deleteLibrarySession(sessionId);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo borrar la sesión." };
  }

  revalidatePath("/workouts", "layout");
  redirect("/workouts/library");
}
