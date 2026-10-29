import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getRace } from "@/lib/services/races";
import { raceAimsForPace, raceSummary } from "@/lib/domain/races";
import { formatDateEs, formatDuration, formatPacePerKm } from "@/lib/domain/time";
import type { Race, RaceRunner } from "@/lib/domain/types";
import { AthleteAvatar } from "@/components/athletes/AthleteAvatar";
import { DeleteRaceButton, RaceDialog } from "@/components/races/RaceDialog";
import { daysLeftLabel } from "@/components/races/RaceList";

export const metadata: Metadata = { title: "Carrera · Umbral Training" };

/** A pace for road and trail, a finish time for the rest; "—" when the coach set none. */
function targetOf(race: Race, runner: RaceRunner): string {
  if (raceAimsForPace(race.sport)) {
    return runner.targetPaceSecPerKm ? formatPacePerKm(runner.targetPaceSecPerKm) : "—";
  }
  return runner.targetTimeSeconds ? formatDuration(runner.targetTimeSeconds) : "—";
}

export default async function RacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const race = await getRace(id);
  if (!race) notFound();

  const runners = race.athletes ?? [];

  return (
    <div className="flex flex-col gap-[22px]">
      <Link
        href="/races"
        className="inline-flex items-center gap-1 self-start text-[13px] font-semibold"
        style={{ color: "var(--text-2)" }}
      >
        <ChevronLeft size={15} /> Carreras
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="m-0 text-[24px] font-bold tracking-[-.4px]">{race.name}</h1>
          <div className="mt-1 flex flex-wrap gap-x-2 text-[14px]" style={{ color: "var(--text-2)" }}>
            <span>{formatDateEs(race.date)}</span>
            <span aria-hidden>·</span>
            <span className="font-semibold" style={{ color: "var(--coral)" }}>
              {daysLeftLabel(race.date)}
            </span>
            <span aria-hidden>·</span>
            <span>{raceSummary(race)}</span>
            {race.location && (
              <>
                <span aria-hidden>·</span>
                <span>{race.location}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <RaceDialog race={race} />
          {runners.length === 0 && <DeleteRaceButton race={race} />}
        </div>
      </div>

      <section
        className="overflow-hidden rounded-[18px] border shadow-[var(--shadow)]"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center justify-between px-5 py-3.5">
          <h2 className="m-0 text-[15px] font-bold">Atletas</h2>
          <span className="text-[13px] font-semibold tabular-nums" style={{ color: "var(--text-2)" }}>
            {runners.length}
          </span>
        </div>
        {runners.length > 0 && (
          <div
            className="grid grid-cols-[minmax(0,1fr)_auto_20px] gap-4 border-t px-5 py-2.5 text-[11.5px] font-semibold tracking-[.03em] uppercase"
            style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--text-3)" }}
          >
            <span>Atleta</span>
            <span>{raceAimsForPace(race.sport) ? "Ritmo objetivo" : "Tiempo objetivo"}</span>
            <span />
          </div>
        )}
        {runners.map((a) => (
          <Link
            key={a.id}
            href={`/athletes/${a.id}`}
            className="grid grid-cols-[minmax(0,1fr)_auto_20px] items-center gap-4 border-t px-5 py-3 text-[13.5px] text-inherit transition-colors hover:bg-[var(--surface-2)] hover:text-inherit"
            style={{ borderColor: "var(--border)" }}
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <AthleteAvatar fullName={a.fullName} color={a.avatarColor} size={32} radius={999} className="text-[12px]" />
              <span className="truncate font-semibold">{a.fullName}</span>
            </span>
            <span className="font-bold tabular-nums">{targetOf(race, a)}</span>
            <ChevronRight size={16} aria-hidden style={{ color: "var(--text-3)" }} />
          </Link>
        ))}
      </section>
    </div>
  );
}
