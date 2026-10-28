/**
 * The club the super admin entered as a guest (/admin → "Entrar como
 * invitado"): its id, in an httpOnly cookie. While it's set, every API call
 * carries it as `X-Club-Id`, and the API acts as that club's coach and
 * records each change for them. Kept apart from next/headers so the proxy
 * can read the name too.
 */
export const VIEW_CLUB_COOKIE = "umbral_view_club";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isClubId = (value: string | undefined): value is string => value !== undefined && UUID.test(value);
