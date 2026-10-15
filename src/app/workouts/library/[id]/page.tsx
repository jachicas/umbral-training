import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLibrarySession } from "@/lib/services/workouts";
import { BackLink } from "@/components/workouts/WorkoutsHeader";
import { SessionEditor } from "@/components/workouts/SessionEditor";

export const metadata: Metadata = { title: "Editar sesión · Umbral Training" };

export default async function EditLibrarySessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getLibrarySession(id);
  if (!session) notFound();

  return (
    <div className="flex flex-col gap-4">
      <BackLink href="/workouts/library">Biblioteca</BackLink>
      <div className="text-[12.5px]" style={{ color: "var(--text-3)" }}>
        Los cambios aplican a las semanas que armes de aquí en adelante; las que ya tienen esta sesión no cambian.
      </div>
      <SessionEditor session={session} addTo={null} cancelHref="/workouts/library" />
    </div>
  );
}
