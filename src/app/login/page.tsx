import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignInForm } from "./SignInForm";

export const metadata: Metadata = {
  title: "Entrar · Umbral Training",
};

export default function LoginPage() {
  return (
    <AuthShell title="Entra a tu cuenta">
      <SignInForm />
    </AuthShell>
  );
}
