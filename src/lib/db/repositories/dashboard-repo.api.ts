import { apiFetch } from "@/lib/api/client";
import type { Dashboard } from "@/lib/domain/dashboard";
import type { DashboardRepository } from "@/lib/domain/repositories";
import type { CheckinOverview } from "@/lib/domain/checkins";
import { toCheckin, type ApiCheckin } from "./checkins-repo.api";

type ApiDashboard = Omit<Dashboard, "races" | "checkins"> & {
  checkins: (Omit<CheckinOverview, "rows"> & { rows: { athleteId: string; fullName: string; checkin: ApiCheckin | null }[] }) | null;
  races: {
    upcomingCount: number;
    next: (Omit<Dashboard["races"]["next"][number], "sportLabel" | "format" | "distances"> & {
      sportLabel: string | null;
      format: string | null;
      distances: Dashboard["races"]["next"][number]["distances"] | null;
    })[];
  };
};

/* The API's shape (docs/api.md in ../umbral-training-api) matches the domain's, but for nulls in races and check-ins. */
export const apiDashboardRepository: DashboardRepository = {
  async getDashboard() {
    const api = await apiFetch<ApiDashboard>("GET", "/v1/dashboard");
    return {
      ...api,
      races: {
        upcomingCount: api.races.upcomingCount,
        next: api.races.next.map((race) => ({
          ...race,
          sportLabel: race.sportLabel ?? undefined,
          format: race.format ?? undefined,
          distances: race.distances ?? undefined,
        })),
      },
      checkins: api.checkins && {
        ...api.checkins,
        rows: api.checkins.rows.map((row) => ({ ...row, checkin: row.checkin ? toCheckin(row.checkin) : null })),
      },
    };
  },
};
