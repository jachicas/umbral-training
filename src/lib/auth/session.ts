import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { AccountRole } from "@/lib/domain/portal";
import { ADMIN_SESSION_COOKIE, ROLE_COOKIE, SESSION_COOKIE, SESSION_DAYS } from "@/lib/session";

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

const cookieOptions = (maxAge: number) => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge,
});

/** After signing in, accepting an invite or resetting a password. Server Actions and Route Handlers only. */
export async function startSession(token: string, role: AccountRole): Promise<void> {
  const store = await cookies();
  const options = cookieOptions(SESSION_DAYS * 24 * 60 * 60);
  store.set(SESSION_COOKIE, token, options);
  store.set(ROLE_COOKIE, role, options);
}

/**
 * The super admin enters a club as a guest: the coach's guest token becomes
 * the session, and theirs waits aside until they leave.
 */
export async function startGuestSession(guestToken: string, expiresAt: string): Promise<void> {
  const store = await cookies();
  const adminToken = store.get(SESSION_COOKIE)?.value;
  if (!adminToken) redirect("/login");

  const options = cookieOptions(Math.max(0, Math.floor((Date.parse(expiresAt) - Date.now()) / 1000)));
  store.set(ADMIN_SESSION_COOKIE, adminToken, cookieOptions(SESSION_DAYS * 24 * 60 * 60));
  store.set(SESSION_COOKIE, guestToken, options);
  store.set(ROLE_COOKIE, "coach", options);
}

/** Back to the super admin's own session; false when there was no guest session. */
export async function endGuestSession(): Promise<boolean> {
  const store = await cookies();
  const adminToken = store.get(ADMIN_SESSION_COOKIE)?.value;
  if (!adminToken) return false;

  await startSession(adminToken, "admin");
  store.delete(ADMIN_SESSION_COOKIE);
  return true;
}

/** Signing out, or a token the API no longer takes. A guest session's super admin token goes with it. */
export async function endSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  store.delete(ROLE_COOKIE);
  store.delete(ADMIN_SESSION_COOKIE);
}
