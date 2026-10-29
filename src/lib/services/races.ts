import { apiRaceRepository } from "@/lib/db/repositories/races-repo.api";
import type { Race } from "@/lib/domain/types";
import { buildRaceInput, type RaceFormInput } from "./athletes";

/* The API keeps the coach's race catalog and its rules; this only parses what the form typed. */

export async function listUpcomingRaces(): Promise<Race[]> {
  return apiRaceRepository.listUpcoming();
}

export async function getRace(raceId: string): Promise<Race | null> {
  return apiRaceRepository.get(raceId);
}

/** Registers a race (`raceId` null) or changes one. */
export async function saveRace(raceId: string | null, input: RaceFormInput): Promise<Race> {
  const race = buildRaceInput(input);
  return raceId ? apiRaceRepository.update(raceId, race) : apiRaceRepository.create(race);
}

export async function deleteRace(raceId: string): Promise<void> {
  return apiRaceRepository.remove(raceId);
}
