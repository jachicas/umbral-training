/*
 * What the super admin changed in the coach's club as a guest, until the
 * coach marks it seen (GET /v1/guest-changes in ../umbral-training-api).
 */

export interface GuestChange {
  id: string;
  /** The method and the API route without `v1/`: "PUT athletes/{athlete}/goal". */
  action: string;
  /** The route's athlete; missing when there's none, or they're gone. */
  athlete?: { id: string; fullName: string };
  /** The route's week (its Monday, "YYYY-MM-DD"). */
  weekStart?: string;
  /** In the coach's timezone: "2026-10-28T14:05:00-06:00". */
  createdAt: string;
}
