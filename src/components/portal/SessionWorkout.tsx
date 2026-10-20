import { Repeat, StickyNote } from "lucide-react";
import type { AthletePaces, WorkoutRepeat, WorkoutSession, WorkoutStep } from "@/lib/domain/workouts";
import { stepKey } from "@/lib/domain/workouts";
import { DISCIPLINE_META } from "@/lib/domain/discipline";
import { formatDuration } from "@/lib/domain/time";
import { DISCIPLINE_ICON } from "@/components/workouts/discipline-icons";
import { EstimatedTag } from "@/components/workouts/WeekParts";

/*
 * One session as the athlete does it, laid out like the coach's builder:
 * a card per step, each repeat as a block with its steps inside, notes on
 * dashed cards. Paces come resolved from the API.
 */

/** The work itself needs no label: only the steps around it are named. */
const KIND: Record<WorkoutStep["kind"], { label?: string; color: string }> = {
  warmup: { label: "Calentamiento", color: "var(--bike)" },
  work: { color: "var(--coral)" },
  recovery: { label: "Recuperación", color: "var(--text-3)" },
  cooldown: { label: "Enfriamiento", color: "var(--swim)" },
};

/** 900 s → "15 min", 90 s → "1:30 min", 5400 s → "1 h 30 min", 400 m → "400 m", 4500 m → "4,5 km". */
function amount(duration: WorkoutStep["duration"]): string {
  if (duration.kind === "time") {
    const { seconds } = duration;
    if (seconds < 60) return `${seconds} s`;
    if (seconds % 60 !== 0) return `${formatDuration(seconds)} min`;
    const h = Math.floor(seconds / 3600);
    const m = (seconds % 3600) / 60;
    return h === 0 ? `${m} min` : `${h} h${m ? ` ${m} min` : ""}`;
  }
  return duration.meters < 1000 ? `${duration.meters} m` : `${String(duration.meters / 1000).replace(".", ",")} km`;
}

/** What the whole session adds up to: its distance and its timed parts, repeats counted. */
export function totals(session: WorkoutSession): string[] {
  let meters = 0;
  let seconds = 0;
  const add = (step: WorkoutStep, times: number) => {
    if (step.duration.kind === "distance") meters += step.duration.meters * times;
    else seconds += step.duration.seconds * times;
  };
  for (const node of session.nodes) {
    if (node.type === "step") add(node, 1);
    if (node.type === "repeat") node.steps.forEach((s) => add(s, node.times));
  }
  return [
    meters > 0 ? amount({ kind: "distance", meters: Math.round(meters) }) : null,
    seconds > 0 ? amount({ kind: "time", seconds }) : null,
  ].filter((t): t is string => t !== null);
}

/** A rest the coach wrote as a feel ("Descanso", "Pausa") is standing still. */
const isStandingRest = (step: WorkoutStep) =>
  step.kind === "recovery" && step.target.kind === "feel" && /^(descanso|descansar|pausa|parado)$/i.test(step.target.label.trim());

/**
 * `compact` sits inside another card (a day of the week): no glass of its
 * own and a smaller heading. The full one is Hoy's main card.
 */
export function SessionWorkout({
  session,
  paces,
  compact = false,
}: {
  session: WorkoutSession;
  paces: AthletePaces;
  compact?: boolean;
}) {
  const meta = DISCIPLINE_META[session.discipline];
  const Icon = DISCIPLINE_ICON[session.discipline];
  const sums = totals(session);

  return (
    <section className={compact ? "flex flex-col gap-3" : "glass flex flex-col gap-4 rounded-[24px] p-4 md:p-6"}>
      <div className={compact ? "flex items-center gap-3" : "flex items-center gap-3.5"}>
        <div
          className={
            compact
              ? "flex size-10 flex-none items-center justify-center rounded-[13px] text-white"
              : "flex size-14 flex-none items-center justify-center rounded-[18px] text-white"
          }
          style={{ background: meta.colorVar }}
        >
          <Icon size={compact ? 19 : 26} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[12px] font-bold tracking-[.06em] uppercase" style={{ color: "var(--text-2)" }}>
            {meta.label}
          </div>
          <h2
            className={
              compact
                ? "m-0 text-[17px] leading-tight font-extrabold"
                : "m-0 text-[22px] leading-tight font-extrabold tracking-[-.3px]"
            }
          >
            {session.name}
          </h2>
        </div>
      </div>

      {sums.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {sums.map((s) => (
            <span
              key={s}
              className="rounded-full border px-3 py-1 text-[13px] font-bold tabular-nums"
              style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
            >
              {s}
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {session.nodes.map((node) => {
          if (node.type === "note") {
            return (
              <div
                key={node.id}
                className="flex items-start gap-2.5 rounded-[14px] border border-dashed px-3.5 py-3 text-[14px]"
                style={{ borderColor: "var(--border-2)", color: "var(--text-2)" }}
              >
                <StickyNote size={16} className="mt-0.5 flex-none" style={{ color: "var(--text-3)" }} />
                <span className="italic">{node.text}</span>
              </div>
            );
          }
          if (node.type === "repeat") return <RepeatBlock key={node.id} session={session} repeat={node} paces={paces} />;
          return <StepCard key={node.id} session={session} step={node} paces={paces} />;
        })}
      </div>
    </section>
  );
}

function RepeatBlock({ session, repeat, paces }: { session: WorkoutSession; repeat: WorkoutRepeat; paces: AthletePaces }) {
  const total = totals({ ...session, nodes: [repeat] })[0];

  return (
    <div
      className="flex flex-col gap-2 rounded-[18px] border p-3"
      style={{ background: "var(--surface-2)", borderColor: "var(--border)", borderLeft: "4px solid var(--coral)" }}
    >
      <div className="flex items-center gap-2.5 px-1">
        <span
          className="flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-[14px] font-extrabold text-white tabular-nums"
          style={{ background: "var(--coral)" }}
        >
          {repeat.times}×
        </span>
        <div className="leading-tight">
          <div className="flex items-center gap-1.5 text-[14px] font-bold">
            <Repeat size={14} style={{ color: "var(--coral)" }} />
            Repite {repeat.times} {repeat.times === 1 ? "vez" : "veces"}
          </div>
          {total && (
            <div className="text-[12px]" style={{ color: "var(--text-3)" }}>
              {total} en total
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {repeat.steps.map((step) => (
          <StepCard key={step.id} session={session} step={step} paces={paces} />
        ))}
      </div>
    </div>
  );
}

function StepCard({ session, step, paces }: { session: WorkoutSession; step: WorkoutStep; paces: AthletePaces }) {
  const kind = KIND[step.kind];
  const pace = step.target.kind === "relative" ? paces[stepKey(session.id, step.id)] : undefined;
  const soft = step.kind === "recovery";

  return (
    <div
      className="flex items-center gap-3 rounded-[14px] border px-3.5 py-3"
      style={{ background: "var(--surface)", borderColor: "var(--border)", borderLeft: `4px solid ${kind.color}` }}
    >
      <div className="min-w-0 flex-1">
        {kind.label && (
          <div className="text-[11px] font-bold tracking-[.06em] uppercase" style={{ color: kind.color }}>
            {kind.label}
          </div>
        )}
        <div className={soft ? "text-[16px] font-bold tabular-nums" : "text-[20px] leading-tight font-extrabold tabular-nums"}>
          {isStandingRest(step) ? `Descansa ${amount(step.duration)}` : amount(step.duration)}
        </div>
      </div>

      {isStandingRest(step) ? null : step.target.kind === "feel" ? (
        <span
          className="max-w-[45%] rounded-full px-3 py-1 text-right text-[13px] font-semibold"
          style={{ background: "var(--surface-3)", color: "var(--text-2)" }}
        >
          {step.target.label}
        </span>
      ) : (
        <div className="text-right leading-tight">
          {pace ? (
            <div className="flex items-center justify-end gap-1.5">
              {pace.estimated && <EstimatedTag />}
              <span className="text-[20px] font-extrabold tabular-nums" style={{ color: soft ? undefined : "var(--coral)" }}>
                {formatDuration(pace.paceSecPerKm)}
              </span>
              <span className="text-[12px] font-semibold" style={{ color: "var(--text-3)" }}>
                /km
              </span>
            </div>
          ) : (
            // No times to compute a pace from yet: the coach's percentage is all there is.
            <div className="text-[13px] font-semibold" style={{ color: "var(--text-3)" }}>
              {step.target.percent}% de tu {step.target.reference}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
