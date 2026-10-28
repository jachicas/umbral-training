import type { Metadata } from "next";
import { getDashboard } from "@/lib/services/dashboard";
import { listUnseenGuestChanges } from "@/lib/services/guest-changes";
import { getCurrentUser } from "@/lib/auth/current-user";
import { DashboardView } from "@/components/dashboard/DashboardView";

export const metadata: Metadata = { title: "Dashboard · Umbral Training" };

export default async function DashboardPage() {
  // What the super admin changed is for the coach: not while they're the guest here.
  const guest = (await getCurrentUser())?.guest !== undefined;
  const [data, guestChanges] = await Promise.all([getDashboard(), guest ? [] : listUnseenGuestChanges()]);
  return <DashboardView data={data} guestChanges={guestChanges} />;
}
