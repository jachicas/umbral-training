import { MOCK_COACH_ID } from "@/lib/db/repositories/athletes-repo.mock";

/**
 * Stand-in for reading the signed-in coach from the Supabase session.
 * Swap for a real `auth.uid()` lookup once Supabase Auth is wired up —
 * every caller already threads `coachId` through services/repositories,
 * so this is the only place that changes.
 */
export async function getCurrentCoachId(): Promise<string> {
  return MOCK_COACH_ID;
}
