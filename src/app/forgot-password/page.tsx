import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Recuperar contraseña · Umbral Training",
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell title="Recupera tu contraseña">
      <ForgotPasswordForm />
    </AuthShell>
  );
}
