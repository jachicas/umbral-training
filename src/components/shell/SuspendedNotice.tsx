import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/app/login/actions";

/** What a suspended club's coach and athletes see instead of their pages. */
export function SuspendedNotice({ clubName }: { clubName: string }) {
  return (
    <AuthShell title="Club suspendido" subtitle={clubName}>
      <form action={signOutAction}>
        <Button type="submit" variant="outline" size="lg" className="h-11 w-full rounded-xl text-[14.5px] font-semibold">
          Cerrar sesión
        </Button>
      </form>
    </AuthShell>
  );
}
