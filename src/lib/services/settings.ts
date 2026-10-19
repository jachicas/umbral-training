import { apiSettingsRepository } from "@/lib/db/repositories/settings-repo.api";
import type { CoachSettings } from "@/lib/domain/repositories";

/* The API keeps and validates the coach's settings; this is a pass-through for the pages. */

export async function getSettings(): Promise<CoachSettings> {
  return apiSettingsRepository.getSettings();
}

export async function savePaymentInstructions(text: string): Promise<CoachSettings> {
  return apiSettingsRepository.savePaymentInstructions(text);
}
