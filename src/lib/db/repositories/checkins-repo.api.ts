import { apiFetch } from "@/lib/api/client";
import type { CheckinFlag, WeeklyCheckin } from "@/lib/domain/checkins";
import type { CheckinRepository } from "@/lib/domain/repositories";
import { athletePath, orUndefined } from "./athletes-repo.api";

/* The API's check-in shape (docs/api.md in ../umbral-training-api): null where the domain uses undefined. */

export interface ApiCheckin {
  weekStart: string;
  feeling: number;
  effort: number;
  completion: WeeklyCheckin["completion"];
  pain: boolean;
  painNote: string | null;
  comment: string | null;
  flags: CheckinFlag[];
  submittedAt: string | null;
}

export const toCheckin = (api: ApiCheckin): WeeklyCheckin => ({
  ...api,
  painNote: orUndefined(api.painNote),
  comment: orUndefined(api.comment),
  submittedAt: orUndefined(api.submittedAt),
});

export const apiCheckinRepository: CheckinRepository = {
  async listForAthlete(athleteId) {
    const checkins = await apiFetch<ApiCheckin[]>("GET", `${athletePath(athleteId)}/checkins`);
    return checkins.map(toCheckin);
  },
};
