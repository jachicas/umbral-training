import type { ShellUser } from "@/components/shell/AppShell";
import { roleFromClaims } from "./role";
import { createSupabaseServerClient } from "./server";

/** Name, initials and role for the shell; null when signed out (the sign-in page). */
export async function getShellUser(): Promise<ShellUser | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;

  const fullName = typeof claims.user_metadata?.full_name === "string" ? claims.user_metadata.full_name.trim() : "";
  const name = fullName || claims.email || "Coach";
  const initials =
    name
      .split(/[\s@.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]!.toUpperCase())
      .join("") || "C";

  return { name, initials, role: roleFromClaims(claims) };
}
