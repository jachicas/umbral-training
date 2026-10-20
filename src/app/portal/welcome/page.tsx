import type { Metadata } from "next";
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
    <main className="flex min-h-dvh items-center justify-center px-4" style={{ color: "var(--text)" }}>
      <div
        className="w-full max-w-sm rounded-[22px] border p-7 shadow-[var(--shadow)]"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="mb-6">
          <div className="text-xl font-extrabold tracking-tight">
            {firstName ? `Hola, ${firstName}` : "Bienvenido"}
          </div>
          <div className="mt-1 text-[13px]" style={{ color: "var(--text-2)" }}>
            Crea tu contraseña
          </div>
        </div>
        <SetPasswordForm email={claims?.email} />
      </div>
    </main>
  );
}
