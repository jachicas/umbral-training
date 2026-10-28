import { redirect } from "next/navigation";
import { endGuestSession, endSession } from "@/lib/auth/session";

/**
 * Where an API call that got a 401 sends the visitor: the token expired or
 * was revoked. Server Components can't clear cookies, so this does, and
 * then it's the sign-in page; or, when a guest session ended, back to the
 * super admin's own.
 */
export async function GET() {
  if (await endGuestSession()) redirect("/admin");
  await endSession();
  redirect("/login");
}
