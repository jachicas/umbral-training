import type { Metadata } from "next";
import { listUpcomingRaces } from "@/lib/services/races";
import { RaceDialog } from "@/components/races/RaceDialog";
import { RaceList } from "@/components/races/RaceList";

export const metadata: Metadata = { title: "Carreras · Umbral Training" };

export default async function RacesPage() {
  const races = await listUpcomingRaces();

  return (
    <div className="flex flex-col gap-[22px]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="m-0 text-[24px] font-bold tracking-[-.4px]">Carreras</h1>
          <div className="mt-1" style={{ color: "var(--text-2)" }}>
            <b style={{ color: "var(--text)" }}>{races.length}</b> {races.length === 1 ? "próxima" : "próximas"}
          </div>
        </div>
        <RaceDialog />
      </div>

      {races.length > 0 && <RaceList races={races} />}
    </div>
  );
}
