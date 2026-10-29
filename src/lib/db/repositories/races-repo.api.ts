import { ApiNotFoundError, apiFetch } from "@/lib/api/client";
import type { RaceRepository } from "@/lib/domain/repositories";
import { call, raceBody, toRace, type ApiRace } from "./athletes-repo.api";

const racePath = (raceId: string) => `/v1/races/${encodeURIComponent(raceId)}`;

export const apiRaceRepository: RaceRepository = {
  async listUpcoming() {
    return (await apiFetch<ApiRace[]>("GET", "/v1/races?upcoming=1")).map(toRace);
  },

  async get(raceId) {
    try {
      return toRace(await apiFetch<ApiRace>("GET", racePath(raceId)));
    } catch (error) {
      if (error instanceof ApiNotFoundError) return null;
      throw error;
    }
  },

  // The race's own keys ("name", "date") read as the goal wizard's ("race.name").
  async create(input) {
    return toRace(await call(() => apiFetch<ApiRace>("POST", "/v1/races", raceBody(input)), "race."));
  },

  async update(raceId, input) {
    return toRace(await call(() => apiFetch<ApiRace>("PUT", racePath(raceId), raceBody(input)), "race."));
  },

  async remove(raceId) {
    await call(() => apiFetch<void>("DELETE", racePath(raceId)));
  },
};
