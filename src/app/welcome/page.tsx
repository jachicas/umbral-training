import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { SetPasswordForm } from "@/components/auth/SetPasswordForm";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Crea tu contraseña · Umbral Training",
};

/** Where a club's coach lands from the super admin's invite, already signed in: they pick the password they'll sign in with. */
export default async function CoachWelcomePage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const fullName = typeof claims?.user_metadata?.full_name === "string" ? claims.user_metadata.full_name.trim() : "";
  const firstName = fullName.split(/\s+/)[0];

  return (
    <AuthShell title={firstName ? `Hola, ${firstName}` : "Bienvenido"} subtitle="Crea tu contraseña">
      <SetPasswordForm email={claims?.email} />
    </AuthShell>
  );
}
