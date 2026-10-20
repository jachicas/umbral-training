import type { Metadata } from "next";
import { Flag, MapPin } from "lucide-react";
import { getPortalHome } from "@/lib/services/portal";
import { goalTarget, isRaceGoalDefined, raceCountdown } from "@/lib/domain/goals";
import { raceSummary } from "@/lib/domain/races";
import { historyFor, latestRecordFor } from "@/lib/domain/records";
import { RACE_REFERENCES, formatDateEs, formatDuration } from "@/lib/domain/time";
import { formatPace } from "@/components/workouts/format";
import { EstimatedTag } from "@/components/workouts/WeekParts";
import { Sparkline } from "@/components/athletes/Sparkline";
import { PortalCard, PortalLabel } from "@/components/portal/PortalShell";

export const metadata: Metadata = { title: "Mi progreso · Umbral Training" };

/** The athlete's race goal and their reference times, the ones their paces come from. */
export default async function PortalProgressPage() {
  const { goal, records, referencePaces, today } = await getPortalHome();
  const race = goal && isRaceGoalDefined(goal) ? goal : null;
  const countdown = race ? raceCountdown(race, new Date(today + "T00:00:00")) : null;
  const target = race ? goalTarget(race) : null;
  const history = [...records].reverse();

  return (
    <>
      <h1 className="m-0 px-1 pt-1 text-[26px] font-extrabold tracking-[-.5px]">Progreso</h1>

      <PortalCard>
        <PortalLabel>Objetivo</PortalLabel>
        {race ? (
          <div className="mt-3 flex flex-wrap items-start gap-4">
            <div
              className="flex size-12 flex-none items-center justify-center rounded-[14px]"
              style={{ background: "var(--coral-tint)", color: "var(--coral)" }}
            >
              <Flag size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[19px] font-extrabold tracking-tight">{race.raceName}</div>
              <div className="mt-0.5 text-[13px]" style={{ color: "var(--text-2)" }}>
                {race.race ? `${raceSummary(race.race)} · ` : ""}
                {formatDateEs(race.raceDate!)}
              </div>
              {race.race?.location && (
                <div className="mt-1 flex items-center gap-1 text-[12.5px]" style={{ color: "var(--text-3)" }}>
                  <MapPin size={13} /> {race.race.location}
                </div>
              )}
            </div>
            <div className="flex gap-5">
              {countdown && (
                <Stat
                  value={countdown.status === "upcoming" ? String(countdown.days) : countdown.status === "today" ? "¡Hoy!" : "—"}
                  label={countdown.status === "upcoming" ? (countdown.days === 1 ? "día" : "días") : countdown.status === "past" ? "ya pasó" : "es la carrera"}
                />
              )}
              {target && target.value !== "—" && <Stat value={target.value} label={target.label} />}
            </div>
          </div>
        ) : (
          <p className="mt-2 mb-0 text-[14px]" style={{ color: "var(--text-2)" }}>
            Sin carrera por ahora: tu coach te tiene en <b style={{ color: "var(--text)" }}>mantenimiento</b>.
          </p>
        )}
      </PortalCard>

      <PortalCard>
        <PortalLabel>Tus marcas</PortalLabel>
        <div className="mt-3 grid grid-cols-2 gap-2.5 md:grid-cols-4">
          {RACE_REFERENCES.map((reference) => {
            const latest = latestRecordFor(records, reference);
            const pace = referencePaces[reference];
            const values = historyFor(records, reference).map((r) => r.timeSeconds);
            return (
              <div
                key={reference}
                className="flex flex-col gap-1 rounded-[16px] border p-3.5"
                style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
              >
                <div className="text-[12px] font-bold uppercase" style={{ color: "var(--text-3)" }}>
                  {reference}
                </div>
                {latest ? (
                  <>
                    <div className="text-[21px] font-extrabold tabular-nums">{formatDuration(latest.timeSeconds)}</div>
                    <div className="text-[12px]" style={{ color: "var(--text-2)" }}>
                      {pace ? formatPace(pace.paceSecPerKm) : ""} · {formatDateEs(latest.recordedOn)}
                    </div>
                    <div className="mt-1">
                      <Sparkline values={values} color="var(--coral)" />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-[21px] font-extrabold" style={{ color: "var(--text-3)" }}>
                      —
                    </div>
                    {pace ? (
                      <div className="flex items-center gap-1.5 text-[12px]" style={{ color: "var(--text-2)" }}>
                        {formatPace(pace.paceSecPerKm)} <EstimatedTag />
                      </div>
                    ) : (
                      <div className="text-[12px]" style={{ color: "var(--text-3)" }}>
                        Sin marca
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
        {Object.values(referencePaces).some((p) => p?.estimated) && (
          <p className="mt-3 mb-0 text-[12px]" style={{ color: "var(--text-3)" }}>
            <EstimatedTag /> estimada a partir de otra de tus marcas.
          </p>
        )}
      </PortalCard>

      {history.length > 0 && (
        <PortalCard>
          <PortalLabel>Historial</PortalLabel>
          <ul className="mt-2 mb-0 flex list-none flex-col p-0">
            {history.map((record, i) => (
              <li
                key={record.id}
                className="flex items-center gap-3 py-2.5 text-[13.5px]"
                style={i > 0 ? { borderTop: "1px solid var(--border)" } : undefined}
              >
                <span className="w-10 font-bold uppercase" style={{ color: "var(--text-2)" }}>
                  {record.reference}
                </span>
                <span className="font-bold tabular-nums">{formatDuration(record.timeSeconds)}</span>
                <span className="min-w-0 flex-1 truncate" style={{ color: "var(--text-3)" }}>
                  {record.note ?? ""}
                </span>
                <span className="text-[12.5px] tabular-nums" style={{ color: "var(--text-2)" }}>
                  {formatDateEs(record.recordedOn)}
                </span>
              </li>
            ))}
          </ul>
        </PortalCard>
      )}
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-right">
      <div className="text-[24px] leading-none font-extrabold tabular-nums">{value}</div>
      <div className="mt-1 text-[11.5px]" style={{ color: "var(--text-3)" }}>
        {label}
      </div>
    </div>
  );
}
