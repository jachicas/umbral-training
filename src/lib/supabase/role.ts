import type { AccountRole } from "@/lib/domain/portal";

/**
 * Athletes' logins carry `role: "athlete"` in `app_metadata`, set by the API
 * when the coach invites them (users can't edit it). Any other account is
 * the coach's panel; the API still checks every request. Pure, so the proxy
 * can use it too.
 */
export function roleFromClaims(claims: { app_metadata?: Record<string, unknown> } | undefined): AccountRole {
  return claims?.app_metadata?.role === "athlete" ? "athlete" : "coach";
}
