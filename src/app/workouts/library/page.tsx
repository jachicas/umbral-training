import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { listSessionLibrary } from "@/lib/services/workouts";
import { DISCIPLINE_META, DISCIPLINE_ORDER } from "@/lib/domain/discipline";
import { WorkoutsHeader, PrimaryAction } from "@/components/workouts/WorkoutsHeader";
import { countLabel, sessionSummary } from "@/components/workouts/format";

export const metadata: Metadata = { title: "Biblioteca · Umbral Training" };

export default async function LibraryPage() {
  const library = await listSessionLibrary();

  return (
    <div className="flex flex-col gap-5">
      <WorkoutsHeader
        active="library"
        subtitle={countLabel(library.length, "sesión guardada", "sesiones guardadas")}
        actions={
          <PrimaryAction href="/workouts/library/new">
            <Plus size={15} /> Nueva sesión
          </PrimaryAction>
        }
      />

      {library.length === 0 && (
        <div className="rounded-[14px] border border-dashed px-5 py-4 text-[13px]" style={{ borderColor: "var(--border-2)", color: "var(--text-2)" }}>
          Tu biblioteca está vacía.
        </div>
      )}

      {DISCIPLINE_ORDER.map((discipline) => {
        const sessions = library.filter((s) => s.discipline === discipline);
        if (sessions.length === 0) return null;
        const meta = DISCIPLINE_META[discipline];

        return (
          <section key={discipline} className="flex flex-col gap-2.5">
            <h2 className="m-0 text-[13px] font-bold tracking-[.04em] uppercase" style={{ color: "var(--text-2)" }}>
              {meta.label}
            </h2>
            <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
              {sessions.map((session) => (
                <Link
                  key={session.id}
                  href={`/workouts/library/${session.id}`}
                  className="rounded-[14px] border px-4 py-3 shadow-[var(--shadow)] transition-[filter] hover:brightness-110"
                  style={{
                    background: "var(--surface)",
                    borderColor: "var(--border)",
                    borderLeft: `4px solid ${meta.colorVar}`,
                    color: "var(--text)",
                  }}
                >
                  <div className="text-[14px] font-bold">{session.name}</div>
                  <div className="mt-0.5 text-[12px]" style={{ color: "var(--text-2)" }}>
                    {sessionSummary(session)}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
