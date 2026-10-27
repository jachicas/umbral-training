import type { AccountRole } from "@/lib/domain/portal";

/**
 * The API sets `role` in `app_metadata` (users can't edit it): "athlete" on
 * an athlete's invite, "admin" for the super admin, "coach" on a coach's
 * invite. Any other account is the coach's panel; the API still checks
 * every request. Pure, so the proxy can use it too.
 */
export function roleFromClaims(claims: { app_metadata?: Record<string, unknown> } | undefined): AccountRole {
  const role = claims?.app_metadata?.role;
  return role === "athlete" || role === "admin" ? role : "coach";
}
