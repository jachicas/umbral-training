import type { Metadata } from "next";
import Link from "next/link";
import { Archive, Users } from "lucide-react";
import { getCurrentCoachId } from "@/lib/supabase/auth";
import { listArchivedAthleteDetails, listAthleteDetails } from "@/lib/services/athletes";
import { isRaceGoal } from "@/lib/domain/goals";
import { isMembershipConfigured } from "@/lib/domain/payments";
import { AthleteExplorer } from "@/components/athletes/AthleteExplorer";
import { AddAthleteButton } from "@/components/athletes/AddAthleteButton";
import type { AthleteRowVM } from "@/components/athletes/types";

export const metadata: Metadata = { title: "Atletas · Umbral Training" };

export default async function AthletesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // `?archived=1` lists the archived athletes instead, to open one and restore it.
  const archived = (await searchParams).archived === "1";
  const coachId = await getCurrentCoachId();
  const details = archived ? await listArchivedAthleteDetails() : await listAthleteDetails(coachId);

  const athletes: AthleteRowVM[] = details.map((d) => {
    const goal = d.activeGoal;
    const race = isRaceGoal(goal);

    return {
      id: d.athlete.id,
      fullName: d.athlete.fullName,
      email: d.athlete.email,
      avatarColor: d.athlete.avatarColor,
      disciplines: d.athlete.disciplines,
      isRaceGoal: race,
      objectiveLabel: race ? goal.raceName ?? "Carrera" : "Mantenimiento",
      paymentStatus: d.membership.currentPeriodStatus,
      paymentConfigured: isMembershipConfigured(d.membership),
      accessStatus: d.athlete.accessStatus,
    };
  });

  const toggleClass =
    "flex h-[42px] items-center gap-[7px] rounded-[10px] border px-4 text-[13.5px] font-bold transition-colors hover:bg-[var(--surface-2)]";

  return (
    <div className="flex flex-col gap-[22px]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="m-0 text-[24px] font-bold tracking-[-.4px]">{archived ? "Atletas archivados" : "Atletas"}</h1>
          <div className="mt-1" style={{ color: "var(--text-2)" }}>
            <b style={{ color: "var(--text)" }}>{athletes.length}</b>{" "}
            {archived
              ? athletes.length === 1 ? "archivado" : "archivados"
              : athletes.length === 1 ? "activo" : "activos"}
          </div>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {archived ? (
            <Link href="/athletes" className={toggleClass} style={{ borderColor: "var(--border)", color: "var(--text)" }}>
              <Users size={16} /> Ver activos
            </Link>
          ) : (
            <Link href="/athletes?archived=1" className={toggleClass} style={{ borderColor: "var(--border)", color: "var(--text-2)" }}>
              <Archive size={16} /> Archivados
            </Link>
          )}
          {!archived && <AddAthleteButton />}
        </div>
      </div>

      <AthleteExplorer athletes={athletes} archived={archived} />
    </div>
  );
}
