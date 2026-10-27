import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { roleFromClaims } from "@/lib/supabase/role";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Where the link in an invite email lands (`?token_hash=…&type=invite`): it
 * signs the athlete (or a club's coach) in, then they create their password.
 * A used or expired link goes back to sign-in with a note.
 */
export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null;

  if (tokenHash && type) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      if (type !== "invite") redirect("/");
      const { data } = await supabase.auth.getClaims();
      redirect(roleFromClaims(data?.claims) === "athlete" ? "/portal/welcome" : "/welcome");
    }
  }

  redirect("/login?error=link");
}
