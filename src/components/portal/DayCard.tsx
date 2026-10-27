import { ChevronDown } from "lucide-react";
import { DISCIPLINE_META } from "@/lib/domain/discipline";
import type { AthletePaces, WorkoutSession } from "@/lib/domain/workouts";
import { dayLabel } from "@/components/workouts/format";
import { PortalCard } from "./PortalShell";
import { SessionWorkout, totals } from "./SessionWorkout";

/**
 * A day folds away to one line (its sessions and distance), so the week
 * reads at a glance. Only today starts open; a rest day has nothing to open.
 * Days already gone fade back (and come back in full once opened).
 */
export function DayCard({
  date,
  today,
  sessions,
  paces,
}: {
  date: string;
  today: string;
  sessions: WorkoutSession[];
  paces: AthletePaces;
}) {
  const isToday = date === today;
  const isPast = date < today;
  const heading = (
    <>
      <div className="text-[15px] font-bold">{dayLabel(date)}</div>
      {isToday && (
        <span
          className="rounded-full px-2 py-0.5 text-[10.5px] font-bold tracking-[.04em] uppercase text-[var(--on-coral)]"
          style={{ background: "var(--coral)" }}
        >
          Hoy
        </span>
      )}
    </>
  );

  if (sessions.length === 0) {
    return (
      <PortalCard
        className={`flex items-center gap-2 ${isToday ? "ring-2 ring-[var(--coral)]" : ""} ${isPast ? "opacity-55" : ""}`}
      >
        {heading}
        <span className="text-[13px]" style={{ color: "var(--text-3)" }}>
          · Descanso
        </span>
      </PortalCard>
    );
  }

  const distance = sessions.flatMap((session) => totals(session)).filter((t) => t.endsWith("km") || t.endsWith(" m"));

  return (
    <details
      open={isToday}
      className={`group glass rounded-[22px] p-4 md:p-5 transition-opacity ${isToday ? "ring-2 ring-[var(--coral)]" : ""} ${isPast ? "opacity-55 hover:opacity-80 open:opacity-100" : ""}`}
    >
      <summary className="flex cursor-pointer list-none items-center gap-2 [&::-webkit-details-marker]:hidden">
        {heading}
        <span className="flex min-w-0 flex-1 items-center gap-1.5 truncate text-[13px]" style={{ color: "var(--text-2)" }}>
          {sessions.map((session) => (
            <span
              key={session.id}
              aria-hidden
              className="size-2 flex-none rounded-full"
              style={{ background: DISCIPLINE_META[session.discipline].colorVar }}
            />
          ))}
          <span className="truncate">{sessions.map((session) => session.name).join(" + ")}</span>
        </span>
        {distance.length === 1 && (
          <span className="flex-none text-[12.5px] font-bold tabular-nums max-sm:hidden" style={{ color: "var(--text-2)" }}>
            {distance[0]}
          </span>
        )}
        <ChevronDown
          size={18}
          className="flex-none transition-transform group-open:rotate-180"
          style={{ color: "var(--text-3)" }}
        />
      </summary>

      <div className="mt-4 flex flex-col gap-6">
        {sessions.map((session) => (
          <SessionWorkout key={session.id} session={session} paces={paces} compact />
        ))}
      </div>
    </details>
  );
}
