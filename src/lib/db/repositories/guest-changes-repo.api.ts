import { apiFetch } from "@/lib/api/client";
import type { GuestChange } from "@/lib/domain/guest-changes";
import type { GuestChangeRepository } from "@/lib/domain/repositories";

interface ApiGuestChange {
  id: string;
  action: string;
  athlete: { id: string; fullName: string } | null;
  weekStart: string | null;
  createdAt: string;
}

const toGuestChange = (api: ApiGuestChange): GuestChange => ({
  id: api.id,
  action: api.action,
  athlete: api.athlete ?? undefined,
  weekStart: api.weekStart ?? undefined,
  createdAt: api.createdAt,
});

export const apiGuestChangeRepository: GuestChangeRepository = {
  async listUnseen() {
    return (await apiFetch<ApiGuestChange[]>("GET", "/v1/guest-changes")).map(toGuestChange);
  },

  async markSeen() {
    await apiFetch<void>("POST", "/v1/guest-changes/seen");
  },
};
