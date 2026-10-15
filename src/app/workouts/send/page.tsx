import type { Metadata } from "next";
import { getCurrentCoachId } from "@/lib/supabase/auth";
import { listAthleteDetails } from "@/lib/services/athletes";
import { getWeekSentOn, listGroups, listWeekPlans, resolvePaces } from "@/lib/services/workouts";
import { effectivePlanFor, planSessions } from "@/lib/domain/workouts";
import { SendWeek, type AthleteMessage } from "@/components/workouts/SendWeek";
import { weekMessage, weekRangeLabel } from "@/components/workouts/format";
import { resolveWeek } from "../week";

export const metadata: Metadata = { title: "Enviar semana · Umbral Training" };

export default async function SendWeekPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { week } = await searchParams;
  const { monday, dates } = resolveWeek(week);
  const coachId = await getCurrentCoachId();
  const [details, groups, plans, sentOn] = await Promise.all([
    listAthleteDetails(coachId),
    listGroups(),
    listWeekPlans(monday),
    getWeekSentOn(monday),
  ]);

  const assignments = details.flatMap(({ athlete }) => {
    const plan = effectivePlanFor(athlete.id, groups, plans);
    return plan ? [{ athlete, plan }] : [];
  });

  const messages: AthleteMessage[] = await Promise.all(
    assignments.map(async ({ athlete, plan }) => {
      const paces = await resolvePaces(plan.id, [athlete.id]);
      return {
        athleteId: athlete.id,
        fullName: athlete.fullName,
        avatarColor: athlete.avatarColor,
        phone: athlete.phone,
        workoutCount: planSessions(plan).length,
        text: weekMessage(athlete.fullName, dates, plan, { paces: paces[athlete.id] }),
      };
    })
  );

  return (
    <SendWeek
      weekStart={monday}
      weekLabel={weekRangeLabel(dates)}
      weekHref={`/workouts?week=${monday}`}
      sentOn={sentOn}
      messages={messages}
    />
  );
}
