import { apiFetch } from "@/lib/api/client";
import type { CoachSettings, SettingsRepository } from "@/lib/domain/repositories";
import { call } from "./athletes-repo.api";

interface ApiSettings {
  paymentInstructions: string | null;
}

const toSettings = (api: ApiSettings): CoachSettings => ({ paymentInstructions: api.paymentInstructions ?? undefined });

export const apiSettingsRepository: SettingsRepository = {
  async getSettings() {
    return toSettings(await apiFetch<ApiSettings>("GET", "/v1/settings"));
  },

  async savePaymentInstructions(text) {
    return toSettings(await call(() => apiFetch<ApiSettings>("PUT", "/v1/settings", { paymentInstructions: text })));
  },
};
