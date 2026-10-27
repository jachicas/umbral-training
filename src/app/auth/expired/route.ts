import { redirect } from "next/navigation";
import { endSession } from "@/lib/auth/session";

/**
 * Where an API call that got a 401 sends the visitor: the token expired or
 * was revoked. Server Components can't clear cookies, so this does, and
 * then it's the sign-in page.
 */
export async function GET() {
  await endSession();
  redirect("/login");
}
