import type { LucideIcon } from "lucide-react";
import { Activity, LayoutGrid, Settings, Users, Wallet } from "lucide-react";

export type NavId = "dashboard" | "athletes" | "workouts" | "payments" | "settings";

export interface NavItem {
  id: NavId;
  label: string;
  /** Omitted for sections that don't exist yet ("soon"). */
  href?: string;
  icon: LucideIcon;
  soon?: boolean;
}

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
    ],
  },
  {
    label: "Gestión",
    items: [
      { id: "payments", label: "Pagos", icon: Wallet, soon: true },
      { id: "settings", label: "Ajustes", icon: Settings, soon: true },
    ],
  },
];

export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((group) => group.items);

/** Nav item that owns the given pathname ("/" only matches exactly). */
export function activeNavItem(pathname: string): NavItem | undefined {
  return NAV_ITEMS.find(
    (item) =>
      item.href &&
      (item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(item.href + "/"))
  );
}

/** Group label that contains the given nav item, for the header breadcrumb. */
export function navGroupLabel(id: NavId): string | undefined {
  return NAV_GROUPS.find((group) => group.items.some((item) => item.id === id))?.label;
}
