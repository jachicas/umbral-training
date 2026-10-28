"use server";

import { revalidatePath } from "next/cache";
import * as guestChangesService from "@/lib/services/guest-changes";

/** The coach saw what the super admin changed: the dashboard stops listing it. */
export async function markGuestChangesSeenAction(): Promise<void> {
  await guestChangesService.markGuestChangesSeen();
  revalidatePath("/");
}
