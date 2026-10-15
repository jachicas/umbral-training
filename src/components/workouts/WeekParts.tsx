"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Lock, Minus, Plus } from "lucide-react";
import type { AthletePaces, WorkoutSession, WorkoutStep } from "@/lib/domain/workouts";
import { stepKey } from "@/lib/domain/workouts";
import { DISCIPLINE_META, DISCIPLINE_ORDER } from "@/lib/domain/discipline";
import type { ActionState } from "@/app/workouts/actions";
import { describeSession, formatPace, formatStepDuration, sessionSummary, stepTail, targetLabel } from "./format";
import { formatDateEs } from "@/lib/domain/time";

/* Pieces shared by the group-week and athlete-week editors. */

const MAX_REPEAT_TIMES = 50;
const MAX_STEP_MINUTES = 600;

export function EstimatedTag() {
  return (
    <span
      title="Marca estimada a partir de otra distancia"
      className="rounded-[5px] px-1.5 py-px text-[10px] font-bold tracking-[.02em] uppercase"
      style={{ background: "rgba(217,119,6,.14)", color: "var(--pend)" }}
    >
      est.
    </span>
  );
}

export function ModifiedTag() {
  return (
    <span
      className="rounded-[6px] px-1.5 py-0.5 text-[10.5px] font-bold tracking-[.02em] uppercase"
      style={{ background: "rgba(124,58,237,.16)", color: "var(--modified)" }}
    >
      Modificado
    </span>
  );
}

/** Shown on a week that was already sent to the athletes. */
export function SentBanner({ sentOn }: { sentOn: string }) {
  return (
    <div
      className="flex items-center gap-2 rounded-[12px] border px-4 py-2.5 text-[13px]"
      style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--text-2)" }}
    >
      <Lock size={14} />
      <span>
        <b style={{ color: "var(--text)" }}>Semana enviada el {formatDateEs(sentOn)}.</b> Ya no se puede cambiar.
      </span>
    </div>
  );
}

export function SetsStepper({
  label,
  times,
  onChange,
}: {
  label: string;
  times: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="inline-flex items-center rounded-[9px] border" style={{ borderColor: "var(--border-2)" }}>
      <button
        type="button"
        aria-label={`Menos series: ${label}`}
        onClick={() => onChange(Math.max(1, times - 1))}
        className="flex size-6 items-center justify-center"
        style={{ color: "var(--text-2)" }}
      >
        <Minus size={12} />
      </button>
      <span className="w-6 text-center text-[13px] font-bold tabular-nums">{times}</span>
      <button
        type="button"
        aria-label={`Más series: ${label}`}
        onClick={() => onChange(Math.min(MAX_REPEAT_TIMES, times + 1))}
        className="flex size-6 items-center justify-center"
        style={{ color: "var(--text-2)" }}
      >
        <Plus size={12} />
      </button>
    </div>
  );
}

/** Time steps in whole minutes can be lengthened or shortened per athlete (recoveries stay as written). */
function isMinuteEditable(step: WorkoutStep): boolean {
  return step.kind !== "recovery" && step.duration.kind === "time" && step.duration.seconds % 60 === 0;
}

/** Minutes stepper: 1-minute steps up to 20', 5-minute steps above. */
export function MinutesStepper({
  label,
  minutes,
  onChange,
}: {
  label: string;
  minutes: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="inline-flex items-center rounded-[9px] border" style={{ borderColor: "var(--border-2)" }}>
      <button
        type="button"
        aria-label={`Menos minutos: ${label}`}
        onClick={() => onChange(Math.max(1, minutes - (minutes > 20 ? 5 : 1)))}
        className="flex size-6 items-center justify-center"
        style={{ color: "var(--text-2)" }}
      >
        <Minus size={12} />
      </button>
      <span className="min-w-7 text-center text-[13px] font-bold tabular-nums">{minutes}&apos;</span>
      <button
        type="button"
        aria-label={`Más minutos: ${label}`}
        onClick={() => onChange(Math.min(MAX_STEP_MINUTES, minutes + (minutes >= 20 ? 5 : 1)))}
        className="flex size-6 items-center justify-center"
        style={{ color: "var(--text-2)" }}
      >
        <Plus size={12} />
      </button>
    </div>
  );
}

/** The step's length: a minutes stepper when editable, plain text otherwise. */
function StepDurationField({
  session,
  step,
  onSetMinutes,
}: {
  session: WorkoutSession;
  step: WorkoutStep;
  onSetMinutes?: (stepId: string, minutes: number) => void;
}) {
  if (onSetMinutes && isMinuteEditable(step) && step.duration.kind === "time") {
    return (
      <MinutesStepper
        label={session.name}
        minutes={step.duration.seconds / 60}
        onChange={(next) => onSetMinutes(step.id, next)}
      />
    );
  }
  return <span style={{ color: "var(--text-2)" }}>{formatStepDuration(step.duration)}</span>;
}

/** "1 km a 5:00/km", with the pace from the backend (or the % when the athlete has no marks). */
export function StepTarget({
  session,
  step,
  paces,
  onSetMinutes,
}: {
  session: WorkoutSession;
  step: WorkoutStep;
  paces?: AthletePaces;
  onSetMinutes?: (stepId: string, minutes: number) => void;
}) {
  const duration = <StepDurationField session={session} step={step} onSetMinutes={onSetMinutes} />;
  if (step.target.kind === "feel") {
    return (
      <span className="inline-flex items-center gap-1.5" style={{ color: "var(--text-2)" }}>
        {duration} · {step.target.label}
      </span>
    );
  }
  const pace = paces?.[stepKey(session.id, step.id)];
  return (
    <span className="inline-flex items-center gap-1.5">
      {duration}
      <span style={{ color: "var(--text-2)" }}>a</span>
      {pace ? (
        <>
          <b className="tabular-nums">{formatPace(pace.paceSecPerKm)}</b>
          {pace.estimated && <EstimatedTag />}
        </>
      ) : (
        <span style={{ color: "var(--text-3)" }}>{targetLabel(step.target)} · sin marcas</span>
      )}
    </span>
  );
}

/**
 * A session as one athlete does it, one line per block. With `onSetTimes`
 * the number of sets becomes editable.
 */
export function SessionLines({
  session,
  paces,
  onSetTimes,
  onSetMinutes,
  onlyKeyBlocks = false,
}: {
  session: WorkoutSession;
  paces?: AthletePaces;
  onSetTimes?: (repeatId: string, times: number) => void;
  onSetMinutes?: (stepId: string, minutes: number) => void;
  /** Hide warm-up / cool-down style lines that are the same for everyone. */
  onlyKeyBlocks?: boolean;
}) {
  const plain = describeSession(session, { paces });
  return (
    <div className="flex flex-col items-start gap-1">
      {session.nodes.map((node, i) => {
        if (node.type === "repeat") {
          const work = node.steps.filter((s) => s.kind !== "recovery");
          const recovery = node.steps.filter((s) => s.kind === "recovery");
          return (
            <div key={node.id} className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
              {onSetTimes ? (
                <SetsStepper label={session.name} times={node.times} onChange={(next) => onSetTimes(node.id, next)} />
              ) : (
                <b className="tabular-nums">{node.times}</b>
              )}
              <span style={{ color: "var(--text-2)" }}>×</span>
              {work.map((s) => (
                <StepTarget key={s.id} session={session} step={s} paces={paces} onSetMinutes={onSetMinutes} />
              ))}
              {recovery.map((s) => (
                <span key={s.id} className="text-[11.5px]" style={{ color: "var(--text-3)" }}>
                  · rec. {formatStepDuration(s.duration)}
                </span>
              ))}
            </div>
          );
        }
        if (node.target.kind === "relative") {
          return <StepTarget key={node.id} session={session} step={node} paces={paces} onSetMinutes={onSetMinutes} />;
        }
        if (onlyKeyBlocks && session.nodes.length > 1) return null;
        if (onSetMinutes && isMinuteEditable(node)) {
          return (
            <span key={node.id} className="inline-flex items-center gap-1.5 text-[12px]" style={{ color: "var(--text-2)" }}>
              <StepDurationField session={session} step={node} onSetMinutes={onSetMinutes} />
              {stepTail(session, node, paces)}
            </span>
          );
        }
        return (
          <span key={node.id} className="text-[12px]" style={{ color: "var(--text-2)" }}>
            {plain[i]}
          </span>
        );
      })}
    </div>
  );
}

/** Library picker for one day. */
export function AddSessionMenu({
  library,
  onAdd,
  newSessionHref,
  onClose,
}: {
  library: WorkoutSession[];
  onAdd: (librarySessionId: string) => Promise<ActionState>;
  newSessionHref?: string;
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  function add(librarySessionId: string) {
    startTransition(async () => {
      const result = await onAdd(librarySessionId);
      if (result.error) setError(result.error);
      else onClose();
    });
  }

  return (
    <>
      <button type="button" aria-label="Cerrar" className="fixed inset-0 z-20 cursor-default" onClick={onClose} />
      <div role="menu" className="glass-strong absolute top-full left-0 z-30 mt-1.5 flex w-[240px] flex-col gap-0.5 rounded-[14px] p-2">
        {DISCIPLINE_ORDER.map((discipline) => {
          const items = library.filter((s) => s.discipline === discipline);
          if (items.length === 0) return null;
          return (
            <div key={discipline} className="flex flex-col">
              <div
                className="px-2 pt-1.5 pb-1 text-[10.5px] font-bold tracking-[.05em] uppercase"
                style={{ color: DISCIPLINE_META[discipline].colorVar }}
              >
                {DISCIPLINE_META[discipline].label}
              </div>
              {items.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  role="menuitem"
                  disabled={pending}
                  onClick={() => add(s.id)}
                  className="rounded-[8px] px-2 py-1.5 text-left text-[12.5px] transition-colors hover:bg-[var(--surface-2)] disabled:opacity-50"
                >
                  <div className="font-semibold">{s.name}</div>
                  <div className="text-[11px]" style={{ color: "var(--text-3)" }}>
                    {sessionSummary(s)}
                  </div>
                </button>
              ))}
            </div>
          );
        })}
        {newSessionHref && (
          <>
            <div className="my-1 h-px" style={{ background: "var(--border)" }} />
            <Link
              href={newSessionHref}
              className="flex items-center gap-1.5 rounded-[8px] px-2 py-1.5 text-[12.5px] font-semibold hover:bg-[var(--surface-2)]"
              style={{ color: "var(--coral)" }}
            >
              <Plus size={13} /> Crear entreno nuevo
            </Link>
          </>
        )}
        {error && (
          <div className="px-2 text-[11.5px] font-semibold" style={{ color: "var(--danger)" }}>
            {error}
          </div>
        )}
      </div>
    </>
  );
}

/** "+ Agregar" button that opens the library picker below it. */
export function AddSessionButton({
  library,
  onAdd,
  newSessionHref,
  className,
}: {
  library: WorkoutSession[];
  onAdd: (librarySessionId: string) => Promise<ActionState>;
  newSessionHref?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`relative ${className ?? ""}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-center gap-1 rounded-[9px] border border-dashed px-3 py-1.5 text-[11.5px] font-semibold transition-colors hover:text-[var(--coral)]"
        style={{ borderColor: "var(--border-2)", color: "var(--text-3)" }}
      >
        <Plus size={12} /> Agregar
      </button>
      {open && (
        <AddSessionMenu library={library} onAdd={onAdd} newSessionHref={newSessionHref} onClose={() => setOpen(false)} />
      )}
    </div>
  );
}
