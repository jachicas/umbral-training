"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import type { AthletePaces, PlanChange, WeekPlan, WorkoutSession } from "@/lib/domain/workouts";
import { DISCIPLINE_META } from "@/lib/domain/discipline";
import {
  addAthleteSessionAction,
  removeAthleteSessionAction,
  setAthleteRepeatTimesAction,
  setAthleteStepMinutesAction,
} from "@/app/workouts/actions";
import { AthleteAvatar } from "@/components/athletes/AthleteAvatar";
import { BackLink } from "./WorkoutsHeader";
import { AddSessionButton, EstimatedTag, ModifiedTag, SentBanner, SessionLines } from "./WeekParts";
import { ChangesCard } from "./ChangesCard";
import { dayLabel } from "./format";

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
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const weekStart = weekDates[0];
  const changedSessions = new Set(changes.filter((c) => c.kind !== "removed").map((c) => c.sessionId));

  function run(action: () => Promise<{ error?: string }>) {
    setError(undefined);
    startTransition(async () => setError((await action()).error));
  }

  return (
    <div className="flex flex-col gap-5">
      <BackLink href={groupPlanHref ?? `/workouts?week=${weekStart}`}>{groupName ?? "Semana"}</BackLink>

      <div className="flex flex-wrap items-center gap-4">
        <AthleteAvatar fullName={athlete.fullName} color={athlete.avatarColor} size={52} radius={15} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="m-0 text-[24px] font-extrabold tracking-[-.5px]">Semana de {athlete.fullName}</h1>
            {changes.length > 0 && <ModifiedTag />}
          </div>
          <div className="mt-0.5" style={{ color: "var(--text-2)" }}>
            {weekLabel}
            {groupName && ` · ${groupName}`}
          </div>
        </div>
      </div>

      {sentOn && <SentBanner sentOn={sentOn} />}

      {changes.length > 0 && <ChangesCard changes={changes} weekDates={weekDates} />}

      {error && (
        <div className="text-[13px] font-semibold" style={{ color: "var(--danger)" }}>
          {error}
        </div>
      )}

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
                Este atleta no está en ningún grupo.{" "}
                <Link href="/workouts/groups" className="font-semibold" style={{ color: "var(--coral)" }}>
                  Asignarle un grupo
                </Link>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className={cardClass} style={{ ...cardStyle, opacity: pending ? 0.7 : 1 }}>
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
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className="group/session relative min-w-[220px] rounded-[12px] border px-3.5 py-2.5 text-[13px]"
                      style={{
                        background: "var(--surface)",
                        borderColor: "var(--border)",
                        borderLeft: `3px solid ${DISCIPLINE_META[session.discipline].colorVar}`,
                      }}
                    >
                      <div className="mb-1.5 flex items-center gap-2 pr-5">
                        <span className="text-[13.5px] font-bold">{session.name}</span>
                        {changedSessions.has(session.id) && <ModifiedTag />}
                      </div>
                      <SessionLines
                        session={session}
                        paces={paces}
                        onSetTimes={
                          sentOn
                            ? undefined
                            : (repeatId, times) =>
                                run(() => setAthleteRepeatTimesAction(athlete.id, weekStart, session.id, repeatId, times))
                        }
                        onSetMinutes={
                          sentOn
                            ? undefined
                            : (stepId, minutes) =>
                                run(() => setAthleteStepMinutesAction(athlete.id, weekStart, session.id, stepId, minutes))
                        }
                      />
                      {!sentOn && (
                        <button
                          type="button"
                          aria-label={`Quitar ${session.name}`}
                          disabled={pending}
                          onClick={() => run(() => removeAthleteSessionAction(athlete.id, weekStart, session.id))}
                          className="absolute top-2 right-2 flex size-5 items-center justify-center rounded-full opacity-0 transition-opacity group-hover/session:opacity-100 focus-visible:opacity-100"
                          style={{ background: "var(--surface-3)", color: "var(--text-2)" }}
                        >
                          <X size={11} />
                        </button>
                      )}
                    </div>
                  ))}
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
          <div className="mt-3 flex items-center gap-2 text-[12px]" style={{ color: "var(--text-3)" }}>
            <EstimatedTag /> marca estimada a partir de otra distancia del atleta.
          </div>
        </div>
      )}
    </div>
  );
}
