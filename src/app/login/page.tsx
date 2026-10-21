import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignInForm } from "./SignInForm";

export const metadata: Metadata = {
  title: "Entrar · Umbral Training",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;

  return (
    <AuthShell title="Entra a tu cuenta">
      {/* An invite link that was already used, or expired (/auth/confirm). */}
      {error === "link" && (
        <div
          className="mb-5 rounded-[14px] border px-3.5 py-3 text-[13px]"
          style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--text-2)" }}
        >
          <b style={{ color: "var(--text)" }}>Ese enlace ya no sirve.</b>
        </div>
      )}
      <SignInForm />
    </AuthShell>
  );
}
