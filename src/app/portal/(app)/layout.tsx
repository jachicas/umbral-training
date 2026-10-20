import { PortalShell } from "@/components/portal/PortalShell";
import { getShellUser } from "@/lib/supabase/shell-user";

export default async function PortalLayout({ children }: LayoutProps<"/portal">) {
  const user = await getShellUser();

  return (
    <PortalShell name={user?.name ?? ""} initials={user?.initials ?? ""}>
      {children}
    </PortalShell>
  );
}
