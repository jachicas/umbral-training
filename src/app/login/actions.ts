"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { roleFromClaims } from "@/lib/supabase/role";
import { VIEW_CLUB_COOKIE } from "@/lib/viewing";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface SignInState {
  error?: string;
  email?: string;
}

export async function signInAction(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Escribe tu email y tu contraseña.", email };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Email o contraseña incorrectos.", email };
  }

  // Straight to each role's home: a redirect the proxy rewrites mid-action keeps the old URL.
  const { data } = await supabase.auth.getClaims();
  redirect(HOME[roleFromClaims(data?.claims)]);
}

const HOME = { coach: "/", athlete: "/portal", admin: "/admin" } as const;

export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  // The super admin may have been reading a club: that ends with the session.
  (await cookies()).delete(VIEW_CLUB_COOKIE);
  redirect("/login");
}

export interface PasswordState {
  error?: string;
}

const MIN_PASSWORD_LENGTH = 8;

/** The first password, right after the invite link signed them in: an athlete goes on to the portal, a coach to their panel. */
export async function setPasswordAction(_prev: PasswordState, formData: FormData): Promise<PasswordState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Usa al menos ${MIN_PASSWORD_LENGTH} caracteres.` };
  }
  if (password !== confirm) {
    return { error: "Las contraseñas no coinciden." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return {
      error:
        error.code === "weak_password"
          ? "Esa contraseña es muy fácil de adivinar. Prueba con otra."
          : "No se pudo guardar la contraseña. Intenta de nuevo.",
    };
  }

  const { data } = await supabase.auth.getClaims();
  redirect(HOME[roleFromClaims(data?.claims)]);
}
