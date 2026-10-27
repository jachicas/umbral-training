import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { ExpiredLinkNotice } from "@/components/auth/LinkNotice";
import { SetPasswordForm } from "@/components/auth/SetPasswordForm";
import { ApiNotFoundError, apiPublic } from "@/lib/api/client";
import { acceptInviteAction } from "@/app/login/actions";

export const metadata: Metadata = {
  title: "Crea tu contraseña · Umbral Training",
};

interface Invite {
  email: string;
  fullName: string;
}

/** Where an invite's link lands (`?token=…`), for an athlete, a club's coach or the super admin: they pick the password they'll sign in with. */
export default async function WelcomePage({ searchParams }: PageProps<"/welcome">) {
  const { token } = await searchParams;
  if (typeof token !== "string" || !token) return <ExpiredLinkNotice />;

  let invite: Invite;
  try {
    invite = await apiPublic<Invite>("GET", `/v1/auth/invites/${encodeURIComponent(token)}`);
  } catch (error) {
    if (error instanceof ApiNotFoundError) return <ExpiredLinkNotice />;
    throw error;
  }

  const firstName = invite.fullName.trim().split(/\s+/)[0];

  return (
    <AuthShell title={firstName ? `Hola, ${firstName}` : "Bienvenido"} subtitle="Crea tu contraseña">
      <SetPasswordForm action={acceptInviteAction} token={token} email={invite.email} />
    </AuthShell>
  );
}
