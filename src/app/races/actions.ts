"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { fieldErrorState, type FormState } from "@/app/form-state";
import type { RaceFormInput } from "@/lib/services/athletes";
import * as racesService from "@/lib/services/races";

/** The race travels as JSON in one hidden `race` field, like the goal wizard's. */
export async function saveRaceAction(raceId: string | null, _prev: FormState, formData: FormData): Promise<FormState> {
  let saved;
  try {
    saved = await racesService.saveRace(raceId, JSON.parse(String(formData.get("race") ?? "{}")) as RaceFormInput);
  } catch (error) {
    return fieldErrorState(error);
  }

  // Athletes, their weeks and the dashboard show the race too.
  revalidatePath("/", "layout");
  if (raceId) return { success: true };
  redirect(`/races/${saved.id}`);
}

export async function deleteRaceAction(raceId: string): Promise<{ error?: string }> {
  try {
    await racesService.deleteRace(raceId);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo eliminar la carrera." };
  }
  revalidatePath("/", "layout");
  redirect("/races");
}
