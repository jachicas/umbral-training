/**
 * The club the super admin is reading as its coach (/admin → "Ver club"):
 * its id, in an httpOnly cookie. While it's set, every API call carries it
 * as `X-Club-Id` and the API answers GETs only. Kept apart from
 * next/headers so the proxy can read the name too.
 */
export const VIEW_CLUB_COOKIE = "umbral_view_club";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isClubId = (value: string | undefined): value is string => value !== undefined && UUID.test(value);
