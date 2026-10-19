import type { Metadata } from "next";
import { getDashboard } from "@/lib/services/dashboard";
import { DashboardView } from "@/components/dashboard/DashboardView";

export const metadata: Metadata = { title: "Dashboard · Umbral Training" };

export default async function DashboardPage() {
  return <DashboardView data={await getDashboard()} />;
}
