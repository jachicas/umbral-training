import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CheckinOverview } from "@/lib/domain/checkins";
import { weekDatesISO } from "@/lib/domain/time";
import { weekRangeLabel } from "@/components/workouts/format";
import { CheckinSummary } from "./CheckinSummary";

const WEEKDAYS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

/** "mié 21" */
function shortDay(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()}`;
}

/**
 * The dashboard's look at the newest check-in week: whoever needs a word
 * first (the API orders them), then the rest, then who hasn't answered.
 */
export function CheckinsCard({
  overview,
  className,
  style,
}: {
  overview: CheckinOverview;
  className: string;
  style: React.CSSProperties;
}) {
  const answered = overview.rows.filter((row) => row.checkin !== null);
  const missing = overview.rows.filter((row) => row.checkin === null);

  return (
    <div className={className} style={style}>
      <div className="mb-3.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <div className="text-base font-bold">
          Check-ins · semana del {weekRangeLabel(weekDatesISO(overview.weekStart))}
        </div>
        <div className="text-[12.5px] font-semibold" style={{ color: "var(--text-2)" }}>
          <b className="tabular-nums" style={{ color: "var(--text)" }}>
            {overview.answered} de {overview.asked}
          </b>{" "}
          respondieron
          {overview.flagged > 0 && (
            <span style={{ color: "var(--danger)" }}>
              {" "}
              · {overview.flagged} para revisar
            </span>
          )}
          <span style={{ color: "var(--text-3)" }}>
            {" "}
            · {overview.status === "open" ? `abierto hasta el ${shortDay(overview.closesOn)}` : "cerrado"}
          </span>
        </div>
      </div>

      {answered.length === 0 ? (
        <div className="py-4 text-center text-[13px]" style={{ color: "var(--text-3)" }}>
          Nadie ha respondido todavía.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
          {answered.map((row) => (
            <Link
              key={row.athleteId}
              href={`/athletes/${row.athleteId}#checkins`}
              className="flex flex-col gap-1.5 rounded-[14px] border p-3 transition-colors hover:bg-[var(--surface-3)]"
              style={{
                background: "var(--surface-2)",
                borderColor: row.checkin!.flags.length ? "color-mix(in srgb, var(--danger) 45%, transparent)" : "var(--border)",
                color: "var(--text)",
              }}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="truncate text-[13.5px] font-bold">{row.fullName}</span>
                <ArrowRight size={14} className="flex-none" style={{ color: "var(--text-3)" }} />
              </span>
              <CheckinSummary checkin={row.checkin!} />
            </Link>
          ))}
        </div>
      )}

      {missing.length > 0 && (
        <div className="mt-3 text-[12.5px]" style={{ color: "var(--text-3)" }}>
          <span className="font-bold tracking-[.04em] uppercase">Sin responder:</span>{" "}
          <span style={{ color: "var(--text-2)" }}>{missing.map((row) => row.fullName).join(", ")}</span>
        </div>
      )}
    </div>
  );
}
