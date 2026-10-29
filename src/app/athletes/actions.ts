"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentCoachId } from "@/lib/auth/current-user";
import * as athletesService from "@/lib/services/athletes";
import { RACE_REFERENCES } from "@/lib/domain/time";
import type { InvitesResult } from "@/lib/domain/repositories";
import { fieldErrorState, type FormState } from "@/app/form-state";

export type { FormState } from "@/app/form-state";

/** Kept as an alias so the create dialog keeps its original, more descriptive type name. */
export type CreateAthleteState = FormState;

/** Raw strings only — the API whitelists every enum before anything is stored. */
function disciplinesFrom(formData: FormData): string[] {
  return formData.getAll("disciplines").map(String);
}

function optionalString(formData: FormData, key: string): string | undefined {
  return String(formData.get(key) ?? "") || undefined;
}

function sportProfileFrom(formData: FormData): athletesService.SportProfileFormInput {
  return {
    disciplines: disciplinesFrom(formData),
    level: optionalString(formData, "level"),
    weeklyAvailabilityDays: optionalString(formData, "weeklyAvailabilityDays"),
    weeklyAvailabilityHours: optionalString(formData, "weeklyAvailabilityHours"),
    runThresholdPace: optionalString(formData, "runThresholdPace"),
    bikeFtpWatts: optionalString(formData, "bikeFtpWatts"),
    swimThresholdPace: optionalString(formData, "swimThresholdPace"),
    maxHr: optionalString(formData, "maxHr"),
    restHr: optionalString(formData, "restHr"),
  };
}

/** The goal wizard sends its whole state as JSON in one hidden field. */
function goalFrom(formData: FormData): athletesService.SaveGoalInput {
  try {
    const goal = JSON.parse(String(formData.get("goal") ?? ""));
    if (goal && typeof goal === "object" && typeof goal.type === "string") return goal;
  } catch {
    // Falls through to maintenance, like an untouched form.
  }
  return { type: "maintenance" };
}

export async function createAthleteAction(
  _prev: CreateAthleteState,
  formData: FormData
): Promise<CreateAthleteState> {
  let athleteId: string;

  try {
    const coachId = await getCurrentCoachId();
    const athlete = await athletesService.createAthlete(coachId, {
      fullName: String(formData.get("fullName") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: optionalString(formData, "phone"),
      birthDate: optionalString(formData, "birthDate"),
      sex: optionalString(formData, "sex"),
      goal: goalFrom(formData),
      sendInviteNow: formData.get("sendInviteNow") === "on",
      ...sportProfileFrom(formData),
    });
    athleteId = athlete.id;
  } catch (error) {
    return fieldErrorState(error);
  }

  revalidatePath("/athletes");
  redirect(`/athletes/${athleteId}`);
}

export async function updateAthleteAction(
  athleteId: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const coachId = await getCurrentCoachId();
    await athletesService.updateAthlete(athleteId, coachId, {
      fullName: String(formData.get("fullName") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: optionalString(formData, "phone"),
      birthDate: optionalString(formData, "birthDate"),
      sex: optionalString(formData, "sex"),
    });
  } catch (error) {
    return fieldErrorState(error);
  }

  revalidatePath("/athletes");
  revalidatePath(`/athletes/${athleteId}`);
  return { success: true };
}

export async function saveSportProfileAction(
  athleteId: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const coachId = await getCurrentCoachId();
    await athletesService.saveSportProfile(athleteId, coachId, sportProfileFrom(formData));
  } catch (error) {
    return fieldErrorState(error);
  }

  revalidatePath("/athletes");
  revalidatePath(`/athletes/${athleteId}`);
  return { success: true };
}

/** Adds a race to the athlete's line-up, or changes one (`goalId`). */
export async function saveRaceGoalAction(
  athleteId: string,
  goalId: string | null,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const coachId = await getCurrentCoachId();
    await athletesService.saveRaceGoal(athleteId, coachId, goalId, goalFrom(formData));
  } catch (error) {
    return fieldErrorState(error);
  }

  revalidatePath("/athletes");
  revalidatePath(`/athletes/${athleteId}`);
  return { success: true };
}

export async function removeRaceGoalAction(athleteId: string, goalId: string): Promise<InviteActionResult> {
  try {
    const coachId = await getCurrentCoachId();
    await athletesService.removeRaceGoal(athleteId, coachId, goalId);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo quitar." };
  }
  revalidatePath("/athletes");
  revalidatePath(`/athletes/${athleteId}`);
  return {};
}

export async function saveMembershipAction(
  athleteId: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const coachId = await getCurrentCoachId();
    await athletesService.saveMembership(athleteId, coachId, {
      mode: String(formData.get("mode") ?? "manual"),
      amount: String(formData.get("amount") ?? ""),
      currency: String(formData.get("currency") ?? "$"),
    });
  } catch (error) {
    return fieldErrorState(error);
  }

  // What the athlete owes changes: the payments page, the dashboard and the sidebar's count too.
  revalidatePath("/", "layout");
  return { success: true };
}

export async function addRecordAction(
  athleteId: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const coachId = await getCurrentCoachId();
    await athletesService.addRaceRecords(
      athleteId,
      coachId,
      Object.fromEntries(
        RACE_REFERENCES.map((r) => [
          r,
          {
            time: String(formData.get(`time_${r}`) ?? ""),
            recordedOn: String(formData.get(`recordedOn_${r}`) ?? ""),
            note: String(formData.get(`note_${r}`) ?? ""),
          },
        ])
      )
    );
  } catch (error) {
    return fieldErrorState(error);
  }

  revalidatePath(`/athletes/${athleteId}`);
  return { success: true };
}

export interface InviteActionResult {
  error?: string;
}

export async function sendInviteAction(
  athleteId: string,
  email?: string
): Promise<InviteActionResult> {
  try {
    const coachId = await getCurrentCoachId();
    await athletesService.sendInvite(athleteId, coachId, email);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo enviar la invitación." };
  }
  revalidatePath("/athletes");
  revalidatePath(`/athletes/${athleteId}`);
  return {};
}

export interface InvitesActionResult extends InviteActionResult {
  invitedCount?: number;
  skipped?: InvitesResult["skipped"];
}

export async function sendInvitesAction(athleteIds: string[]): Promise<InvitesActionResult> {
  let result: InvitesResult;
  try {
    result = await athletesService.sendInvites(athleteIds);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudieron enviar las invitaciones." };
  }
  revalidatePath("/athletes");
  return { invitedCount: result.invited.length, skipped: result.skipped };
}

export async function cancelInviteAction(athleteId: string): Promise<InviteActionResult> {
  try {
    const coachId = await getCurrentCoachId();
    await athletesService.cancelInvite(athleteId, coachId);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo cancelar la invitación." };
  }
  revalidatePath("/athletes");
  revalidatePath(`/athletes/${athleteId}`);
  return {};
}

/**
 * Archiving changes who's listed and billed everywhere: athletes, payments,
 * workouts, the dashboard and the sidebar's count (the root layout).
 */
function revalidateRoster() {
  revalidatePath("/", "layout");
}

export async function archiveAthleteAction(athleteId: string): Promise<InviteActionResult> {
  try {
    await athletesService.archiveAthlete(athleteId);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo archivar." };
  }
  revalidateRoster();
  return {};
}

export async function restoreAthleteAction(athleteId: string): Promise<InviteActionResult> {
  try {
    await athletesService.restoreAthlete(athleteId);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo restaurar." };
  }
  revalidateRoster();
  return {};
}
