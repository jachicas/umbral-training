import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={cn("h-full", "antialiased", inter.variable, "font-sans")}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
