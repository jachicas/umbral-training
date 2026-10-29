"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, LogIn, LogOut, Menu, Moon, Plus, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { ADMIN_NAV_GROUPS, NAV_GROUPS, activeNavItem, navGroupLabel, type NavBadge, type NavBadges } from "./nav";
import { BrandMark, type ShellBrand } from "./brand";
import { toggleTheme } from "./theme";
import { HeaderSearch, HeaderSearchFallback } from "./HeaderSearch";
import { signOutAction } from "@/app/login/actions";
import { leaveClubAction } from "@/app/admin/actions";
import type { AccountRole } from "@/lib/domain/portal";

/** Who is signed in, as shown in the sidebar. */
export interface ShellUser {
  name: string;
  initials: string;
  /** Athletes get the portal's own shell, not this one. */
  role: AccountRole;
}
const BACKGROUND_IMAGE = "/backgrounds/tt-ride.jpg";

const roundButtonClass =
  "glass flex size-11 flex-none items-center justify-center rounded-full text-[var(--text)] transition-[filter] hover:brightness-125";

/**
 * Rendered once by the root layout, so sidebar state survives navigation.
 * The coach's panel, in their club's brand; the super admin's /admin; and
 * the coach's panel again while the super admin is a club's guest (`viewing`).
 */
export function AppShell({
  children,
  user,
  brand,
  viewing,
  badges = {},
}: {
  children: React.ReactNode;
  user: ShellUser | null;
  brand: ShellBrand;
  /** The club the super admin entered as a guest. */
  viewing?: { name: string };
  badges?: NavBadges;
}) {
  const pathname = usePathname();
  const adminPages = user?.role === "admin" && (pathname === "/admin" || pathname.startsWith("/admin/"));
  const navGroups = adminPages ? ADMIN_NAV_GROUPS : NAV_GROUPS;
  const activeItem = activeNavItem(pathname, navGroups);
  const [collapsed, setCollapsed] = useState(false);
  const expanded = !collapsed;
  const hideWhenCollapsed = cn("max-md:hidden", !expanded && "md:hidden");
  const stackedBrand = expanded && Boolean(brand.logoUrl);

  // Signed out (the sign-in page) or an invited coach's first password: no navigation to show.
  if (!user || pathname === "/welcome") return <>{children}</>;

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
          className={cn(
            "glass flex h-full w-[74px] flex-none flex-col gap-1 rounded-[26px] px-3 py-4 transition-[width] duration-150 md:w-[var(--sidebar-w)]",
            brand.sidebar && !adminPages && "club-sidebar"
          )}
          style={{ "--sidebar-w": expanded ? "256px" : "74px" } as React.CSSProperties}
        >
          {/* Expanded, a club's logo sits above its name, big enough to read,
              and the name gets the full width (two lines at most), straight
              on the sidebar, lined up with the nav's icons. */}
          <div
            className={cn(
              "mb-3 flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-2 md:p-2.5",
              stackedBrand &&
                "md:flex-col md:items-start md:gap-3.5 md:rounded-none md:border-x-0 md:border-t-0 md:border-[var(--border-2)] md:bg-transparent md:px-3 md:pt-1 md:pb-5"
            )}
          >
            <BrandMark
              brand={brand}
              className={cn("size-[34px] flex-none rounded-[11px] text-[17px]", stackedBrand && "md:size-16")}
            />
            <div className={cn("min-w-0", hideWhenCollapsed)}>
              <div
                className={cn(
                  "truncate whitespace-nowrap text-[14.5px] font-bold tracking-tight",
                  stackedBrand && "md:line-clamp-2 md:text-[16px] md:leading-snug md:whitespace-normal"
                )}
              >
                {brand.name}
              </div>
              <div className={cn("text-[11.5px]", stackedBrand && "md:mt-0.5 md:text-[12.5px]")} style={{ color: "var(--text-2)" }}>
                {adminPages ? "Super admin" : "Panel de coach"}
              </div>
            </div>
          </div>

          <nav className="-mx-1 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-1">
            {navGroups.map((group, groupIndex) => (
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
                          ? "bg-[var(--coral)] font-semibold text-[var(--on-coral)] hover:bg-[var(--coral-hover)] hover:text-[var(--on-coral)]"
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
              className="flex size-[34px] flex-none items-center justify-center rounded-full text-[13px] font-bold"
              style={{ background: "var(--club-accent, var(--gym))", color: "var(--on-club-accent, #fff)" }}
            >
              {user.initials}
            </div>
            <div className={cn("min-w-0 flex-1", hideWhenCollapsed)}>
              <div className="truncate text-[13px] font-semibold">{user.name}</div>
              <div className="text-[11.5px]" style={{ color: "var(--text-2)" }}>
                {user.role === "admin" ? "Super admin" : "Coach"}
              </div>
            </div>
            {/* A guest leaves from the bar on top, back to their own session. */}
            {!viewing && (
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
            )}
          </div>
        </aside>

        {/* ---------------- content ---------------- */}
        <div className="flex min-w-0 flex-1 flex-col gap-3 md:gap-4">
          {viewing && !adminPages && <ViewingBar name={viewing.name} />}
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
                  {navGroupLabel(activeItem.id, navGroups)} <span className="px-1 opacity-60">/</span>{" "}
                  {activeItem.label}
                </div>
                <div className="text-[19px] font-bold tracking-tight">{activeItem.label}</div>
              </div>
            )}

            {adminPages ? (
              <div className="min-w-0 max-w-[540px] flex-1 lg:ml-6" />
            ) : (
              <Suspense fallback={<HeaderSearchFallback className="lg:ml-6" />}>
                <HeaderSearch className="lg:ml-6" />
              </Suspense>
            )}

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

/** While the super admin is a club's guest: whose panel it is, and the way out. */
function ViewingBar({ name }: { name: string }) {
  return (
    <div
      className="flex items-center gap-3 rounded-full border px-4 py-2 text-[13px]"
      style={{ background: "var(--coral-tint)", borderColor: "var(--coral)" }}
    >
      <LogIn size={16} className="flex-none" style={{ color: "var(--coral)" }} />
      <span className="min-w-0 truncate">
        <span style={{ color: "var(--text-2)" }}>Invitado en</span> <b>{name}</b>
      </span>
      <form action={leaveClubAction} className="ml-auto">
        <button
          type="submit"
          className="rounded-full px-3 py-1 text-[12.5px] font-bold transition-[filter] hover:brightness-110"
          style={{ background: "var(--coral)", color: "var(--on-coral)" }}
        >
          Salir
        </button>
      </form>
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
