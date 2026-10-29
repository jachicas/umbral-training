import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCurrentCoachId } from "@/lib/auth/current-user";
import { listAthleteDetails } from "@/lib/services/athletes";
import {
  getAthleteWeekChanges,
  getWeekPlan,
  getWeekSentOn,
  listGroups,
  listSessionLibrary,
  listWeekPlans,
  resolvePaces,
} from "@/lib/services/workouts";
import { customWeekOf, missingReferences } from "@/lib/domain/workouts";
import { weekDatesISO } from "@/lib/domain/time";
import { WeekPlanEditor, type GroupWeekAthlete } from "@/components/workouts/WeekPlanEditor";
import { countLabel, weekRangeLabel } from "@/components/workouts/format";
import { objectiveLabel } from "../../week";

export const metadata: Metadata = { title: "Semana del grupo · Umbral Training" };

export default async function GroupWeekPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const coachId = await getCurrentCoachId();
  const plan = await getWeekPlan(id);
  if (!plan) notFound();
  // An athlete's own week is edited from their page.
  if (plan.owner.kind === "athlete") redirect(`/workouts/athletes/${plan.owner.athleteId}?week=${plan.weekStart}`);

  const groupId = plan.owner.groupId;
  const [details, groups, library, sentOn, weekPlans] = await Promise.all([
    listAthleteDetails(coachId),
    listGroups(),
    listSessionLibrary(),
    getWeekSentOn(plan.weekStart),
    listWeekPlans(plan.weekStart),
  ]);
  const group = groups.find((g) => g.id === groupId);
  const dates = weekDatesISO(plan.weekStart);

  const athleteIds = (group?.athleteIds ?? []).filter((id) => details.some((d) => d.athlete.id === id));
  const groupPaces = athleteIds.length > 0 ? await resolvePaces(plan.id, athleteIds) : {};

  const athletes: GroupWeekAthlete[] = await Promise.all(
    athleteIds.map(async (athleteId) => {
      const detail = details.find((d) => d.athlete.id === athleteId)!;
      const custom = customWeekOf(athleteId, weekPlans);
      const [changes, paces] = await Promise.all([
        custom ? getAthleteWeekChanges(custom) : [],
        custom ? resolvePaces(custom.id, [athleteId]) : groupPaces,
      ]);
      return {
        id: athleteId,
        fullName: detail.athlete.fullName,
        avatarColor: detail.athlete.avatarColor,
        objectiveLabel: objectiveLabel(detail),
        modified: changes.length > 0,
        missingReferences: missingReferences(custom ?? plan, paces[athleteId] ?? {}),
      };
    })
  );

  return (
    <WeekPlanEditor
      plan={plan}
      title={group?.name ?? "Grupo"}
      subtitle={`Semana ${weekRangeLabel(dates)} · ${countLabel(athletes.length, "atleta", "atletas")}`}
      weekDates={dates}
      library={library}
      athletes={athletes}
      sentOn={sentOn}
    />
  );
}
