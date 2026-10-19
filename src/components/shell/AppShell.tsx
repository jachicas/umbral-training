"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, LogOut, Menu, Moon, Plus, Search, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_GROUPS, activeNavItem, navGroupLabel, type NavBadge, type NavBadges } from "./nav";
import { THEME_STORAGE_KEY } from "./theme";
import { signOutAction } from "@/app/login/actions";

/** Who is signed in, as shown in the sidebar. */
export interface ShellUser {
  name: string;
  initials: string;
}
const BACKGROUND_IMAGE = "/backgrounds/tt-ride.jpg";

/** The theme lives as a `dark` class on <html> (set before paint by the root
 *  layout), so the icon is swapped with CSS and no React state is needed. */
function toggleTheme() {
  const dark = document.documentElement.classList.toggle("dark");
  try {
    localStorage.setItem(THEME_STORAGE_KEY, dark ? "dark" : "light");
  } catch {
    // Storage unavailable (private mode): theme just won't persist.
  }
}

const roundButtonClass =
  "glass flex size-11 flex-none items-center justify-center rounded-full text-[var(--text)] transition-[filter] hover:brightness-125";

/** Rendered once by the root layout, so sidebar state survives navigation. */
export function AppShell({
  children,
  user,
  badges = {},
}: {
  children: React.ReactNode;
  user: ShellUser | null;
  badges?: NavBadges;
}) {
  const pathname = usePathname();
  const activeItem = activeNavItem(pathname);
  const [collapsed, setCollapsed] = useState(false);
  const expanded = !collapsed;
  const hideWhenCollapsed = cn("max-md:hidden", !expanded && "md:hidden");

  // Signed out (the sign-in page): no navigation to show.
  if (!user) return <>{children}</>;

  return (
    <div className="relative h-dvh w-full overflow-hidden" style={{ color: "var(--text)" }}>
      {/* Fixed photo behind everything; the scrim token darkens it in dark mode
          so text sitting directly on it (the header) stays legible. */}
      <div
        aria-hidden
        className="fixed inset-0 bg-cover bg-no-repeat"
        style={{
          backgroundColor: "var(--bg)",
          backgroundImage: `var(--bg-scrim), url(${BACKGROUND_IMAGE})`,
          backgroundPosition: "62% center",
        }}
      />

      <div className="relative flex h-full gap-3 p-3 md:gap-5 md:p-5">
        {/* ---------------- sidebar ---------------- */}
        {/* Below md the rail always stays icon-only (74px) regardless of the
            desktop expand/collapse toggle — there's no room for labels on a
            phone screen, so we skip a full off-canvas drawer for this
            coach-only admin surface (PRD deprioritizes mobile polish here). */}
        <aside
          className="glass flex h-full w-[74px] flex-none flex-col gap-1 rounded-[26px] px-3 py-4 transition-[width] duration-150 md:w-[var(--sidebar-w)]"
          style={{ "--sidebar-w": expanded ? "256px" : "74px" } as React.CSSProperties}
        >
          <div
            className="mb-3 flex items-center gap-3 rounded-2xl border p-2 md:p-2.5"
            style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
          >
            <div
              className="flex size-[34px] flex-none items-center justify-center rounded-[11px] text-[17px] font-extrabold tracking-tight text-white"
              style={{ background: "var(--coral)" }}
            >
              U
            </div>
            <div className={cn("min-w-0", hideWhenCollapsed)}>
              <div className="whitespace-nowrap text-[14.5px] font-bold tracking-tight">
                Umbral Training
              </div>
              <div className="text-[11.5px]" style={{ color: "var(--text-2)" }}>
                Panel de coach
              </div>
            </div>
          </div>

          <nav className="-mx-1 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-1">
            {NAV_GROUPS.map((group, groupIndex) => (
              <div key={group.label} className="flex flex-col gap-1">
                <div
                  className={cn(
                    "px-3 pt-3 pb-1.5 text-[11px] font-semibold tracking-[.12em] uppercase",
                    hideWhenCollapsed
                  )}
                  style={{ color: "var(--text-3)" }}
                >
                  {group.label}
                </div>
                {/* Collapsed rail: a hairline stands in for the group label. */}
                {groupIndex > 0 && (
                  <div
                    className={cn("mx-3 my-2 h-px md:hidden", !expanded && "md:block")}
                    style={{ background: "var(--border-2)" }}
                  />
                )}

                {group.items.map((item) => {
                  const isActive = item.id === activeItem?.id;
                  const Icon = item.icon;
                  const badge = badges[item.id];
                  const content = (
                    <>
                      <span className="relative flex-none">
                        <Icon size={19} />
                        {/* Collapsed rail: the count rides on the icon. */}
                        {badge && (
                          <CountBadge
                            badge={badge}
                            active={isActive}
                            className={cn("absolute -top-2 -right-2.5 md:hidden", !expanded && "md:flex")}
                          />
                        )}
                      </span>
                      <span className={cn("truncate", hideWhenCollapsed)}>{item.label}</span>
                      {badge && <CountBadge badge={badge} active={isActive} className={cn("ml-auto", hideWhenCollapsed)} />}
                      {item.soon && (
                        <span
                          className={cn(
                            "ml-auto rounded-full border px-1.5 py-0.5 text-[9px] font-bold tracking-[.04em]",
                            hideWhenCollapsed
                          )}
                          style={{ color: "var(--text-3)", borderColor: "var(--border-2)" }}
                        >
                          PRONTO
                        </span>
                      )}
                    </>
                  );
                  const itemClass =
                    "flex w-full items-center gap-3 rounded-[13px] px-3 py-[11px] text-[14px] font-medium transition-colors";

                  if (!item.href) {
                    return (
                      <div
                        key={item.id}
                        title={`${item.label} · próximamente`}
                        aria-disabled="true"
                        className={cn(itemClass, "cursor-default text-[var(--text-2)] opacity-60")}
                      >
                        {content}
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      title={badge ? `${item.label} · ${badge.label}` : item.label}
                      aria-current={isActive ? "page" : undefined}
                      // Colors stay in classes (not inline styles) so the hover states can win.
                      className={cn(
                        itemClass,
                        isActive
                          ? "bg-[var(--coral)] font-semibold text-white hover:bg-[var(--coral-hover)] hover:text-white"
                          : "text-[var(--text-2)] hover:bg-[var(--surface-3)] hover:text-[var(--text)]"
                      )}
                    >
                      {content}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          <div
            className="mt-2 flex items-center gap-2.5 rounded-2xl border p-2 md:p-2.5"
            style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
          >
            <div
              className="flex size-[34px] flex-none items-center justify-center rounded-full text-[13px] font-bold text-white"
              style={{ background: "var(--gym)" }}
            >
              {user.initials}
            </div>
            <div className={cn("min-w-0 flex-1", hideWhenCollapsed)}>
              <div className="truncate text-[13px] font-semibold">{user.name}</div>
              <div className="text-[11.5px]" style={{ color: "var(--text-2)" }}>
                Coach
              </div>
            </div>
            <form action={signOutAction} className={hideWhenCollapsed}>
              <button
                type="submit"
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
                className="flex size-8 items-center justify-center rounded-full transition-[filter] hover:brightness-125"
                style={{ color: "var(--text-2)" }}
              >
                <LogOut className="size-4" />
              </button>
            </form>
          </div>
        </aside>

        {/* ---------------- content ---------------- */}
        <div className="flex min-w-0 flex-1 flex-col gap-3 md:gap-4">
          <header className="flex items-center gap-2.5 md:gap-4 md:pt-1">
            <button
              type="button"
              onClick={() => setCollapsed((v) => !v)}
              aria-label="Alternar barra lateral"
              aria-expanded={expanded}
              className={cn(roundButtonClass, "max-md:hidden")}
            >
              <Menu size={19} />
            </button>

            {activeItem && (
              <div className="min-w-0 flex-none leading-tight max-lg:hidden">
                <div className="text-[12.5px]" style={{ color: "var(--text-2)" }}>
                  {navGroupLabel(activeItem.id)} <span className="px-1 opacity-60">/</span>{" "}
                  {activeItem.label}
                </div>
                <div className="text-[19px] font-bold tracking-tight">{activeItem.label}</div>
              </div>
            )}

            <label className="glass ml-0 flex h-11 min-w-0 max-w-[540px] flex-1 cursor-text items-center gap-2.5 rounded-full px-4 lg:ml-6">
              <Search size={17} className="flex-none" style={{ color: "var(--text-3)" }} />
              <input
                placeholder="Buscar atletas, entrenos, carreras…"
                className="w-full min-w-0 bg-transparent text-[14px] outline-none placeholder:text-[var(--text-3)]"
                style={{ color: "var(--text)" }}
              />
              <kbd
                className="flex-none rounded-md border px-1.5 py-0.5 font-sans text-[11px] font-semibold max-md:hidden"
                style={{ color: "var(--text-2)", borderColor: "var(--border-2)", background: "var(--surface-2)" }}
              >
                ⌘K
              </kbd>
            </label>

            <div className="flex-1" />

            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Cambiar tema"
              title="Cambiar tema"
              className={roundButtonClass}
            >
              <Moon size={18} className="dark:hidden" />
              <Sun size={18} className="hidden dark:block" />
            </button>
            <button
              type="button"
              aria-label="Nuevo"
              title="Nuevo"
              className={cn(roundButtonClass, "max-md:hidden")}
            >
              <Plus size={19} />
            </button>
            <button
              type="button"
              aria-label="Notificaciones"
              title="Notificaciones"
              className={cn(roundButtonClass, "max-sm:hidden")}
            >
              <Bell size={18} />
            </button>
          </header>

          {/* The only scroll container: header and sidebar stay put while the
              glass panel scrolls its content, like a native window. */}
          <main className="glass min-h-0 flex-1 overflow-y-auto rounded-[28px]">
            <div className="mx-auto w-full max-w-[1440px] p-4 md:p-7">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}

/** A round count on a nav item; white on the active (coral) item so it stays visible. */
function CountBadge({ badge, active, className }: { badge: NavBadge; active: boolean; className?: string }) {
  const color = badge.tone === "danger" ? "var(--danger)" : "var(--pend)";

  return (
    <span
      aria-label={badge.label}
      className={cn(
        "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] leading-none font-bold tabular-nums",
        className
      )}
      style={active ? { background: "#fff", color } : { background: color, color: "#fff" }}
    >
      {badge.count > 99 ? "99+" : badge.count}
    </span>
  );
}
