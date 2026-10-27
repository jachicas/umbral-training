import { PortalShell } from "@/components/portal/PortalShell";
import { shellBrand } from "@/components/shell/brand";
import { getCurrentUser, getShellUser } from "@/lib/auth/current-user";

export default async function PortalLayout({ children }: LayoutProps<"/portal">) {
  const [user, me] = await Promise.all([getShellUser(), getCurrentUser()]);

  return (
    <PortalShell name={user?.name ?? ""} initials={user?.initials ?? ""} brand={shellBrand(me?.club)}>
      {children}
    </PortalShell>
  );
}
