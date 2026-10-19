import { apiDashboardRepository } from "@/lib/db/repositories/dashboard-repo.api";
import type { Dashboard } from "@/lib/domain/dashboard";

/* The API computes the whole summary; this is a pass-through for the page. */
export async function getDashboard(): Promise<Dashboard> {
  return apiDashboardRepository.getDashboard();
}
