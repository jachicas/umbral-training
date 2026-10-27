import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { AccountRole } from "@/lib/domain/portal";
import { ROLE_COOKIE, SESSION_COOKIE, SESSION_DAYS } from "@/lib/session";
import { VIEW_CLUB_COOKIE } from "@/lib/viewing";

/**
 * The API's token for this request. The proxy keeps signed-out visitors on
 * /login, so a missing one means the session ended mid-request.
 */
export async function getAccessToken(): Promise<string> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) redirect("/login");
  return token;
}

export async function hasSession(): Promise<boolean> {
  return (await cookies()).has(SESSION_COOKIE);
}

/** After signing in, accepting an invite or resetting a password. Server Actions and Route Handlers only. */
export async function startSession(token: string, role: AccountRole): Promise<void> {
  const store = await cookies();
  const options = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  };
  store.set(SESSION_COOKIE, token, options);
  store.set(ROLE_COOKIE, role, options);
}

/** Signing out, or a token the API no longer takes. A club the super admin was reading ends with it. */
export async function endSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  store.delete(ROLE_COOKIE);
  store.delete(VIEW_CLUB_COOKIE);
}
