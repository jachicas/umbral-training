import type { WeekPlan } from "@/lib/domain/workouts";
import { DISCIPLINE_META } from "@/lib/domain/discipline";
import { dayLabel } from "./format";

/** Read-only Mon–Sun overview of a plan: one column per day with its sessions. */
export function WeekStrip({ plan, weekDates }: { plan: WeekPlan | null; weekDates: string[] }) {
  return (
    <div className="grid grid-cols-7 gap-1.5">
      {weekDates.map((date, i) => {
        const sessions = plan?.days[i] ?? [];
        return (
          <div key={date} className="flex min-w-0 flex-col gap-1">
            <div className="text-[10.5px] font-semibold tracking-[.03em] uppercase" style={{ color: "var(--text-3)" }}>
              {dayLabel(date)}
            </div>
            {sessions.map((s) => (
              <div
                key={s.id}
                title={s.name}
                className="truncate rounded-[7px] px-1.5 py-1 text-[11px] font-semibold"
                style={{
                  background: DISCIPLINE_META[s.discipline].tintVar,
                  color: DISCIPLINE_META[s.discipline].colorVar,
                }}
              >
                {s.name}
              </div>
            ))}
            {plan && sessions.length === 0 && (
              <div className="py-1 text-[11px]" style={{ color: "var(--text-3)" }}>
                Descanso
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
