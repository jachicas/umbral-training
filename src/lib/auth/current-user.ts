import { cache } from "react";
import { redirect, unstable_rethrow } from "next/navigation";
import type { ShellUser } from "@/components/shell/AppShell";
import type { Me } from "@/lib/domain/clubs";
import { getMe } from "@/lib/services/clubs";
import { hasSession } from "./session";

/**
 * Who is signed in, with their club and its brand, as the API says (/v1/me):
 * once per request, for the layouts and the pages alike. Undefined when
 * signed out or when the API can't say; an expired token still goes to
 * /auth/expired.
 */
export const getCurrentUser = cache(async (): Promise<Me | undefined> => {
  if (!(await hasSession())) return undefined;
  try {
    return await getMe();
  } catch (error) {
    unstable_rethrow(error);
    return undefined;
  }
});

/** Name, initials and role for the shells; null when signed out (the sign-in page). */
export async function getShellUser(): Promise<ShellUser | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const name = user.fullName.trim() || user.email;
  const initials =
    name
      .split(/[\s@.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]!.toUpperCase())
      .join("") || "U";

  return { name, initials, role: user.role };
}

/** The signed-in coach's id (their login's). */
export async function getCurrentCoachId(): Promise<string> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user.id;
}
