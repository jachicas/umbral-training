import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { AppShell } from "@/components/shell/AppShell";
import { getShellUser } from "@/lib/supabase/shell-user";
import { getOwingCounts } from "@/lib/services/payments";
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
  // Athletes' pages bring their own shell (src/app/portal).
  const coach = user?.role === "coach" ? user : null;
  const badges = coach ? await navBadges() : {};

  return (
    // The theme script may add `dark` to <html> before hydration.
    <html lang="es" className={cn("h-full", "antialiased", inter.variable, "font-sans")} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full">
        <AppShell user={coach} badges={badges}>
          {children}
        </AppShell>
      </body>
    </html>
  );
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
