import type { Metadata } from "next";
import { SignInForm } from "./SignInForm";

export const metadata: Metadata = {
  title: "Entrar · Umbral Training",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4" style={{ color: "var(--text)" }}>
      <div
        className="w-full max-w-sm rounded-[22px] border p-7 shadow-[var(--shadow)]"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="mb-6">
          <div className="text-xl font-extrabold tracking-tight">Umbral Training</div>
          <div className="mt-1 text-[13px]" style={{ color: "var(--text-2)" }}>
            Entra con tu cuenta de coach.
          </div>
        </div>
        <SignInForm />
      </div>
    </main>
  );
}
