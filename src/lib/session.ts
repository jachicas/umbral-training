import type { AccountRole } from "@/lib/domain/portal";

/*
 * The signed-in session: the API's token and the login's role, each in an
 * httpOnly cookie. The role only routes pages (the proxy has no other way to
 * know it); the API authorizes every call by the token. Kept apart from
 * next/headers so the proxy can read the names too.
 */

export const SESSION_COOKIE = "umbral_session";
export const ROLE_COOKIE = "umbral_role";

/** As long as the API's token lasts. */
export const SESSION_DAYS = 30;

/** Where each role lands after signing in. */
export const HOME: Record<AccountRole, string> = { coach: "/", athlete: "/portal", admin: "/admin" };

export const roleFrom = (value: string | undefined): AccountRole | undefined =>
  value === "coach" || value === "athlete" || value === "admin" ? value : undefined;
