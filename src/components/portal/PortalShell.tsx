"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, LogOut, Moon, Sun, Timer, TrendingUp, UserRound, Wallet, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/app/login/actions";
import { toggleTheme } from "@/components/shell/theme";

interface PortalNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const NAV: PortalNavItem[] = [
  { href: "/portal", label: "Hoy", icon: Timer },
  { href: "/portal/week", label: "Semana", icon: CalendarDays },
  { href: "/portal/progress", label: "Progreso", icon: TrendingUp },
  { href: "/portal/payments", label: "Pagos", icon: Wallet },
  { href: "/portal/profile", label: "Perfil", icon: UserRound },
];

const isActive = (pathname: string, href: string) =>
  href === "/portal" ? pathname === href : pathname === href || pathname.startsWith(href + "/");

const roundButtonClass =
  "glass flex size-10 flex-none items-center justify-center rounded-full text-[var(--text)] transition-[filter] hover:brightness-125";

/**
 * The athlete's portal: made for a phone first. A slim top bar, the page
 * scrolling underneath, and the tabs at the bottom (in the top bar on wider
 * screens).
 */
export function PortalShell({ name, initials, children }: { name: string; initials: string; children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="relative min-h-dvh w-full" style={{ color: "var(--text)" }}>
      <div
        aria-hidden
        className="fixed inset-0 bg-cover bg-no-repeat"
        style={{
          backgroundColor: "var(--bg)",
          backgroundImage: "var(--bg-scrim), url(/backgrounds/tt-ride.jpg)",
          backgroundPosition: "62% center",
        }}
      />

      <div className="relative mx-auto flex w-full max-w-[920px] flex-col gap-3 px-3 pt-3 pb-28 md:gap-4 md:px-5 md:pt-5 md:pb-10">
        <header className="glass flex items-center gap-3 rounded-[22px] px-3 py-2.5 md:px-4">
          <div
            className="flex size-9 flex-none items-center justify-center rounded-[11px] text-[17px] font-extrabold text-white"
            style={{ background: "var(--coral)" }}
          >
            U
          </div>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-[14.5px] font-bold tracking-tight">Umbral Training</div>
            <div className="truncate text-[11.5px]" style={{ color: "var(--text-2)" }}>
              {name}
            </div>
          </div>

          <nav className="ml-4 flex items-center gap-1 max-md:hidden">
            {NAV.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-3.5 py-2 text-[13.5px] font-medium transition-colors",
                    active
                      ? "bg-[var(--coral)] font-semibold text-white hover:bg-[var(--coral-hover)]"
                      : "text-[var(--text-2)] hover:bg-[var(--surface-3)] hover:text-[var(--text)]"
                  )}
                >
                  <item.icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex-1" />
          <button type="button" onClick={toggleTheme} aria-label="Cambiar tema" title="Cambiar tema" className={roundButtonClass}>
            <Moon size={17} className="dark:hidden" />
            <Sun size={17} className="hidden dark:block" />
          </button>
          <form action={signOutAction}>
            <button type="submit" aria-label="Cerrar sesión" title="Cerrar sesión" className={roundButtonClass}>
              <LogOut size={16} />
            </button>
          </form>
          <div
            aria-hidden
            className="flex size-10 flex-none items-center justify-center rounded-full text-[13px] font-bold text-white max-sm:hidden"
            style={{ background: "var(--run)" }}
          >
            {initials}
          </div>
        </header>

        <main className="flex flex-col gap-3 md:gap-4">{children}</main>
      </div>

      {/* Phone: the tabs sit at the bottom, within thumb's reach. */}
      <nav
        className="glass fixed inset-x-3 bottom-3 z-20 grid grid-cols-5 gap-1 rounded-[22px] p-1.5 md:hidden"
        style={{ paddingBottom: "max(6px, env(safe-area-inset-bottom))" }}
      >
        {NAV.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-[16px] py-2 text-[11px] font-semibold transition-colors",
                active ? "bg-[var(--coral)] text-white" : "text-[var(--text-2)]"
              )}
            >
              <item.icon size={19} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

/** A glass card for portal content. */
export function PortalCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return <section className={cn("glass rounded-[22px] p-4 md:p-5", className)}>{children}</section>;
}

/** Small uppercase label above a card's content. */
export function PortalLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11.5px] font-bold tracking-[.08em] uppercase" style={{ color: "var(--text-3)" }}>
      {children}
    </div>
  );
}
