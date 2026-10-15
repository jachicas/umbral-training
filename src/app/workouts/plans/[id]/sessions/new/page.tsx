import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getWeekPlan } from "@/lib/services/workouts";
import { UmbralPrototype } from "@/components/prototype/UmbralPrototype";

export const metadata: Metadata = { title: "Nuevo entreno · Umbral Training" };

export default async function NewSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const plan = await getWeekPlan(id);
  if (!plan) notFound();

  return <UmbralPrototype initialScreen="constructor" backHref={`/workouts/plans/${plan.id}`} backLabel="Semana" />;
}
