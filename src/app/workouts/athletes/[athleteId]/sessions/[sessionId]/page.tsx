import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentCoachId } from "@/lib/supabase/auth";
import { getAthleteDetail } from "@/lib/services/athletes";
import { getAthleteWeek, getWeekSentOn, resolvePaces } from "@/lib/services/workouts";
import { BackLink } from "@/components/workouts/WorkoutsHeader";
import { SessionEditor } from "@/components/workouts/SessionEditor";
import { SentBanner, SessionLines } from "@/components/workouts/WeekParts";
import { removeAthleteSessionFromEditorAction, replaceAthleteSessionAction } from "../../../../actions";
import { resolveWeek } from "../../../../week";

export const metadata: Metadata = { title: "Sesión del atleta · Umbral Training" };

/** One session of an athlete's week, edited in full for them only. */
export default async function AthleteSessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ athleteId: string; sessionId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [{ athleteId, sessionId }, { week }] = await Promise.all([params, searchParams]);
  const { monday } = resolveWeek(week);
  const detail = await getAthleteDetail(athleteId, await getCurrentCoachId());
  if (!detail) notFound();

  const [{ plan }, sentOn] = await Promise.all([getAthleteWeek(athleteId, monday), getWeekSentOn(monday)]);
  const session = plan?.days.flat().find((s) => s.id === sessionId);
  if (!plan || !session) notFound();

  const name = detail.athlete.fullName;
  const firstName = name.trim().split(/\s+/)[0];
  const back = `/workouts/athletes/${athleteId}?week=${monday}`;

  if (sentOn) {
    const paces = (await resolvePaces(plan.id, [athleteId]))[athleteId] ?? {};
    return (
      <div className="flex flex-col gap-4">
        <BackLink href={back}>Semana de {name}</BackLink>
        <h1 className="m-0 text-[24px] font-extrabold tracking-[-.4px]">{session.name}</h1>
        <SentBanner sentOn={sentOn} />
        <div className="rounded-[16px] border px-5 py-4 text-[13px]" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <SessionLines session={session} paces={paces} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <BackLink href={back}>Semana de {name}</BackLink>
      <div className="text-[12.5px]" style={{ color: "var(--text-3)" }}>
        Los cambios solo aplican a la semana de {name}; la del grupo y la biblioteca no cambian.
      </div>
      <SessionEditor
        session={session}
        cancelHref={back}
        disciplineLocked
        save={replaceAthleteSessionAction.bind(null, athleteId, monday, session.id)}
        saveLabel={`Guardar para ${firstName}`}
        remove={{
          label: "Quitar de su semana",
          title: `¿Quitar «${session.name}» de la semana de ${firstName}?`,
          description: "Solo cambia su semana; la del grupo sigue igual.",
          run: removeAthleteSessionFromEditorAction.bind(null, athleteId, monday, session.id),
        }}
      />
    </div>
  );
}
