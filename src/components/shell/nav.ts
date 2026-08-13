import type { LucideIcon } from "lucide-react";
import { Activity, LayoutGrid, Settings, Users, Wallet } from "lucide-react";

export type NavId = "dashboard" | "athletes" | "workouts" | "payments" | "settings";

export interface NavItem {
  id: NavId;
  label: string;
  href: string;
  icon: LucideIcon;
  soon?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", href: "/", icon: LayoutGrid },
  { id: "athletes", label: "Atletas", href: "/athletes", icon: Users },
  { id: "workouts", label: "Entrenos", href: "/", icon: Activity },
  { id: "payments", label: "Pagos", href: "/", icon: Wallet, soon: true },
  { id: "settings", label: "Ajustes", href: "/", icon: Settings, soon: true },
];
