"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { PaletteInput, PaletteKey } from "@/lib/domain/clubs";
import * as clubsService from "@/lib/services/clubs";
import { ValidationErrors, type ValidationField } from "@/lib/services/errors";
import { VIEW_CLUB_COOKIE, isClubId } from "@/lib/viewing";

export interface ClubFormState {
  errors?: Partial<Record<ValidationField, string>>;
  success?: boolean;
}

export interface ClubActionState {
  error?: string;
}

const PALETTE_KEYS: PaletteKey[] = ["primary", "accent", "sidebar"];

/** Each color comes as `<key>` ("#rrggbb") and `<key>Set`; unchecked keeps Umbral's (null). */
function paletteFrom(formData: FormData): PaletteInput {
  return Object.fromEntries(
    PALETTE_KEYS.map((key) => [key, formData.get(`${key}Set`) ? String(formData.get(key) ?? "") : null])
  ) as PaletteInput;
}

function formErrors(error: unknown): ClubFormState {
  if (error instanceof ValidationErrors) return { errors: error.errors };
  return { errors: { general: error instanceof Error ? error.message : "Algo salió mal." } };
}

/** Creates the club and invites its coach, then opens it. */
export async function createClubAction(_prev: ClubFormState, formData: FormData): Promise<ClubFormState> {
  let clubId: string;
  try {
    const club = await clubsService.createClub({
      name: String(formData.get("name") ?? ""),
      palette: paletteFrom(formData),
      coach: {
        fullName: String(formData.get("coachName") ?? ""),
        email: String(formData.get("coachEmail") ?? ""),
      },
    });
    clubId = club.id;
  } catch (error) {
    return formErrors(error);
  }

  revalidatePath("/admin");
  redirect(`/admin/clubs/${clubId}`);
}

export async function updateClubAction(clubId: string, _prev: ClubFormState, formData: FormData): Promise<ClubFormState> {
  try {
    await clubsService.updateClub(clubId, { name: String(formData.get("name") ?? ""), palette: paletteFrom(formData) });
  } catch (error) {
    return formErrors(error);
  }

  revalidatePath("/admin", "layout");
  return { success: true };
}

export async function uploadLogoAction(clubId: string, _prev: ClubFormState, formData: FormData): Promise<ClubFormState> {
  const logo = formData.get("logo");
  if (!(logo instanceof File) || logo.size === 0) return { errors: { logo: "Sube el logo." } };

  const form = new FormData();
  form.set("logo", logo);
  try {
    await clubsService.uploadClubLogo(clubId, form);
  } catch (error) {
    return formErrors(error);
  }

  revalidatePath("/admin", "layout");
  return { success: true };
}

/** The logo, the coach's invite and suspension: a button each, the error (if any) shown beside it. */
async function clubAction(run: () => Promise<unknown>): Promise<ClubActionState> {
  try {
    await run();
  } catch (error) {
    if (error instanceof ValidationErrors) return { error: Object.values(error.errors)[0] };
    return { error: error instanceof Error ? error.message : "Algo salió mal." };
  }

  revalidatePath("/admin", "layout");
  return {};
}

export async function removeLogoAction(clubId: string): Promise<ClubActionState> {
  return clubAction(() => clubsService.removeClubLogo(clubId));
}

export async function resendCoachInviteAction(clubId: string): Promise<ClubActionState> {
  return clubAction(() => clubsService.resendCoachInvite(clubId));
}

export async function suspendClubAction(clubId: string): Promise<ClubActionState> {
  return clubAction(() => clubsService.suspendClub(clubId));
}

export async function reactivateClubAction(clubId: string): Promise<ClubActionState> {
  return clubAction(() => clubsService.reactivateClub(clubId));
}

/** Enters the coach's panel as that club's guest: the API acts as its coach and records each change for them. */
export async function viewClubAction(clubId: string): Promise<void> {
  if (!isClubId(clubId)) return;
  (await cookies()).set(VIEW_CLUB_COOKIE, clubId, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" });
  redirect("/");
}

export async function stopViewingClubAction(): Promise<void> {
  (await cookies()).delete(VIEW_CLUB_COOKIE);
  redirect("/admin");
}
