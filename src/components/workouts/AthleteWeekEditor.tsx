"use client";

import Link from "next/link";
import { ChevronRight, FileDown, UserRound } from "lucide-react";
import { missingReferences, type AthletePaces, type PlanChange, type WeekPlan, type WorkoutSession } from "@/lib/domain/workouts";
import { DISCIPLINE_META } from "@/lib/domain/discipline";
import { addAthleteSessionAction } from "@/app/workouts/actions";
import { AthleteAvatar } from "@/components/athletes/AthleteAvatar";
import { BackLink } from "./WorkoutsHeader";
import { AddSessionButton, MissingRecordTag, ModifiedTag, SentBanner } from "./WeekParts";
import { WeekPreviewButton } from "./WeekPreviewDialog";
import { DISCIPLINE_ICON } from "./discipline-icons";
import { ChangesCard } from "./ChangesCard";
import { dayLabel, weekRangeLabel } from "./format";
import type { WeeklyCheckin } from "@/lib/domain/checkins";
import { weekDatesISO } from "@/lib/domain/time";
import { CheckinSummary } from "@/components/checkins/CheckinSummary";

const cardClass = "rounded-[18px] border p-5 shadow-[var(--shadow)]";
const cardStyle = { background: "var(--surface)", borderColor: "var(--border)" };

/**
 * One athlete's week, editable until the week is sent. The first edit gives
 * them their own copy of the group's week.
 */
export function AthleteWeekEditor({
  athlete,
  groupName,
  groupPlanHref,
  plan,
  sentOn,
  changes,
  paces,
  weekDates,
  weekLabel,
  library,
  previousCheckin,
}: {
  athlete: { id: string; fullName: string; avatarColor: string };
  groupName: string | null;
  groupPlanHref: string | null;
  plan: WeekPlan | null;
  /** Set once the week was sent: then it's read-only. */
  sentOn: string | null;
  /** Net edits made to this athlete's week (empty while it's the group's). */
  changes: PlanChange[];
  paces: AthletePaces;
  weekDates: string[];
  weekLabel: string;
  library: WorkoutSession[];
  /** How the week before went, by the athlete's own check-in. */
  previousCheckin?: WeeklyCheckin;
}) {
  const weekStart = weekDates[0];
  const changedSessions = new Set(changes.filter((c) => c.kind !== "removed").map((c) => c.sessionId));
  const missing = plan ? missingReferences(plan, paces) : [];


  return (
    <div className="flex flex-col gap-5">
      <BackLink href={groupPlanHref ?? `/workouts?week=${weekStart}`}>{groupName ?? "Semana"}</BackLink>

      <div className="flex flex-wrap items-center gap-4">
        <AthleteAvatar fullName={athlete.fullName} color={athlete.avatarColor} size={52} radius={15} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="m-0 text-[24px] font-extrabold tracking-[-.5px]">Semana de {athlete.fullName}</h1>
            {changes.length > 0 && <ModifiedTag />}
            {missing.map((r) => (
              <Link key={r} href={`/records/${r}`}>
                <MissingRecordTag reference={r} />
              </Link>
            ))}
          </div>
          <div className="mt-0.5" style={{ color: "var(--text-2)" }}>
            {weekLabel}
            {groupName && ` · ${groupName}`}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href={`/athletes/${athlete.id}`}
            className="flex h-[40px] items-center gap-1.5 rounded-[10px] border px-4 text-[13px] font-bold"
            style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
          >
            <UserRound size={15} /> Ver atleta
          </Link>
          {plan && (
            <>
              <WeekPreviewButton
                athleteId={athlete.id}
                athleteName={athlete.fullName}
                weekLabel={weekLabel}
                weekDates={weekDates}
                plan={plan}
                paces={paces}
              />
              <a
                href={`/workouts/pdf/${weekStart}/${athlete.id}`}
                download
                className="flex h-[40px] items-center gap-1.5 rounded-[10px] border px-4 text-[13px] font-bold"
                style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
              >
                <FileDown size={15} /> PDF
              </a>
            </>
          )}
        </div>
      </div>

      {sentOn && <SentBanner sentOn={sentOn} />}

      {previousCheckin && (
        <div className={cardClass} style={cardStyle}>
          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
            <div className="text-[14px] font-bold">Cómo le fue la semana anterior</div>
            <Link href={`/athletes/${athlete.id}#checkins`} className="text-[12.5px] font-semibold" style={{ color: "var(--coral)" }}>
              Check-in del {weekRangeLabel(weekDatesISO(previousCheckin.weekStart))}
            </Link>
          </div>
          <CheckinSummary checkin={previousCheckin} />
        </div>
      )}

      {changes.length > 0 && <ChangesCard changes={changes} weekDates={weekDates} />}


      {!plan ? (
        <div className={cardClass} style={cardStyle}>
          <div className="py-10 text-center text-[13.5px]" style={{ color: "var(--text-3)" }}>
            {groupName ? (
              <>
                {groupName} todavía no tiene la semana armada.{" "}
                <Link href={`/workouts?week=${weekStart}`} className="font-semibold" style={{ color: "var(--coral)" }}>
                  Ir a armarla
                </Link>
              </>
            ) : (
              <>
                Sin grupo.{" "}
                <Link href="/workouts/groups" className="font-semibold" style={{ color: "var(--coral)" }}>
                  Asignarle un grupo
                </Link>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className={cardClass} style={cardStyle}>
          <div className="flex flex-col">
            {plan.days.map((sessions, dayIndex) => (
              <div
                key={dayIndex}
                className="grid items-start gap-3 py-3 md:grid-cols-[90px_1fr]"
                style={dayIndex > 0 ? { borderTop: "1px solid var(--border)" } : undefined}
              >
                <div className="pt-2 text-[12px] font-bold tracking-[.03em] uppercase" style={{ color: "var(--text-3)" }}>
                  {dayLabel(weekDates[dayIndex])}
                </div>
                <div className="flex flex-wrap items-start gap-2">
                  {sessions.map((session) => {
                    const meta = DISCIPLINE_META[session.discipline];
                    const Icon = DISCIPLINE_ICON[session.discipline];
                    return (
                      <Link
                        key={session.id}
                        href={`/workouts/athletes/${athlete.id}/sessions/${session.id}?week=${weekStart}`}
                        className="group/session flex min-w-[200px] items-center gap-2.5 rounded-[12px] border px-2.5 py-2 transition-colors hover:bg-[var(--surface-2)]"
                        style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
                      >
                        <span
                          className="flex size-8 flex-none items-center justify-center rounded-[9px]"
                          style={{ background: meta.tintVar }}
                        >
                          <Icon size={16} style={{ color: meta.colorVar }} />
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold">{session.name}</span>
                        {changedSessions.has(session.id) && (
                          <span
                            title="Cambiada para este atleta"
                            className="size-1.5 flex-none rounded-full"
                            style={{ background: "var(--modified)" }}
                          />
                        )}
                        <ChevronRight
                          size={15}
                          className="flex-none transition-transform group-hover/session:translate-x-0.5"
                          style={{ color: "var(--text-3)" }}
                        />
                      </Link>
                    );
                  })}
                  {sessions.length === 0 && (
                    <div className="pt-2 text-[13px]" style={{ color: "var(--text-3)" }}>
                      Descanso
                    </div>
                  )}
                  {!sentOn && (
                    <AddSessionButton
                      className="w-[120px] pt-1"
                      library={library}
                      onAdd={(id) => addAthleteSessionAction(athlete.id, weekStart, dayIndex, id)}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
