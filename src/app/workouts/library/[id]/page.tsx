import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLibrarySession, getWeekPlan } from "@/lib/services/workouts";
import { BackLink } from "@/components/workouts/WorkoutsHeader";
import { SessionEditor } from "@/components/workouts/SessionEditor";
import { deleteLibrarySessionAction, saveLibrarySessionAction } from "../actions";

export const metadata: Metadata = { title: "Editar sesión · Umbral Training" };

/** `?plan=…` when opened from a group's week: back, cancel, save and delete return to it. */
export default async function EditLibrarySessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [{ id }, { plan: planId }] = await Promise.all([params, searchParams]);
  const [session, plan] = await Promise.all([
    getLibrarySession(id),
    typeof planId === "string" ? getWeekPlan(planId) : null,
  ]);
  if (!session) notFound();
  const fromPlanId = plan && plan.owner.kind === "group" ? plan.id : null;
  const back = fromPlanId ? `/workouts/plans/${fromPlanId}` : "/workouts/library";

  return (
    <div className="flex flex-col gap-4">
      <BackLink href={back}>{fromPlanId ? "Semana" : "Biblioteca"}</BackLink>
      <SessionEditor
        session={session}
        cancelHref={back}
        save={saveLibrarySessionAction.bind(null, session.id, null, fromPlanId)}
        saveLabel="Guardar sesión"
        remove={{
          label: "Borrar",
          title: `¿Borrar «${session.name}» de tu biblioteca?`,
          run: deleteLibrarySessionAction.bind(null, session.id, fromPlanId),
        }}
      />
    </div>
  );
}
