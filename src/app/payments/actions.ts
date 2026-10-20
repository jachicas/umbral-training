"use server";

import { revalidatePath } from "next/cache";
import type { FormState } from "@/app/athletes/actions";
import * as paymentsService from "@/lib/services/payments";
import * as settingsService from "@/lib/services/settings";
import { ValidationErrors } from "@/lib/services/errors";

function errorState(error: unknown): FormState {
  if (error instanceof ValidationErrors) return { errors: error.errors };
  return { errors: { general: error instanceof Error ? error.message : "Algo salió mal." } };
}

/**
 * A fee shows up in the payments page, the athlete list and page, the
 * dashboard and the sidebar's count (the root layout), so everything refreshes.
 */
function revalidateFees() {
  revalidatePath("/", "layout");
}

export async function markPaidAction(athleteId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  try {
    await paymentsService.markPeriodPaid(athleteId, {
      paidOn: String(formData.get("paidOn") ?? ""),
      method: String(formData.get("method") ?? ""),
      note: String(formData.get("note") ?? ""),
    });
  } catch (error) {
    return errorState(error);
  }

  revalidateFees();
  return { success: true };
}

export async function waiveAction(athleteId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  try {
    await paymentsService.waivePeriod(athleteId, String(formData.get("note") ?? ""));
  } catch (error) {
    return errorState(error);
  }

  revalidateFees();
  return { success: true };
}

export async function sendReminderAction(athleteId: string): Promise<{ error?: string }> {
  try {
    await paymentsService.sendReminder(athleteId);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo enviar el aviso." };
  }

  revalidateFees();
  return {};
}

export async function undoPaymentAction(athleteId: string, paymentId: string): Promise<{ error?: string }> {
  try {
    await paymentsService.undoPayment(athleteId, paymentId);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo deshacer." };
  }

  revalidateFees();
  return {};
}

export async function savePaymentInstructionsAction(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    await settingsService.savePaymentInstructions(String(formData.get("paymentInstructions") ?? ""));
  } catch (error) {
    return errorState(error);
  }

  revalidatePath("/payments");
  return { success: true };
}

/** The money arrived: the months the athlete reported are settled as paid. */
export async function confirmReportAction(reportId: string): Promise<{ error?: string }> {
  try {
    await paymentsService.confirmReport(reportId);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo confirmar." };
  }

  revalidateFees();
  return {};
}

/** Sends the report back to the athlete with the reason. */
export async function rejectReportAction(reportId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  try {
    await paymentsService.rejectReport(reportId, String(formData.get("reason") ?? ""));
  } catch (error) {
    return errorState(error);
  }

  revalidateFees();
  return { success: true };
}
