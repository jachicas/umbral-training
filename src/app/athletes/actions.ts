"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentCoachId } from "@/lib/supabase/auth";
import * as athletesService from "@/lib/services/athletes";
import { RACE_REFERENCES } from "@/lib/domain/time";

/** Errors keyed by field name so each input can render its own message. */
export interface FormState {
  errors?: Partial<Record<athletesService.ValidationField, string>>;
  success?: boolean;
}

/** Kept as an alias so the create dialog keeps its original, more descriptive type name. */
export type CreateAthleteState = FormState;

function fieldErrorState(error: unknown): FormState {
  if (error instanceof athletesService.ValidationErrors) {
    return { errors: error.errors };
  }
  if (error instanceof athletesService.FieldValidationError) {
    return { errors: { [error.field]: error.message } };
  }
  return { errors: { general: error instanceof Error ? error.message : "Algo salió mal." } };
}

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

export async function saveGoalAction(
  athleteId: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const coachId = await getCurrentCoachId();
    await athletesService.saveGoal(athleteId, coachId, goalFrom(formData));
  } catch (error) {
    return fieldErrorState(error);
  }

  revalidatePath("/athletes");
  revalidatePath(`/athletes/${athleteId}`);
  return { success: true };
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

  revalidatePath("/athletes");
  revalidatePath(`/athletes/${athleteId}`);
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

export async function markPeriodPaidAction(athleteId: string): Promise<void> {
  const coachId = await getCurrentCoachId();
  await athletesService.markPeriodPaid(athleteId, coachId);
  // The list shows payment status too, so refresh it along with the detail.
  revalidatePath("/athletes");
  revalidatePath(`/athletes/${athleteId}`);
}
