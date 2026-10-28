import { ApiValidationError, apiFetch, apiUpload } from "@/lib/api/client";
import type { AccountRole } from "@/lib/domain/portal";
import type { Club, ClubPalette, ClubRepository, CoachAccessStatus, GuestSession, Swatch } from "@/lib/domain/clubs";
import { ValidationErrors, type ValidationField } from "@/lib/services/errors";

/* The API's /v1/admin/clubs and /v1/me shapes (docs/api.md in ../umbral-training-api): null where the domain uses undefined. */

interface ApiClub {
  id: string;
  name: string;
  logoUrl: string | null;
  palette: Record<keyof ClubPalette, Swatch | null>;
  suspendedAt: string | null;
  coach?: { id: string; fullName: string; email: string; accessStatus: CoachAccessStatus };
  athletesCount?: number;
  createdAt: string | null;
}

interface ApiMe {
  id: string;
  email: string;
  fullName: string;
  role: AccountRole;
  club: ApiClub | null;
  guest: { id: string; fullName: string } | null;
}

const toClub = (api: ApiClub): Club => ({
  id: api.id,
  name: api.name,
  logoUrl: api.logoUrl ?? undefined,
  palette: {
    primary: api.palette.primary ?? undefined,
    accent: api.palette.accent ?? undefined,
    sidebar: api.palette.sidebar ?? undefined,
  },
  suspendedAt: api.suspendedAt ?? undefined,
  coach: api.coach,
  athletesCount: api.athletesCount,
  createdAt: api.createdAt ?? undefined,
});

/** "email" is the coach's here: another login already has it. */
const FIELD_FOR_API_KEY: Record<string, ValidationField> = {
  name: "name",
  "coach.fullName": "coachName",
  "coach.email": "coachEmail",
  email: "coachEmail",
  "palette.primary": "primaryColor",
  "palette.accent": "accentColor",
  "palette.sidebar": "sidebarColor",
  logo: "logo",
};

/** Runs an API call, turning a 422 into the club forms' field errors. */
async function call<T>(request: () => Promise<T>): Promise<T> {
  try {
    return await request();
  } catch (error) {
    if (error instanceof ApiValidationError) {
      const errors: Partial<Record<ValidationField, string>> = {};
      for (const [key, messages] of Object.entries(error.errors)) {
        errors[FIELD_FOR_API_KEY[key] ?? "general"] ??= messages[0];
      }
      throw new ValidationErrors(errors);
    }
    throw error;
  }
}

const clubPath = (id: string) => `/v1/admin/clubs/${encodeURIComponent(id)}`;

const send = async (method: "POST" | "PUT" | "DELETE", path: string, body?: unknown) =>
  toClub(await call(() => apiFetch<ApiClub>(method, path, body)));

export const apiClubRepository: ClubRepository = {
  async list() {
    return (await apiFetch<ApiClub[]>("GET", "/v1/admin/clubs")).map(toClub);
  },

  async get(id) {
    return toClub(await apiFetch<ApiClub>("GET", clubPath(id)));
  },

  create: (input) => send("POST", "/v1/admin/clubs", input),
  update: (id, input) => send("PUT", clubPath(id), input),

  async uploadLogo(id, form) {
    return toClub(await call(() => apiUpload<ApiClub>(`${clubPath(id)}/logo`, form)));
  },

  removeLogo: (id) => send("DELETE", `${clubPath(id)}/logo`),
  resendCoachInvite: (id) => send("POST", `${clubPath(id)}/coach/invite`),
  suspend: (id) => send("POST", `${clubPath(id)}/suspension`),
  reactivate: (id) => send("DELETE", `${clubPath(id)}/suspension`),

  async startGuestSession(id) {
    return apiFetch<GuestSession>("POST", `${clubPath(id)}/guest-session`);
  },

  async me() {
    const api = await apiFetch<ApiMe>("GET", "/v1/me");
    return {
      id: api.id,
      email: api.email,
      fullName: api.fullName,
      role: api.role,
      club: api.club ? toClub(api.club) : undefined,
      guest: api.guest ?? undefined,
    };
  },
};
