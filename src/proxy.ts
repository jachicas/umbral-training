import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { roleFromClaims } from "@/lib/supabase/role";

const SIGN_IN_PATH = "/login";
/** Where an invite (or any Supabase email link) lands; it signs the visitor in. */
const CONFIRM_PATH = "/auth/confirm";
const PORTAL_PATH = "/portal";

const inPortal = (pathname: string) => pathname === PORTAL_PATH || pathname.startsWith(PORTAL_PATH + "/");

/**
 * Refreshes the Supabase session on every page request (Server Components
 * can't write cookies), keeps signed-out visitors on the sign-in page, and
 * keeps each role on its side: athletes in /portal, the coach out of it.
 * The API still authorizes every call.
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

  const home = roleFromClaims(data?.claims) === "athlete" ? PORTAL_PATH : "/";
  if (pathname === SIGN_IN_PATH || inPortal(pathname) !== (home === PORTAL_PATH)) {
    return redirectKeepingCookies(new URL(home, request.url), response);
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
