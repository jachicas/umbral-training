import type { AccountRole } from "./portal";

/* Clubs, the tenants: each with its coach (one for now) and its brand. Only the super admin manages them. */

/** A brand color and the text that reads on it; the API picks the text. */
export interface Swatch {
  color: string;
  foreground: string;
}

/** A color the club didn't set is missing: Umbral's own stays there. */
export interface ClubPalette {
  primary?: Swatch;
  accent?: Swatch;
  sidebar?: Swatch;
}

export type PaletteKey = keyof ClubPalette;

/** The coach is `invited` until they first sign in. */
export type CoachAccessStatus = "invited" | "active";

export interface ClubCoach {
  id: string;
  fullName: string;
  email: string;
  accessStatus: CoachAccessStatus;
}

export interface Club {
  id: string;
  name: string;
  logoUrl?: string;
  palette: ClubPalette;
  suspendedAt?: string;
  /** The super admin's views only. */
  coach?: ClubCoach;
  athletesCount?: number;
  createdAt?: string;
}

/** "#rrggbb", or null to keep Umbral's. */
export type PaletteInput = Record<PaletteKey, string | null>;

export interface ClubInput {
  name: string;
  palette: PaletteInput;
}

export interface NewClubInput extends ClubInput {
  coach: { fullName: string; email: string };
}

/** Who is signed in, as the API sees it: the coach's and athletes' club comes with its brand. */
export interface Me {
  id: string;
  email?: string;
  role: AccountRole | null;
  club?: Club;
}

export interface ClubRepository {
  list(): Promise<Club[]>;
  get(id: string): Promise<Club>;
  /** Creates the club and emails its coach the invite. */
  create(input: NewClubInput): Promise<Club>;
  update(id: string, input: ClubInput): Promise<Club>;
  /** `logo`: PNG or JPG, up to 2 MB. */
  uploadLogo(id: string, form: FormData): Promise<Club>;
  removeLogo(id: string): Promise<Club>;
  resendCoachInvite(id: string): Promise<Club>;
  suspend(id: string): Promise<Club>;
  reactivate(id: string): Promise<Club>;
  me(): Promise<Me>;
}
