import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentCoachId } from "@/lib/auth/current-user";
import { getAthleteDetail } from "@/lib/services/athletes";
import { listAthleteCheckins } from "@/lib/services/checkins";
import { addDaysISO } from "@/lib/domain/time";
import {
  getAthleteWeek,
  getWeekSentOn,
  listGroups,
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

  const [{ plan, groupId, changes }, groups, library, weekPlans, sentOn, checkins] = await Promise.all([
    getAthleteWeek(athleteId, monday),
    listGroups(),
    listSessionLibrary(),
    listWeekPlans(monday),
    getWeekSentOn(monday),
    listAthleteCheckins(athleteId),
  ]);
  const previousWeek = addDaysISO(monday, -7);
  const group = groups.find((g) => g.id === groupId);
  const paces = plan ? ((await resolvePaces(plan.id, [athleteId]))[athleteId] ?? {}) : {};
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
      previousCheckin={checkins.find((c) => c.weekStart === previousWeek)}
    />
  );
}
