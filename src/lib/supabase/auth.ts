import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "./server";

/**
 * The signed-in coach's id (their Supabase user id). The proxy keeps
 * signed-out visitors on /login, so a missing user here means the session
 * expired mid-request: send them back to sign in.
 */
export async function getCurrentCoachId(): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims.sub) redirect("/login");
  return data.claims.sub;
}

/** The access token the API expects as `Authorization: Bearer`. The API verifies it. */
export async function getAccessToken(): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getSession();
  if (!data.session) redirect("/login");
  return data.session.access_token;
}
