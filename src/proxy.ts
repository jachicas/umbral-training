import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const SIGN_IN_PATH = "/login";

/**
 * Refreshes the Supabase session on every page request (Server Components
 * can't write cookies) and keeps signed-out visitors on the sign-in page.
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
  const onSignIn = request.nextUrl.pathname === SIGN_IN_PATH;

  if (!signedIn && !onSignIn) {
    return redirectKeepingCookies(new URL(SIGN_IN_PATH, request.url), response);
  }
  if (signedIn && onSignIn) {
    return redirectKeepingCookies(new URL("/", request.url), response);
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
