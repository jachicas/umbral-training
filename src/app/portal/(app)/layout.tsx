import { PortalShell } from "@/components/portal/PortalShell";
import { shellBrand } from "@/components/shell/brand";
import { getMyClub } from "@/lib/services/clubs";
import { getShellUser } from "@/lib/supabase/shell-user";

export default async function PortalLayout({ children }: LayoutProps<"/portal">) {
  const [user, club] = await Promise.all([getShellUser(), getMyClub()]);

  return (
    <PortalShell name={user?.name ?? ""} initials={user?.initials ?? ""} brand={shellBrand(club)}>
      {children}
    </PortalShell>
  );
}
