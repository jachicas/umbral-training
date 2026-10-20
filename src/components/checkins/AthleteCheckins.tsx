import type { WeeklyCheckin } from "@/lib/domain/checkins";
import { feelingMeta } from "@/lib/domain/checkins";
import { weekDatesISO } from "@/lib/domain/time";
import { weekRangeLabel } from "@/components/workouts/format";
import { CheckinSummary } from "./CheckinSummary";

/** How many weeks the trend strip shows. */
const TREND_WEEKS = 8;

/**
 * The athlete page's check-ins: a strip of the last weeks (mood over effort)
 * to spot fatigue piling up, then each answer, newest first.
 */
export function AthleteCheckins({ checkins }: { checkins: WeeklyCheckin[] }) {
  const trend = checkins.slice(0, TREND_WEEKS).reverse();

  return (
    <div
      id="checkins"
      className="scroll-mt-24 rounded-[18px] border p-[22px] shadow-[var(--shadow)]"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div className="mb-3 text-base font-bold">Check-ins semanales</div>
      {checkins.length === 0 ? (
        <p className="py-2 text-[13.5px] italic" style={{ color: "var(--text-3)" }}>
          Sin check-ins todavía.
        </p>
      ) : (
        <>
          {trend.length > 1 && (
            <div className="mb-4 flex items-end gap-2 overflow-x-auto pb-1" aria-label="Ánimo y esfuerzo de las últimas semanas">
              {trend.map((c) => (
                <div key={c.weekStart} className="flex w-11 flex-none flex-col items-center gap-1">
                  <span className="text-[18px] leading-none" title={feelingMeta(c.feeling).label}>
                    {feelingMeta(c.feeling).emoji}
                  </span>
                  <div className="flex h-12 w-3 items-end overflow-hidden rounded-full" style={{ background: "var(--surface-3)" }}>
                    <div
                      className="w-full rounded-full"
                      style={{
                        height: `${c.effort * 10}%`,
                        background: c.effort >= 8 ? "var(--danger)" : "var(--coral)",
                      }}
                    />
                  </div>
                  <span className="text-[11px] font-bold tabular-nums" style={{ color: "var(--text-2)" }}>
                    {c.effort}
                  </span>
                  <span className="text-[10px] whitespace-nowrap" style={{ color: "var(--text-3)" }}>
                    {Number(c.weekStart.slice(8))}/{Number(c.weekStart.slice(5, 7))}
                  </span>
                </div>
              ))}
            </div>
          )}
          <div className="flex flex-col">
            {checkins.map((c) => (
              <div key={c.weekStart} className="flex flex-col gap-1 border-b py-3 last:border-b-0" style={{ borderColor: "var(--border)" }}>
                <div className="text-[12px] font-bold tracking-[.04em] uppercase" style={{ color: "var(--text-3)" }}>
                  Semana del {weekRangeLabel(weekDatesISO(c.weekStart))}
                </div>
                <CheckinSummary checkin={c} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
