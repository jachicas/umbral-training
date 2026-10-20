"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye } from "lucide-react";
import type { AthletePaces, WeekPlan, WorkoutSession, WorkoutStep } from "@/lib/domain/workouts";
import { planSessions, sessionRelativeSteps, stepKey } from "@/lib/domain/workouts";
import type { RaceReference } from "@/lib/domain/types";
import { DISCIPLINE_META } from "@/lib/domain/discipline";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DISCIPLINE_ICON } from "./discipline-icons";
import { dayLabel, formatPace, formatStepDuration, targetLabel } from "./format";

const KIND_LABEL: Record<WorkoutStep["kind"], string> = {
  warmup: "Calentamiento",
  work: "",
  recovery: "Recuperación",
  cooldown: "Enfriamiento",
};

/** One step: its length on the left, what to do on the right (the athlete's pace when there is one). */
function StepRow({ session, step, paces }: { session: WorkoutSession; step: WorkoutStep; paces: AthletePaces }) {
  const pace = step.target.kind === "relative" ? paces[stepKey(session.id, step.id)] : undefined;

  return (
    <div className="flex items-baseline gap-3 py-1">
      <span className="w-[64px] flex-none text-[13.5px] font-semibold tabular-nums">{formatStepDuration(step.duration)}</span>
      <span className="min-w-0 flex-1 truncate text-[12.5px]" style={{ color: "var(--text-3)" }}>
        {KIND_LABEL[step.kind]}
      </span>
      {pace ? (
        <span className="flex items-baseline gap-1.5">
          <span className="text-[14px] font-bold tabular-nums" style={{ color: "var(--coral)" }}>
            {formatPace(pace.paceSecPerKm)}
          </span>
          {pace.estimated && (
            <span className="text-[10.5px] font-semibold" style={{ color: "var(--text-3)" }} title="Estimado desde otra distancia">
              est.
            </span>
          )}
        </span>
      ) : (
        <span className="text-[13px]" style={{ color: "var(--text-2)" }}>
          {targetLabel(step.target)}
        </span>
      )}
    </div>
  );
}

function SessionBlock({ session, paces }: { session: WorkoutSession; paces: AthletePaces }) {
  const meta = DISCIPLINE_META[session.discipline];
  const Icon = DISCIPLINE_ICON[session.discipline];

  return (
    <div className="flex flex-col">
      <div className="mb-1 flex items-center gap-2">
        <span className="flex size-6 items-center justify-center rounded-[7px]" style={{ background: meta.tintVar }}>
          <Icon size={13} style={{ color: meta.colorVar }} />
        </span>
        <span className="text-[14.5px] font-bold">{session.name}</span>
      </div>
      {session.nodes.map((node) => {
        if (node.type === "note") {
          return (
            <p key={node.id} className="m-0 py-1 text-[12.5px] italic" style={{ color: "var(--text-2)" }}>
              {node.text}
            </p>
          );
        }
        if (node.type === "step") return <StepRow key={node.id} session={session} step={node} paces={paces} />;
        return (
          <div key={node.id} className="my-1 rounded-[10px] px-3 py-1.5" style={{ background: "var(--surface-2)" }}>
            <div className="text-[11.5px] font-bold tracking-[.04em] uppercase" style={{ color: "var(--text-3)" }}>
              {node.times} series
            </div>
            {node.steps.map((step) => (
              <StepRow key={step.id} session={session} step={step} paces={paces} />
            ))}
          </div>
        );
      })}
    </div>
  );
}

/**
 * The athlete's week as they'll receive it, with their own paces: a quick
 * check before sending (and the base for the PDF).
 */
export function WeekPreviewButton({
  athleteId,
  athleteName,
  weekLabel,
  weekDates,
  plan,
  paces,
}: {
  athleteId: string;
  athleteName: string;
  weekLabel: string;
  weekDates: string[];
  plan: WeekPlan;
  paces: AthletePaces;
}) {
  const [open, setOpen] = useState(false);

  const relative = planSessions(plan).flatMap((session) =>
    sessionRelativeSteps(session).map((step) => ({ step, pace: paces[stepKey(session.id, step.id)] }))
  );
  const anyEstimated = relative.some((r) => r.pace?.estimated);
  // A reference with no pace at all: the athlete has no time over any distance.
  const missing = [
    ...new Set(
      relative.filter((r) => !r.pace && r.step.target.kind === "relative").map((r) => (r.step.target as { reference: RaceReference }).reference)
    ),
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-[40px] items-center gap-1.5 rounded-[10px] border px-4 text-[13px] font-bold"
        style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
      >
        <Eye size={15} /> Vista previa
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-[20px] sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-extrabold tracking-[-.3px]">{athleteName}</DialogTitle>
            <DialogDescription>{weekLabel}</DialogDescription>
          </DialogHeader>

          {missing.length > 0 && (
            <div
              className="flex flex-wrap items-center justify-between gap-2 rounded-[12px] px-3.5 py-2.5 text-[12.5px]"
              style={{ background: "var(--surface-2)", color: "var(--text-2)" }}
            >
              <span>Sin marcas: sin ritmos.</span>
              <Link href={`/athletes/${athleteId}`} className="font-bold" style={{ color: "var(--coral)" }}>
                Agregar marca
              </Link>
            </div>
          )}

          <div className="-mx-1 flex max-h-[62vh] flex-col overflow-y-auto px-1">
            {plan.days.map((sessions, dayIndex) => (
              <div
                key={dayIndex}
                className="grid grid-cols-[56px_1fr] gap-3 border-t py-3.5 first:border-t-0 first:pt-1"
                style={{ borderColor: "var(--border)" }}
              >
                <div className="pt-0.5 text-[11.5px] font-bold tracking-[.05em] uppercase" style={{ color: "var(--text-3)" }}>
                  {dayLabel(weekDates[dayIndex])}
                </div>
                {sessions.length === 0 ? (
                  <div className="text-[13px]" style={{ color: "var(--text-3)" }}>
                    Descanso
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {sessions.map((session) => (
                      <SessionBlock key={session.id} session={session} paces={paces} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {anyEstimated && (
            <div className="border-t pt-3 text-[12px]" style={{ borderColor: "var(--border)", color: "var(--text-3)" }}>
              <b>est.</b> ritmo estimado a partir de otra distancia del atleta.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
