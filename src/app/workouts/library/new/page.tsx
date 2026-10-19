import type { Metadata } from "next";
import { getWeekPlan } from "@/lib/services/workouts";
import { BackLink } from "@/components/workouts/WorkoutsHeader";
import { SessionEditor } from "@/components/workouts/SessionEditor";
import { saveLibrarySessionAction } from "../actions";

export const metadata: Metadata = { title: "Nueva sesión · Umbral Training" };

/** `?plan=…&day=…` when opened from a day of a group's week: the session is added there once saved. */
export default async function NewLibrarySessionPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { plan: planId, day } = await searchParams;
  const dayIndex = Number(day);
  const plan = typeof planId === "string" && Number.isInteger(dayIndex) && dayIndex >= 0 && dayIndex <= 6
    ? await getWeekPlan(planId)
    : null;
  const addTo = plan && plan.owner.kind === "group" ? { planId: plan.id, dayIndex } : null;
  const back = addTo ? `/workouts/plans/${addTo.planId}` : "/workouts/library";

  return (
    <div className="flex flex-col gap-4">
      <BackLink href={back}>{addTo ? "Semana" : "Biblioteca"}</BackLink>
      <SessionEditor
        session={null}
        cancelHref={back}
        save={saveLibrarySessionAction.bind(null, null, addTo, null)}
        saveLabel={addTo ? "Guardar y agregar al día" : "Guardar sesión"}
      />
    </div>
  );
}
