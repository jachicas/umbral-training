import type { LucideIcon } from "lucide-react";
import { Activity, Building2, LayoutGrid, Settings, Trophy, Users, Wallet } from "lucide-react";

export type NavId = "dashboard" | "athletes" | "workouts" | "records" | "payments" | "settings" | "clubs";

export interface NavItem {
  id: NavId;
  label: string;
  /** Omitted for sections that don't exist yet ("soon"). */
  href?: string;
  icon: LucideIcon;
  soon?: boolean;
}

/** A count shown on a nav item, e.g. how many athletes owe their fee. */
export interface NavBadge {
  count: number;
  /** "danger" when some of it is overdue. */
  tone: "danger" | "warning";
  label: string;
}

export type NavBadges = Partial<Record<NavId, NavBadge>>;

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Operación",
    items: [
      { id: "dashboard", label: "Dashboard", href: "/", icon: LayoutGrid },
      { id: "athletes", label: "Atletas", href: "/athletes", icon: Users },
      { id: "workouts", label: "Entrenos", href: "/workouts", icon: Activity },
      { id: "records", label: "Marcas", href: "/records", icon: Trophy },
    ],
  },
  {
    label: "Gestión",
    items: [
      { id: "payments", label: "Pagos", href: "/payments", icon: Wallet },
      { id: "settings", label: "Ajustes", icon: Settings, soon: true },
    ],
  },
];

/** The super admin's own pages (/admin). */
export const ADMIN_NAV_GROUPS: NavGroup[] = [
  {
    label: "Administración",
    items: [{ id: "clubs", label: "Clubs", href: "/admin", icon: Building2 }],
  },
];

/** Nav item that owns the given pathname ("/" only matches exactly). */
export function activeNavItem(pathname: string, groups: NavGroup[] = NAV_GROUPS): NavItem | undefined {
  return groups
    .flatMap((group) => group.items)
    .find(
      (item) =>
        item.href &&
        (item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(item.href + "/"))
    );
}

/** Group label that contains the given nav item, for the header breadcrumb. */
export function navGroupLabel(id: NavId, groups: NavGroup[] = NAV_GROUPS): string | undefined {
  return groups.find((group) => group.items.some((item) => item.id === id))?.label;
}
