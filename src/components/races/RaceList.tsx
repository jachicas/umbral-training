import Link from "next/link";
import { ChevronRight, MapPin } from "lucide-react";
import { AthleteAvatar } from "@/components/athletes/AthleteAvatar";
import { raceSummary } from "@/lib/domain/races";
import { daysUntil } from "@/lib/domain/time";
import type { Race } from "@/lib/domain/types";

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const SHOWN_AVATARS = 5;

/** "Hoy", "Mañana", "En 12 días". */
export function daysLeftLabel(date: string): string {
  const days = daysUntil(date);
  if (days <= 0) return "Hoy";
  return days === 1 ? "Mañana" : `En ${days} días`;
}

/** The coach's upcoming races, soonest first, each with who runs it. */
export function RaceList({ races }: { races: Race[] }) {
  return (
    <div
      className="overflow-hidden rounded-[18px] border shadow-[var(--shadow)]"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      {races.map((race, i) => {
        const [, month, day] = race.date.split("-");
        const runners = race.athletes ?? [];
        return (
          <Link
            key={race.id}
            href={`/races/${race.id}`}
            className="flex items-center gap-4 px-5 py-4 text-inherit transition-colors hover:bg-[var(--surface-2)] hover:text-inherit"
            style={i > 0 ? { borderTop: "1px solid var(--border)" } : undefined}
          >
            {/* Neutral on purpose: a club's color may not read as text on its own tint (dark mode). */}
            <div
              className="flex size-12 flex-none flex-col items-center justify-center rounded-[12px] border"
              style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
            >
              <span className="text-[18px] leading-none font-extrabold tabular-nums">{Number(day)}</span>
              <span className="mt-0.5 text-[10.5px] font-bold tracking-[.04em] uppercase" style={{ color: "var(--text-2)" }}>
                {MONTHS[Number(month) - 1]}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="truncate text-[15px] font-bold">{race.name}</div>
              <div className="flex min-w-0 items-center gap-1.5 text-[12.5px]" style={{ color: "var(--text-2)" }}>
                <span className="truncate">{raceSummary(race)}</span>
                {race.location && (
                  <>
                    <span aria-hidden>·</span>
                    <MapPin size={12} aria-hidden className="flex-none" />
                    <span className="truncate">{race.location}</span>
                  </>
                )}
                <span aria-hidden className="sm:hidden">
                  ·
                </span>
                <span className="flex-none sm:hidden">{daysLeftLabel(race.date)}</span>
              </div>
            </div>

            <span
              className="hidden w-[92px] flex-none text-right text-[13px] font-semibold tabular-nums sm:block"
              style={{ color: "var(--text-2)" }}
            >
              {daysLeftLabel(race.date)}
            </span>

            <div className="hidden w-[150px] flex-none items-center justify-end gap-2.5 sm:flex">
              <div className="flex -space-x-2" aria-hidden>
                {runners.slice(0, SHOWN_AVATARS).map((a) => (
                  <AthleteAvatar
                    key={a.id}
                    fullName={a.fullName}
                    color={a.avatarColor}
                    size={30}
                    radius={999}
                    className="text-[11px] ring-2 ring-[var(--bg)]"
                  />
                ))}
              </div>
              <span className="text-[13px] font-semibold tabular-nums whitespace-nowrap" style={{ color: "var(--text-2)" }}>
                {runners.length === 1 ? "1 atleta" : `${runners.length} atletas`}
              </span>
            </div>

            <ChevronRight size={16} aria-hidden className="flex-none" style={{ color: "var(--text-3)" }} />
          </Link>
        );
      })}
    </div>
  );
}
