import { cookies } from "next/headers";
import { VIEW_CLUB_COOKIE, isClubId } from "@/lib/viewing";

/** The club the super admin is reading as its coach, if any (its id, from the cookie "Ver club" sets). */
export async function getViewedClubId(): Promise<string | undefined> {
  const value = (await cookies()).get(VIEW_CLUB_COOKIE)?.value;
  return isClubId(value) ? value : undefined;
}
