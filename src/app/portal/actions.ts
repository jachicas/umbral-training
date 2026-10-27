"use server";

import { revalidatePath } from "next/cache";
import { FieldValidationError, ValidationErrors, type ValidationField } from "@/lib/services/errors";
import * as portalService from "@/lib/services/portal";

export interface ProfileState {
  errors?: Partial<Record<ValidationField, string>>;
  success?: boolean;
}

export async function updateProfileAction(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  try {
    await portalService.updatePortalProfile({
      phone: String(formData.get("phone") ?? ""),
      weeklyAvailabilityDays: String(formData.get("weeklyAvailabilityDays") ?? ""),
      weeklyAvailabilityHours: String(formData.get("weeklyAvailabilityHours") ?? ""),
    });
  } catch (error) {
    if (error instanceof ValidationErrors) return { errors: error.errors };
    if (error instanceof FieldValidationError) return { errors: { [error.field]: error.message } };
    return { errors: { general: error instanceof Error ? error.message : "Algo salió mal." } };
  }

  revalidatePath("/portal", "layout");
  return { success: true };
}

export interface CheckinState {
  errors?: Partial<Record<ValidationField, string>>;
  success?: boolean;
}

/** The week's check-in: how they felt, how hard it was, what they did, any pain. */
export async function saveCheckinAction(_prev: CheckinState, formData: FormData): Promise<CheckinState> {
  const weekStart = String(formData.get("weekStart") ?? "");
  try {
    await portalService.saveCheckin(weekStart, {
      feeling: String(formData.get("feeling") ?? ""),
      effort: String(formData.get("effort") ?? ""),
      completion: String(formData.get("completion") ?? ""),
      pain: String(formData.get("pain") ?? ""),
      painNote: String(formData.get("painNote") ?? ""),
      comment: String(formData.get("comment") ?? ""),
    });
  } catch (error) {
    if (error instanceof ValidationErrors) return { errors: error.errors };
    if (error instanceof FieldValidationError) return { errors: { [error.field]: error.message } };
    return { errors: { general: error instanceof Error ? error.message : "No se pudo guardar. Intenta de nuevo." } };
  }

  revalidatePath("/portal", "layout");
  return { success: true };
}

export interface ReportState {
  errors?: Partial<Record<ValidationField, string>>;
  success?: boolean;
}

/** A transfer with its receipt, pending until the coach confirms it. */
export async function reportPaymentAction(_prev: ReportState, formData: FormData): Promise<ReportState> {
  const receipt = formData.get("receipt");
  try {
    await portalService.reportPayment({
      months: String(formData.get("months") ?? "1"),
      paidOn: String(formData.get("paidOn") ?? ""),
      note: String(formData.get("note") ?? ""),
      receipt: receipt instanceof File ? receipt : null,
    });
  } catch (error) {
    if (error instanceof ValidationErrors) return { errors: error.errors };
    if (error instanceof FieldValidationError) return { errors: { [error.field]: error.message } };
    return { errors: { general: error instanceof Error ? error.message : "No se pudo enviar. Intenta de nuevo." } };
  }

  revalidatePath("/portal/payments");
  return { success: true };
}
