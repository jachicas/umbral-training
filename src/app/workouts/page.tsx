import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Copy, Lock, Plus, Send } from "lucide-react";
import { getCurrentCoachId } from "@/lib/supabase/auth";
import { listAthleteDetails } from "@/lib/services/athletes";
import { getWeekSentOn, listGroups, listWeekPlans } from "@/lib/services/workouts";
import { addDaysISO, formatDateEs } from "@/lib/domain/time";
import { WorkoutsHeader, PrimaryAction, SecondaryAction } from "@/components/workouts/WorkoutsHeader";
import { PlanCard, type PlanCardAthlete } from "@/components/workouts/PlanCard";
import { ActionButton } from "@/components/workouts/ActionButton";
import { countLabel, weekRangeLabel } from "@/components/workouts/format";
import { createGroupWeekAction } from "./actions";
import { resolveWeek } from "./week";

export const metadata: Metadata = { title: "Entrenos · Umbral Training" };

export default async function WorkoutsWeekPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { week } = await searchParams;
  const { monday, dates } = resolveWeek(week);
  const coachId = await getCurrentCoachId();
  const [details, groups, plans, previousPlans, sentOn] = await Promise.all([
    listAthleteDetails(coachId),
    listGroups(coachId),
    listWeekPlans(coachId, monday),
    listWeekPlans(coachId, addDaysISO(monday, -7)),
    getWeekSentOn(coachId, monday),
  ]);

  const athleteById = new Map<string, PlanCardAthlete>(
    details.map((d) => [d.athlete.id, { id: d.athlete.id, fullName: d.athlete.fullName, avatarColor: d.athlete.avatarColor }])
  );
  const athletesOf = (ids: string[]) => ids.flatMap((id) => athleteById.get(id) ?? []);
  const groupPlan = (groupId: string) =>
    plans.find((p) => p.owner.kind === "group" && p.owner.groupId === groupId) ?? null;
  const ungrouped = details.filter((d) => !groups.some((g) => g.athleteIds.includes(d.athlete.id)));
  const readyCount = groups.filter((g) => groupPlan(g.id)).length;

  const navButton =
    "glass flex size-9 items-center justify-center rounded-full transition-[filter] hover:brightness-110";

  return (
    <div className="flex flex-col gap-5">
      <WorkoutsHeader
        active="week"
        subtitle={
          <>
            <b style={{ color: "var(--text)" }}>
              {readyCount}/{groups.length}
            </b>{" "}
            grupos con la semana armada
          </>
        }
        actions={
          <SecondaryAction href={`/workouts/send?week=${monday}`}>
            <Send size={15} /> Enviar semana
          </SecondaryAction>
        }
      />

      <div className="flex items-center gap-3">
        <Link href={`/workouts?week=${addDaysISO(monday, -7)}`} aria-label="Semana anterior" className={navButton}>
          <ChevronLeft size={17} />
        </Link>
        <div className="text-[15px] font-bold tabular-nums">Semana {weekRangeLabel(dates)}</div>
        <Link href={`/workouts?week=${addDaysISO(monday, 7)}`} aria-label="Semana siguiente" className={navButton}>
          <ChevronRight size={17} />
        </Link>
        {sentOn && (
          <span
            className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-bold"
            style={{ background: "rgba(22,163,74,.14)", color: "var(--ok)" }}
          >
            <Lock size={12} /> Enviada el {formatDateEs(sentOn)}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {groups.map((group) => {
          const plan = groupPlan(group.id);
          const hasPrevious = previousPlans.some((p) => p.owner.kind === "group" && p.owner.groupId === group.id);
          return (
            <PlanCard
              key={group.id}
              title={group.name}
              subtitle={
                <>
                  {countLabel(group.athleteIds.length, "atleta", "atletas")}
                  {" · "}
                  <b style={{ color: plan ? "var(--ok)" : "var(--pend)" }}>{plan ? "Semana armada" : "Sin armar"}</b>
                </>
              }
              athletes={athletesOf(group.athleteIds)}
              plan={plan}
              weekDates={dates}
              actions={
                plan ? (
                  <PrimaryAction href={`/workouts/plans/${plan.id}`}>Abrir semana</PrimaryAction>
                ) : sentOn ? null : (
                  <>
                    <ActionButton variant="secondary" action={createGroupWeekAction.bind(null, group.id, monday, false)}>
                      <Plus size={14} /> Empezar vacía
                    </ActionButton>
                    {hasPrevious && (
                      <ActionButton action={createGroupWeekAction.bind(null, group.id, monday, true)}>
                        <Copy size={14} /> Copiar semana anterior
                      </ActionButton>
                    )}
                  </>
                )
              }
            />
          );
        })}

        {ungrouped.length > 0 && (
          <div
            className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-dashed px-5 py-3.5 text-[13px]"
            style={{ borderColor: "var(--border-2)", color: "var(--text-2)" }}
          >
            <span>
              Sin grupo: <b style={{ color: "var(--text)" }}>{ungrouped.map((d) => d.athlete.fullName).join(", ")}</b> ·
              no reciben semana
            </span>
            <Link href="/workouts/groups" className="font-semibold hover:underline" style={{ color: "var(--coral)" }}>
              Asignar grupo
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
