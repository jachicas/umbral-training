import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { roleFromClaims } from "@/lib/supabase/role";
import { VIEW_CLUB_COOKIE, isClubId } from "@/lib/viewing";

const SIGN_IN_PATH = "/login";
/** Where an invite (or any Supabase email link) lands; it signs the visitor in. */
const CONFIRM_PATH = "/auth/confirm";
const PORTAL_PATH = "/portal";
const ADMIN_PATH = "/admin";

const within = (pathname: string, root: string) => pathname === root || pathname.startsWith(root + "/");

/**
 * Refreshes the Supabase session on every page request (Server Components
 * can't write cookies), keeps signed-out visitors on the sign-in page, and
 * keeps each role on its side: athletes in /portal, the super admin in
 * /admin (and the coach's pages while reading a club), the coach in
 * neither. The API still authorizes every call.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet, headers) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // Verifies the JWT (and refreshes it when needed) — don't trust getSession() here.
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims.sub);
  const { pathname } = request.nextUrl;

  if (pathname === CONFIRM_PATH) return response;

  if (!signedIn) {
    return pathname === SIGN_IN_PATH ? response : redirectKeepingCookies(new URL(SIGN_IN_PATH, request.url), response);
  }

  const role = roleFromClaims(data?.claims);
  const viewingClub = role === "admin" && isClubId(request.cookies.get(VIEW_CLUB_COOKIE)?.value);
  const inPortal = within(pathname, PORTAL_PATH);
  const inAdmin = within(pathname, ADMIN_PATH);

  const allowed = {
    athlete: inPortal,
    admin: inAdmin || (viewingClub && !inPortal),
    coach: !inPortal && !inAdmin,
  }[role];
  const home = { athlete: PORTAL_PATH, admin: viewingClub ? "/" : ADMIN_PATH, coach: "/" }[role];

  if (pathname === SIGN_IN_PATH || !allowed) {
    return redirectKeepingCookies(new URL(home, request.url), response);
  }
  // Back in /admin, the super admin is no longer reading a club.
  if (inAdmin && viewingClub) {
    const redirect = redirectKeepingCookies(request.nextUrl, response);
    redirect.cookies.delete(VIEW_CLUB_COOKIE);
    return redirect;
  }
  return response;
}

/** A redirect must carry any refreshed session cookies, or the user is signed out. */
function redirectKeepingCookies(url: URL, from: NextResponse) {
  const redirect = NextResponse.redirect(url);
  from.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

export const config = {
  matcher: [
    // Everything except Next internals and static files.
    "/((?!_next/static|_next/image|favicon.ico|backgrounds/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
