import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SetPasswordForm } from "./SetPasswordForm";

export const metadata: Metadata = {
  title: "Crea tu contraseña · Umbral Training",
};

/** Where the invite link lands, already signed in: the athlete picks the password they'll sign in with. */
export default async function WelcomePage() {
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
