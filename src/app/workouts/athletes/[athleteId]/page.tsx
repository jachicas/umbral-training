import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentCoachId } from "@/lib/supabase/auth";
import { getAthleteDetail } from "@/lib/services/athletes";
import {
  getAthleteWeek,
  getAthleteWeekChanges,
  getWeekSentOn,
  listSessionLibrary,
  listWeekPlans,
  resolvePaces,
} from "@/lib/services/workouts";
import { AthleteWeekEditor } from "@/components/workouts/AthleteWeekEditor";
import { weekRangeLabel } from "@/components/workouts/format";
import { resolveWeek } from "../../week";

export const metadata: Metadata = { title: "Semana del atleta · Umbral Training" };

export default async function AthleteWeekPage({
  params,
  searchParams,
}: {
  params: Promise<{ athleteId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [{ athleteId }, { week }] = await Promise.all([params, searchParams]);
  const { monday, dates } = resolveWeek(week);
  const coachId = await getCurrentCoachId();
  const detail = await getAthleteDetail(athleteId, coachId);
  if (!detail) notFound();

  const [{ plan, group }, library, weekPlans, sentOn] = await Promise.all([
    getAthleteWeek(coachId, athleteId, monday),
    listSessionLibrary(coachId),
    listWeekPlans(coachId, monday),
    getWeekSentOn(coachId, monday),
  ]);
  const [paces, changes] = plan
    ? await Promise.all([
        resolvePaces(coachId, plan.id, [athleteId]).then((r) => r[athleteId] ?? {}),
        getAthleteWeekChanges(coachId, plan),
      ])
    : [{}, []];
  const groupPlan = group
    ? weekPlans.find((p) => p.owner.kind === "group" && p.owner.groupId === group.id)
    : undefined;

  return (
    <AthleteWeekEditor
      athlete={{ id: athleteId, fullName: detail.athlete.fullName, avatarColor: detail.athlete.avatarColor }}
      groupName={group?.name ?? null}
      groupPlanHref={groupPlan ? `/workouts/plans/${groupPlan.id}` : null}
      plan={plan}
      sentOn={sentOn}
      changes={changes}
      paces={paces}
      weekDates={dates}
      weekLabel={`Semana ${weekRangeLabel(dates)}`}
      library={library}
    />
  );
}
