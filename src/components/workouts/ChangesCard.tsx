import type { PlanChange, WorkoutStepKind } from "@/lib/domain/workouts";
import { formatDateEs } from "@/lib/domain/time";
import { dayLabel } from "./format";

const DURATION_LABEL: Record<WorkoutStepKind, string> = {
  warmup: "calentamiento",
  work: "duración",
  recovery: "recuperación",
  cooldown: "enfriamiento",
};

function describeChange(change: PlanChange): string {
  if (change.kind === "sets") return `series ${change.from} → ${change.to}`;
  if (change.kind === "duration") {
    return `${DURATION_LABEL[change.stepKind]} ${change.from / 60}' → ${change.to / 60}'`;
  }
  if (change.kind === "edited") return "editado";
  return change.kind === "added" ? "agregado" : "quitado";
}

/** Short summary of what was changed in an athlete's week compared to their group's. */
export function ChangesCard({ changes, weekDates }: { changes: PlanChange[]; weekDates: string[] }) {
  const lastOn = changes.reduce((latest, c) => (c.on > latest ? c.on : latest), changes[0].on);
  return (
    <div
      className="rounded-[16px] border px-5 py-4 shadow-[var(--shadow)]"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <div className="text-[14px] font-bold">Cambios en su semana</div>
        <div className="text-[12px]" style={{ color: "var(--text-3)" }}>
          Último cambio: {formatDateEs(lastOn)}
        </div>
      </div>
      <ul className="m-0 flex list-none flex-col gap-1 p-0 text-[13px]">
        {changes.map((c, i) => (
          <li key={i} className="flex flex-wrap gap-x-1.5">
            <span className="font-semibold tabular-nums" style={{ color: "var(--text-3)" }}>
              {dayLabel(weekDates[c.dayIndex])}
            </span>
            <span>· {c.sessionName}</span>
            <span style={{ color: c.kind === "removed" ? "var(--danger)" : "var(--modified)" }}>— {describeChange(c)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
