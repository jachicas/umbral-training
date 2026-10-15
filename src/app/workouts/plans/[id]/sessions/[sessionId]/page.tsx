import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getWeekPlan } from "@/lib/services/workouts";
import { planSessions } from "@/lib/domain/workouts";
import { UmbralPrototype } from "@/components/prototype/UmbralPrototype";

export const metadata: Metadata = { title: "Editar entreno · Umbral Training" };

/** The builder is still the design prototype: it shows the session's name, not its saved steps. */
export default async function EditSessionPage({ params }: { params: Promise<{ id: string; sessionId: string }> }) {
  const { id, sessionId } = await params;
  const plan = await getWeekPlan(id);
  const session = plan && planSessions(plan).find((s) => s.id === sessionId);
  if (!plan || !session) notFound();

  return (
    <UmbralPrototype
      initialScreen="constructor"
      sessionName={session.name}
      backHref={`/workouts/plans/${plan.id}`}
      backLabel="Semana"
    />
  );
}
