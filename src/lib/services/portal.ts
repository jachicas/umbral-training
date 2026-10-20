import { apiPortalRepository } from "@/lib/db/repositories/portal-repo.api";
import type { PortalHome, PortalPayments, PortalWeek } from "@/lib/domain/portal";
import type { CheckinCompletion, PortalCheckin } from "@/lib/domain/checkins";
import type { DownloadFile, PortalRepository } from "@/lib/domain/repositories";
import { FieldValidationError } from "./errors";

/*
 * The athlete's portal. The API decides what they may see (a week only once
 * it's sent) and validates their edits; this layer only turns form strings
 * into what the API expects.
 */

function getRepo(): PortalRepository {
  return apiPortalRepository;
}

export async function getPortalHome(): Promise<PortalHome> {
  return getRepo().getHome();
}

export async function getPortalWeek(weekStart: string): Promise<PortalWeek> {
  return getRepo().getWeek(weekStart);
}

export async function getPortalWeekPdf(weekStart: string): Promise<DownloadFile> {
  return getRepo().getWeekPdf(weekStart);
}

/** The check-in as it arrives from its <form>: every answer a string, `pain` "yes"/"no". */
export interface CheckinFormInput {
  feeling: string;
  effort: string;
  completion: string;
  pain: string;
  painNote?: string;
  comment?: string;
}

/** Saves the week's check-in. The API checks the answers and whether it's open. */
export async function saveCheckin(weekStart: string, input: CheckinFormInput): Promise<PortalCheckin> {
  if (!input.feeling) throw new FieldValidationError("feeling", "Elige cómo te sentiste.");
  if (!input.effort) throw new FieldValidationError("effort", "Elige qué tan dura fue la semana.");
  if (!input.completion) throw new FieldValidationError("completion", "Dinos cuántos entrenos hiciste.");
  if (!input.pain) throw new FieldValidationError("pain", "Dinos si tienes alguna molestia.");
  const pain = input.pain === "yes";
  return getRepo().saveCheckin(weekStart, {
    feeling: Number(input.feeling),
    effort: Number(input.effort),
    completion: input.completion as CheckinCompletion,
    pain,
    painNote: pain ? input.painNote?.trim() || undefined : undefined,
    comment: input.comment?.trim() || undefined,
  });
}

export async function getPortalPayments(): Promise<PortalPayments> {
  return getRepo().getPayments();
}

/** Profile fields as they arrive from a <form>. */
export interface PortalProfileFormInput {
  phone?: string;
  weeklyAvailabilityDays?: string;
  weeklyAvailabilityHours?: string;
}

/** "6,5" or "6.5" → 6.5; blank → undefined (clears it). */
function parseNumber(raw: string | undefined, field: "weeklyDays" | "weeklyHours"): number | undefined {
  const text = raw?.trim().replace(",", ".");
  if (!text) return undefined;
  const value = Number(text);
  if (!Number.isFinite(value)) throw new FieldValidationError(field, "Escribe un número.");
  return value;
}

/** A transfer as it arrives from the report form. */
export interface ReportPaymentFormInput {
  months: string;
  paidOn: string;
  note?: string;
  receipt: File | null;
}

/** Reports a transfer with its receipt; the coach confirms it. The API checks the months and the file. */
export async function reportPayment(input: ReportPaymentFormInput): Promise<PortalPayments> {
  if (!input.receipt || input.receipt.size === 0) {
    throw new FieldValidationError("receipt", "Sube la foto del comprobante.");
  }
  const form = new FormData();
  form.set("months", input.months);
  form.set("paidOn", input.paidOn);
  if (input.note?.trim()) form.set("note", input.note.trim());
  form.set("receipt", input.receipt, input.receipt.name || "comprobante.jpg");
  return getRepo().reportPayment(form);
}

export async function updatePortalProfile(input: PortalProfileFormInput): Promise<PortalHome> {
  return getRepo().updateProfile({
    phone: input.phone?.trim() || undefined,
    weeklyAvailabilityDays: parseNumber(input.weeklyAvailabilityDays, "weeklyDays"),
    weeklyAvailabilityHours: parseNumber(input.weeklyAvailabilityHours, "weeklyHours"),
  });
}
