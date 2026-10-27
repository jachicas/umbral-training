import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { CreateAthleteForm } from "@/components/athletes/CreateAthleteForm";
import { getCurrentCoachId } from "@/lib/auth/current-user";
import { listUpcomingRaces } from "@/lib/services/athletes";

export const metadata: Metadata = { title: "Añadir atleta · Umbral Training" };

export default async function NewAthletePage() {
  const races = await listUpcomingRaces(await getCurrentCoachId());

  return (
    <div className="flex flex-col gap-5">
      <Link
        href="/athletes"
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold transition-colors hover:text-[var(--coral)]"
        style={{ color: "var(--text-2)" }}
      >
        <ChevronLeft size={16} /> Atletas
      </Link>

      <h1 className="m-0 text-[24px] font-bold tracking-[-.4px]">Añadir atleta</h1>

      <CreateAthleteForm races={races} />
    </div>
  );
}
