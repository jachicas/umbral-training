import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, ChevronRight, Download, Flag, MessageCircleHeart, Moon } from "lucide-react";
import { getPortalHome, getPortalWeek } from "@/lib/services/portal";
import { addDaysISO, daysUntil, weekDatesISO } from "@/lib/domain/time";
import { weekRangeLabel } from "@/components/workouts/format";
import { isRaceGoalDefined, raceCountdown } from "@/lib/domain/goals";
import type { WorkoutSession } from "@/lib/domain/workouts";
import { PortalCard, PortalLabel } from "@/components/portal/PortalShell";
import { SessionWorkout } from "@/components/portal/SessionWorkout";

export const metadata: Metadata = { title: "Hoy · Umbral Training" };

const WEEKDAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

/** "Lunes 19 de octubre". */
function longDate(dateISO: string): string {
  const d = new Date(dateISO + "T00:00:00");
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()} de ${MONTHS[d.getMonth()]}`;
}

/** The athlete's landing page: today's training, in full, with their paces. */
export default async function PortalTodayPage() {
  const home = await getPortalHome();
  const { today, weekStart } = home;
  const dayIndex = daysUntil(today, new Date(weekStart + "T00:00:00"));
  const tomorrowIndex = dayIndex + 1;

  // Sunday's "tomorrow" is in next week's plan.
  const [week, nextWeek] = await Promise.all([
    getPortalWeek(weekStart),
    tomorrowIndex > 6 ? getPortalWeek(addDaysISO(weekStart, 7)) : null,
  ]);
  const sessions = week.plan?.days[dayIndex] ?? [];
  const tomorrow: WorkoutSession[] | null =
    tomorrowIndex > 6 ? (nextWeek?.plan?.days[0] ?? null) : week.plan ? week.plan.days[tomorrowIndex] : null;

  const firstName = home.athlete.fullName.trim().split(/\s+/)[0];
  const goal = home.goal && isRaceGoalDefined(home.goal) ? home.goal : null;
  const countdown = goal ? raceCountdown(goal, new Date(today + "T00:00:00")) : null;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3 px-1 pt-1">
        <div>
          <div className="text-[13px] font-semibold" style={{ color: "var(--text-2)" }}>
            {longDate(today)}
          </div>
          <h1 className="m-0 text-[28px] font-extrabold tracking-[-.5px]">Hola, {firstName}</h1>
        </div>
        {goal && countdown?.status === "upcoming" && (
          <Link
            href="/portal/progress"
            // Links are coral app-wide; on glass, the text reads better plain.
            className="glass flex items-center gap-2.5 rounded-full py-1.5 pr-4 pl-1.5 text-[13.5px] text-[var(--text)] transition-[filter] hover:text-[var(--text)] hover:brightness-110"
          >
            <span className="flex size-8 items-center justify-center rounded-full text-[var(--on-coral)]" style={{ background: "var(--coral)" }}>
              <Flag size={15} />
            </span>
            <span style={{ color: "var(--text-2)" }}>
              <b className="tabular-nums" style={{ color: "var(--text)" }}>
                {countdown.days} {countdown.days === 1 ? "día" : "días"}
              </b>{" "}
              para <b style={{ color: "var(--text)" }}>{goal.raceName}</b>
            </span>
          </Link>
        )}
      </div>

      {home.pendingCheckin && (
        <Link
          className="text-[var(--text)] hover:text-[var(--text)]"
          href={`/portal/week?week=${home.pendingCheckin.weekStart}#checkin`}
        >
          <PortalCard className="flex items-center gap-3 ring-2 ring-[var(--coral)] transition-[filter] hover:brightness-110">
            <span
              className="flex size-10 flex-none items-center justify-center rounded-full text-[var(--on-coral)]"
              style={{ background: "var(--coral)" }}
            >
              <MessageCircleHeart size={19} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-bold">
                ¿Cómo te fue la semana del {weekRangeLabel(weekDatesISO(home.pendingCheckin.weekStart))}?
              </div>
              <div className="text-[12.5px]" style={{ color: "var(--text-2)" }}>
                Hasta el {longDate(home.pendingCheckin.closesOn).toLowerCase()}
              </div>
            </div>
            <ChevronRight size={18} style={{ color: "var(--text-3)" }} />
          </PortalCard>
        </Link>
      )}

      {!week.sentOn ? (
        <Empty icon={<CalendarClock size={24} />} title="Tu coach todavía no envía esta semana" />
      ) : sessions.length === 0 ? (
        <Empty icon={<Moon size={24} />} title="Hoy toca descanso" />
      ) : (
        <>
          {sessions.map((session) => (
            <SessionWorkout key={session.id} session={session} paces={week.paces} />
          ))}
          <div className="flex justify-end">
            <a
              href={`/portal/pdf/${weekStart}`}
              className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold text-[var(--text)] transition-[filter] hover:text-[var(--text)] hover:brightness-110"
            >
              <Download size={15} /> PDF de la semana
            </a>
          </div>
        </>
      )}

      {tomorrow && (
        <Link className="text-[var(--text)] hover:text-[var(--text)]" href={tomorrowIndex > 6 ? `/portal/week?week=${addDaysISO(weekStart, 7)}` : "/portal/week"}>
          <PortalCard className="flex items-center gap-3 transition-[filter] hover:brightness-110">
            <div className="min-w-0 flex-1">
              <PortalLabel>Mañana</PortalLabel>
              <div className="mt-1 truncate text-[15px] font-bold">
                {tomorrow.length ? tomorrow.map((s) => s.name).join(" + ") : "Descanso"}
              </div>
            </div>
            <ChevronRight size={18} style={{ color: "var(--text-3)" }} />
          </PortalCard>
        </Link>
      )}
    </>
  );
}

function Empty({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <PortalCard className="flex flex-col items-center gap-2 py-12 text-center">
      <div
        className="flex size-14 items-center justify-center rounded-full"
        style={{ background: "var(--surface-3)", color: "var(--text-2)" }}
      >
        {icon}
      </div>
      <div className="text-[18px] font-bold">{title}</div>
    </PortalCard>
  );
}
