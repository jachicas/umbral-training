import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { getPortalHome, getPortalWeek } from "@/lib/services/portal";
import { addDaysISO, formatDateEs, mondayOfISO, weekDatesISO } from "@/lib/domain/time";
import { weekRangeLabel } from "@/components/workouts/format";
import { PortalCard } from "@/components/portal/PortalShell";
import { DayCard } from "@/components/portal/DayCard";
import { CheckinCard } from "@/components/portal/CheckinCard";

export const metadata: Metadata = { title: "Mi semana · Umbral Training" };

/** The athlete's week with their own paces, once the coach sent it. `?week=` moves between weeks. */
export default async function PortalWeekPage({ searchParams }: PageProps<"/portal/week">) {
  const { week } = await searchParams;
  const home = await getPortalHome();
  const monday = typeof week === "string" && /^\d{4}-\d{2}-\d{2}$/.test(week) ? mondayOfISO(week) : home.weekStart;
  const { plan, paces, sentOn, checkin } = await getPortalWeek(monday);

  const dates = weekDatesISO(monday);
  const isThisWeek = monday === home.weekStart;
  // Nothing to see past this week and the newest one the coach sent.
  const hasLaterWeek = monday < home.weekStart || (!!home.latestSentWeek && monday < home.latestSentWeek);

  return (
    <>
      <h1 className="m-0 px-1 pt-1 text-[26px] font-extrabold tracking-[-.5px]">Semana</h1>

      <div className="flex items-center gap-3">
        <WeekLink monday={addDaysISO(monday, -7)} label="Semana anterior">
          <ChevronLeft size={18} />
        </WeekLink>
        <div className="min-w-[120px] text-center">
          <div className="text-[16px] font-bold tabular-nums">{weekRangeLabel(dates)}</div>
          <div className="text-[11.5px]" style={{ color: "var(--text-3)" }}>
            {isThisWeek ? "Esta semana" : monday < home.weekStart ? "Semana pasada" : "Próxima semana"}
            {sentOn ? ` · enviada el ${formatDateEs(sentOn)}` : ""}
          </div>
        </div>
        <WeekLink monday={hasLaterWeek ? addDaysISO(monday, 7) : undefined} label="Semana siguiente">
          <ChevronRight size={18} />
        </WeekLink>
      </div>

      {plan ? (
        <>
          <div className="flex justify-end">
            <a
              href={`/portal/pdf/${monday}`}
              className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold text-[var(--text)] transition-[filter] hover:text-[var(--text)] hover:brightness-110"
            >
              <Download size={15} /> Descargar PDF
            </a>
          </div>
          {plan.days.map((sessions, index) => (
            <DayCard key={dates[index]} date={dates[index]} today={home.today} sessions={sessions} paces={paces} />
          ))}
          {checkin && (
            // The emails and the home page link here (#checkin).
            <div id="checkin" className="scroll-mt-24">
              <CheckinCard
                key={checkin.answer?.submittedAt ?? "new"}
                weekStart={monday}
                checkin={checkin}
                coachFirstName={home.coach.fullName.trim().split(/\s+/)[0]}
              />
            </div>
          )}
        </>
      ) : (
        <PortalCard className="flex flex-col items-center gap-2 py-10 text-center">
          <div
            className="flex size-12 items-center justify-center rounded-full"
            style={{ background: "var(--surface-3)", color: "var(--text-2)" }}
          >
            <CalendarClock size={22} />
          </div>
          <div className="text-[16px] font-bold">
            {sentOn ? "No tienes entrenos esta semana" : "Tu coach todavía no envía esta semana"}
          </div>
          {!sentOn && home.latestSentWeek && home.latestSentWeek !== monday && (
            <Link
              href={`/portal/week?week=${home.latestSentWeek}`}
              className="mt-2 text-[13px] font-bold"
              style={{ color: "var(--coral)" }}
            >
              Ver la semana del {weekRangeLabel(weekDatesISO(home.latestSentWeek))}
            </Link>
          )}
        </PortalCard>
      )}
    </>
  );
}

function WeekLink({ monday, label, children }: { monday?: string; label: string; children: React.ReactNode }) {
  const className = "glass flex size-11 flex-none items-center justify-center rounded-full text-[var(--coral)]";
  if (!monday) {
    return (
      <span aria-disabled="true" aria-label={label} className={`${className} opacity-40`}>
        {children}
      </span>
    );
  }
  return (
    <Link
      href={`/portal/week?week=${monday}`}
      aria-label={label}
      title={label}
      className={`${className} transition-[filter] hover:text-[var(--coral)] hover:brightness-110`}
    >
      {children}
    </Link>
  );
}
