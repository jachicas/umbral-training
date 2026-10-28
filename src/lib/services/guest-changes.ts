import { apiGuestChangeRepository } from "@/lib/db/repositories/guest-changes-repo.api";
import type { GuestChange } from "@/lib/domain/guest-changes";

/* The API records what the super admin changes as a guest; this is a pass-through for the dashboard. */

export async function listUnseenGuestChanges(): Promise<GuestChange[]> {
  return apiGuestChangeRepository.listUnseen();
}

export async function markGuestChangesSeen(): Promise<void> {
  return apiGuestChangeRepository.markSeen();
}
