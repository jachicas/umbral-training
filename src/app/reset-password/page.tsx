import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { ExpiredLinkNotice } from "@/components/auth/LinkNotice";
import { SetPasswordForm } from "@/components/auth/SetPasswordForm";
import { resetPasswordAction } from "@/app/login/actions";

export const metadata: Metadata = {
  title: "Contraseña nueva · Umbral Training",
};

/** Where a reset's link lands (`?token=…`). The API checks the link when the form is sent. */
export default async function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  const { token } = await searchParams;
  if (typeof token !== "string" || !token) return <ExpiredLinkNotice />;

  return (
    <AuthShell title="Contraseña nueva">
      <SetPasswordForm action={resetPasswordAction} token={token} />
    </AuthShell>
  );
}
