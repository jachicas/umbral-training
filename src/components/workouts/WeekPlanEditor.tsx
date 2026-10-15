"use client";

import { useTransition } from "react";
import Link from "next/link";
import { ArrowRight, Send, X } from "lucide-react";
import type { WeekPlan, WorkoutSession } from "@/lib/domain/workouts";
import { DISCIPLINE_META } from "@/lib/domain/discipline";
import { addSessionAction, removeSessionAction } from "@/app/workouts/actions";
import { AthleteAvatar } from "@/components/athletes/AthleteAvatar";
import { BackLink } from "./WorkoutsHeader";
import { AddSessionButton, ModifiedTag, SentBanner } from "./WeekParts";
import { dayLabel, sessionSummary } from "./format";

export interface GroupWeekAthlete {
  id: string;
  fullName: string;
  avatarColor: string;
  objectiveLabel: string;
  /** Their own week has edits compared to the group's. */
  modified: boolean;
}

const cardClass = "rounded-[18px] border p-5 shadow-[var(--shadow)]";
const cardStyle = { background: "var(--surface)", borderColor: "var(--border)" };

function SessionCard({ planId, session, locked }: { planId: string; session: WorkoutSession; locked: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <div
      className="group/session relative rounded-[10px] border px-2.5 py-2"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
        borderLeft: `3px solid ${DISCIPLINE_META[session.discipline].colorVar}`,
        opacity: pending ? 0.5 : 1,
      }}
    >
      {/* Opens the library session it was copied from; editing it there doesn't change this week. */}
      <Link
        href={session.librarySessionId ? `/workouts/library/${session.librarySessionId}` : "/workouts/library"}
        className="block pr-4"
        style={{ color: "var(--text)" }}
      >
        <div className="text-[12.5px] leading-tight font-bold">{session.name}</div>
        <div className="mt-0.5 text-[11px] leading-snug" style={{ color: "var(--text-2)" }}>
          {sessionSummary(session)}
        </div>
      </Link>
      {!locked && (
        <button
          type="button"
          aria-label={`Quitar ${session.name}`}
          disabled={pending}
          onClick={() => startTransition(async () => void (await removeSessionAction(planId, session.id)))}
          className="absolute top-1.5 right-1.5 flex size-5 items-center justify-center rounded-full opacity-0 transition-opacity group-hover/session:opacity-100 focus-visible:opacity-100"
          style={{ background: "var(--surface-3)", color: "var(--text-2)" }}
        >
          <X size={11} />
        </button>
      )}
    </div>
  );
}

/** A group's week: build it day by day; each athlete's own week is one click away. */
export function WeekPlanEditor({
  plan,
  title,
  subtitle,
  weekDates,
  library,
  athletes,
  sentOn,
}: {
  plan: WeekPlan;
  title: string;
  subtitle: string;
  weekDates: string[];
  library: WorkoutSession[];
  athletes: GroupWeekAthlete[];
  /** Set once the week was sent: then it's read-only. */
  sentOn: string | null;
}) {
  return (
    <div className="flex flex-col gap-5">
      <BackLink href={`/workouts?week=${plan.weekStart}`}>Semana</BackLink>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="m-0 text-[24px] font-extrabold tracking-[-.5px]">{title}</h1>
          <div className="mt-1" style={{ color: "var(--text-2)" }}>
            {subtitle}
          </div>
        </div>
        <Link
          href={`/workouts/send?week=${plan.weekStart}`}
          className="flex h-[42px] items-center gap-[7px] rounded-[10px] border px-[18px] text-[13.5px] font-bold transition-[filter] hover:brightness-110"
          style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
        >
          <Send size={15} /> Enviar semana
        </Link>
      </div>

      {sentOn && <SentBanner sentOn={sentOn} />}

      {/* ---------------- the group's week ---------------- */}
      <div className={cardClass} style={cardStyle}>
        <div className="mb-3 text-[14px] font-bold">Semana del grupo</div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-7">
          {plan.days.map((sessions, dayIndex) => (
            <div key={dayIndex} className="flex min-w-0 flex-col gap-1.5 rounded-[12px] p-1.5" style={{ background: "var(--surface-2)" }}>
              <div className="px-1 text-[11px] font-bold tracking-[.03em] uppercase" style={{ color: "var(--text-3)" }}>
                {dayLabel(weekDates[dayIndex])}
              </div>
              {sessions.map((s) => (
                <SessionCard key={s.id} planId={plan.id} session={s} locked={Boolean(sentOn)} />
              ))}
              {sessions.length === 0 && (
                <div className="px-1 text-[11.5px]" style={{ color: "var(--text-3)" }}>
                  Descanso
                </div>
              )}
              {!sentOn && (
                <AddSessionButton
                  className="mt-auto"
                  library={library}
                  onAdd={(id) => addSessionAction(plan.id, dayIndex, id)}
                  newSessionHref={`/workouts/library/new?plan=${plan.id}&day=${dayIndex}`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ---------------- athletes ---------------- */}
      <div className={cardClass} style={cardStyle}>
        <div className="mb-1 text-[14px] font-bold">Atletas del grupo</div>
        <div className="text-[12.5px]" style={{ color: "var(--text-3)" }}>
          Abre la semana de cada uno para ver sus ritmos y ajustarle lo que haga falta.
        </div>

        {athletes.length === 0 ? (
          <div className="py-10 text-center text-[13px]" style={{ color: "var(--text-3)" }}>
            Este grupo no tiene atletas.
          </div>
        ) : (
          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {athletes.map((a) => (
              <Link
                key={a.id}
                href={`/workouts/athletes/${a.id}?week=${plan.weekStart}`}
                className="flex items-center gap-3 rounded-[12px] border px-3 py-2.5 transition-colors hover:bg-[var(--surface-2)]"
                style={{ borderColor: "var(--border)", color: "var(--text)" }}
              >
                <AthleteAvatar fullName={a.fullName} color={a.avatarColor} size={34} radius={10} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[13.5px] font-semibold">{a.fullName}</span>
                    {a.modified && <ModifiedTag />}
                  </div>
                  <div className="truncate text-[11.5px]" style={{ color: "var(--text-3)" }}>
                    {a.objectiveLabel}
                  </div>
                </div>
                <span className="flex items-center gap-1 text-[12px] font-bold whitespace-nowrap" style={{ color: "var(--coral)" }}>
                  Ver su semana <ArrowRight size={13} />
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
