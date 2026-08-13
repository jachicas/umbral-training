import type { Metadata } from "next";
import { getCurrentCoachId } from "@/lib/supabase/auth";
import { listAthleteDetails } from "@/lib/services/athletes";
import { isRaceGoal } from "@/lib/domain/goals";
import { isMembershipConfigured } from "@/lib/domain/payments";
import { AthleteExplorer } from "@/components/athletes/AthleteExplorer";
import { AddAthleteButton } from "@/components/athletes/AddAthleteButton";
import type { AthleteRowVM } from "@/components/athletes/types";

export const metadata: Metadata = { title: "Atletas · Umbral Training" };

export default async function AthletesPage() {
  const coachId = await getCurrentCoachId();
  const details = await listAthleteDetails(coachId);

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

  const activeCount = details.filter((d) => d.athlete.status === "active").length;

  return (
    <div className="flex flex-col gap-[22px]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="m-0 text-[24px] font-bold tracking-[-.4px]">Atletas</h1>
          <div className="mt-1" style={{ color: "var(--text-2)" }}>
            <b style={{ color: "var(--text)" }}>{athletes.length}</b> atletas ·{" "}
            <b style={{ color: "var(--text)" }}>{activeCount}</b> activos
          </div>
        </div>
        <AddAthleteButton />
      </div>

      <AthleteExplorer athletes={athletes} />
    </div>
  );
}
