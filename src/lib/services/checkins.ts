import { apiCheckinRepository } from "@/lib/db/repositories/checkins-repo.api";
import type { WeeklyCheckin } from "@/lib/domain/checkins";

/* The API owns the check-in's rules (when it opens, who's asked, what's flagged); this reads it for the coach. */
export async function listAthleteCheckins(athleteId: string): Promise<WeeklyCheckin[]> {
  return apiCheckinRepository.listForAthlete(athleteId);
}
