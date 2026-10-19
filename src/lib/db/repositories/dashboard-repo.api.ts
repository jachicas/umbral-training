import { apiFetch } from "@/lib/api/client";
import type { Dashboard } from "@/lib/domain/dashboard";
import type { DashboardRepository } from "@/lib/domain/repositories";

type ApiDashboard = Omit<Dashboard, "races"> & {
  races: {
    upcomingCount: number;
    next: (Omit<Dashboard["races"]["next"][number], "sportLabel" | "format" | "distances"> & {
      sportLabel: string | null;
      format: string | null;
      distances: Dashboard["races"]["next"][number]["distances"] | null;
    })[];
  };
};

/* The API's shape (docs/api.md in ../umbral-training-api) matches the domain's, but for nulls in races. */
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
    };
  },
};
