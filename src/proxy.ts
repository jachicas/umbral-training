import { NextResponse, type NextRequest } from "next/server";
import { HOME, ROLE_COOKIE, SESSION_COOKIE, roleFrom } from "@/lib/session";
import { VIEW_CLUB_COOKIE, isClubId } from "@/lib/viewing";

const SIGN_IN_PATH = "/login";
/** Open with or without a session: an invite's or a reset's link, asking for one, and clearing an expired session. */
const PUBLIC_PATHS = ["/welcome", "/forgot-password", "/reset-password", "/auth/expired"];
const PORTAL_PATH = "/portal";
const ADMIN_PATH = "/admin";

const within = (pathname: string, root: string) => pathname === root || pathname.startsWith(root + "/");

/**
 * Keeps signed-out visitors on the sign-in page, and each role on its side:
 * athletes in /portal, the super admin in /admin (and the coach's pages
 * while reading a club), the coach in neither. The session is the API's
 * token in a cookie; the role cookie only routes pages. The API still
 * authorizes every call, and a token it no longer takes ends at
 * /auth/expired.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_PATHS.some((path) => within(pathname, path))) return NextResponse.next();

  const role = request.cookies.has(SESSION_COOKIE) ? roleFrom(request.cookies.get(ROLE_COOKIE)?.value) : undefined;

  if (!role) {
    return pathname === SIGN_IN_PATH ? NextResponse.next() : NextResponse.redirect(new URL(SIGN_IN_PATH, request.url));
  }

  const viewingClub = role === "admin" && isClubId(request.cookies.get(VIEW_CLUB_COOKIE)?.value);
  const inPortal = within(pathname, PORTAL_PATH);
  const inAdmin = within(pathname, ADMIN_PATH);

  const allowed = {
    athlete: inPortal,
    admin: inAdmin || (viewingClub && !inPortal),
    coach: !inPortal && !inAdmin,
  }[role];
  const home = role === "admin" && viewingClub ? "/" : HOME[role];

  if (pathname === SIGN_IN_PATH || !allowed) {
    return NextResponse.redirect(new URL(home, request.url));
  }
  // Back in /admin, the super admin is no longer reading a club.
  if (inAdmin && viewingClub) {
    const redirect = NextResponse.redirect(request.nextUrl);
    redirect.cookies.delete(VIEW_CLUB_COOKIE);
    return redirect;
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Everything except Next internals and static files.
    "/((?!_next/static|_next/image|favicon.ico|backgrounds/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
