"use server";

import { redirect } from "next/navigation";
import { ApiValidationError, apiFetch, apiPublic } from "@/lib/api/client";
import { endSession, hasSession, startSession } from "@/lib/auth/session";
import type { AccountRole } from "@/lib/domain/portal";
import { HOME } from "@/lib/session";

/** What signing in, an invite's first password and a reset answer with. */
interface ApiSession {
  token: string;
  user: { id: string; email: string; fullName: string; role: AccountRole };
}

export interface SignInState {
  error?: string;
  email?: string;
}

export interface PasswordState {
  error?: string;
}

export interface ForgotState {
  error?: string;
  sent?: boolean;
}

const MIN_PASSWORD_LENGTH = 8;

/** The API's first message (a 422's, or a 429's), for a form's error line. */
function messageOf(error: unknown): string {
  if (error instanceof ApiValidationError) return error.message;
  return error instanceof Error ? error.message : "Algo salió mal. Intenta de nuevo.";
}

/** Keeps the session in cookies, then goes to the role's home. */
async function enter(session: ApiSession): Promise<never> {
  await startSession(session.token, session.user.role);
  redirect(HOME[session.user.role]);
}

export async function signInAction(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Escribe tu email y tu contraseña.", email };
  }

  let session: ApiSession;
  try {
    session = await apiPublic<ApiSession>("POST", "/v1/auth/login", { email, password });
  } catch (error) {
    return { error: messageOf(error), email };
  }

  return enter(session);
}

/** Ends this session at the API too, so the token stops working there. A club the super admin was reading ends with it. */
export async function signOutAction(): Promise<void> {
  if (await hasSession()) {
    await apiFetch("POST", "/v1/auth/logout").catch(() => undefined);
  }
  await endSession();
  redirect("/login");
}

/** Checked here first, so a typo doesn't use up a try at the API. */
function passwordError(formData: FormData): string | undefined {
  const password = String(formData.get("password") ?? "");
  if (password.length < MIN_PASSWORD_LENGTH) return `Usa al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  if (password !== String(formData.get("confirm") ?? "")) return "Las contraseñas no coinciden.";
  return undefined;
}

async function setPassword(path: string, formData: FormData): Promise<PasswordState> {
  const error = passwordError(formData);
  if (error) return { error };

  let session: ApiSession;
  try {
    session = await apiPublic<ApiSession>("POST", path, {
      token: String(formData.get("token") ?? ""),
      password: String(formData.get("password") ?? ""),
    });
  } catch (apiError) {
    return { error: messageOf(apiError) };
  }

  return enter(session);
}

/** An invite's first password: the athlete goes on to the portal, a coach or the super admin to their panel. */
export async function acceptInviteAction(_prev: PasswordState, formData: FormData): Promise<PasswordState> {
  return setPassword("/v1/auth/invites/accept", formData);
}

export async function resetPasswordAction(_prev: PasswordState, formData: FormData): Promise<PasswordState> {
  return setPassword("/v1/auth/password/reset", formData);
}

/** The API answers the same whether or not the email has an account. */
export async function forgotPasswordAction(_prev: ForgotState, formData: FormData): Promise<ForgotState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Escribe tu email." };

  try {
    await apiPublic("POST", "/v1/auth/password/forgot", { email });
  } catch (error) {
    return { error: messageOf(error) };
  }

  return { sent: true };
}
