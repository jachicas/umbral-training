import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { AppShell } from "@/components/shell/AppShell";
import { BrandStyle, shellBrand } from "@/components/shell/brand";
import { SuspendedNotice } from "@/components/shell/SuspendedNotice";
import { getCurrentUser, getShellUser } from "@/lib/auth/current-user";
import { getViewedClubId } from "@/lib/api/viewing";
import { getClub } from "@/lib/services/clubs";
import { getOwingCounts } from "@/lib/services/payments";
import type { Club } from "@/lib/domain/clubs";
import type { NavBadges } from "@/components/shell/nav";
import { THEME_INIT_SCRIPT } from "@/components/shell/theme";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Umbral Training",
  description:
    "Panel interno para entrenadoras de running, triatlón y gimnasio: gestiona atletas, entrenos, métricas y carreras.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getShellUser();
  // The coach's and athletes' own club; or the one the super admin reads (never on /admin: the proxy clears it there).
  const viewedClubId = user?.role === "admin" ? await getViewedClubId() : undefined;
  const club = user?.role === "admin" ? await viewedClub(viewedClubId) : (await getCurrentUser())?.club;
  const suspended = user?.role !== "admin" && club?.suspendedAt !== undefined;
  // Athletes' pages bring their own shell (src/app/portal).
  const shellUser = user?.role === "athlete" ? null : user;
  const badges = user?.role === "coach" || (user?.role === "admin" && club) ? await navBadges() : {};

  return (
    // The theme script may add `dark` to <html> before hydration.
    <html lang="es" className={cn("h-full", "antialiased", inter.variable, "font-sans")} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <BrandStyle palette={club?.palette} />
      </head>
      <body className="min-h-full">
        {suspended && club ? (
          <SuspendedNotice clubName={club.name} />
        ) : (
          <AppShell
            user={shellUser}
            brand={shellBrand(club)}
            viewing={user?.role === "admin" && club ? { name: club.name } : undefined}
            badges={badges}
          >
            {children}
          </AppShell>
        )}
      </body>
    </html>
  );
}

async function viewedClub(clubId: string | undefined): Promise<Club | undefined> {
  if (!clubId) return undefined;
  try {
    return await getClub(clubId);
  } catch {
    return undefined;
  }
}

/**
 * "Pagos" shows the payments athletes reported, waiting for the coach to
 * confirm; else how many athletes owe, red when someone is late. A failing
 * API just hides it.
 */
async function navBadges(): Promise<NavBadges> {
  try {
    const { owing, overdue, pendingReports } = await getOwingCounts();
    if (pendingReports > 0) {
      return {
        payments: {
          count: pendingReports,
          tone: "warning",
          label: `${pendingReports} ${pendingReports === 1 ? "pago por confirmar" : "pagos por confirmar"}`,
        },
      };
    }
    if (owing === 0) return {};
    return {
      payments: {
        count: owing,
        tone: overdue > 0 ? "danger" : "warning",
        label: `${owing} ${owing === 1 ? "atleta debe" : "atletas deben"} su cuota${overdue > 0 ? `, ${overdue} con atraso` : ""}`,
      },
    };
  } catch {
    return {};
  }
}
