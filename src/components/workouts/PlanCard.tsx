import type { WeekPlan } from "@/lib/domain/workouts";
import { AthleteAvatar } from "@/components/athletes/AthleteAvatar";
import { WeekStrip } from "./WeekStrip";

export interface PlanCardAthlete {
  id: string;
  fullName: string;
  avatarColor: string;
}

/** A group's (or one athlete's custom) week on the overview: who, what each day, and what to do next. */
export function PlanCard({
  title,
  subtitle,
  athletes,
  plan,
  weekDates,
  actions,
}: {
  title: string;
  subtitle: React.ReactNode;
  athletes: PlanCardAthlete[];
  plan: WeekPlan | null;
  weekDates: string[];
  actions: React.ReactNode;
}) {
  return (
    <div
      className="flex flex-col gap-4 rounded-[18px] border p-5 shadow-[var(--shadow)]"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[16px] font-bold">{title}</div>
          <div className="mt-0.5 text-[12.5px]" style={{ color: "var(--text-2)" }}>
            {subtitle}
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {athletes.map((a) => (
              <span key={a.id} title={a.fullName}>
                <AthleteAvatar fullName={a.fullName} color={a.avatarColor} size={28} radius={8} />
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-start gap-2">{actions}</div>
      </div>

      {plan ? (
        <WeekStrip plan={plan} weekDates={weekDates} />
      ) : (
        <div
          className="rounded-[12px] border border-dashed py-5 text-center text-[13px]"
          style={{ borderColor: "var(--border-2)", color: "var(--text-3)" }}
        >
          Sin armar
        </div>
      )}
    </div>
  );
}
