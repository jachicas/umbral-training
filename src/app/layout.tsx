import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { AppShell } from "@/components/shell/AppShell";
import { getShellUser } from "@/lib/supabase/shell-user";
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

  return (
    // The theme script may add `dark` to <html> before hydration.
    <html lang="es" className={cn("h-full", "antialiased", inter.variable, "font-sans")} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full">
        <AppShell user={user}>{children}</AppShell>
      </body>
    </html>
  );
}
