import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { AthleteAvatar } from "@/components/athletes/AthleteAvatar";
import { RACE_REFERENCES, REFERENCE_DISTANCE_KM, formatDateEs, formatDuration, formatPacePerKm } from "@/lib/domain/time";
import type { RaceReference } from "@/lib/domain/types";
import { bestOver, type RecordAthleteVM } from "./types";

export interface RecentMarkVM {
  id: string;
  athleteId: string;
  fullName: string;
  avatarColor: string;
  reference: RaceReference;
  timeSeconds: number;
  recordedOn: string;
}

const cardClass = "min-w-0 rounded-[18px] border shadow-[var(--shadow)]";
const cardStyle = { background: "var(--surface)", borderColor: "var(--border)" };
const statLabelClass = "text-[11.5px] font-semibold tracking-[.06em] uppercase";

/** /records: how far each distance is filled in, the latest times, and who has none yet. */
export function RecordsOverview({ athletes, recent }: { athletes: RecordAthleteVM[]; recent: RecentMarkVM[] }) {
  const withoutAny = athletes.filter((a) => Object.keys(a.latest).length === 0);

  return (
    <div className="flex flex-col gap-[22px]">
      <h1 className="m-0 text-[24px] font-bold tracking-[-.4px]">Marcas</h1>

      <section aria-label="Distancias" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {RACE_REFERENCES.map((r) => (
          <DistanceCard key={r} reference={r} athletes={athletes} />
        ))}
      </section>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1.7fr_1fr]">
        <section className={`${cardClass} py-2`} style={cardStyle}>
          <h2 className="m-0 px-5 pt-3 pb-2.5 text-[15px] font-bold">Últimas marcas</h2>
          {recent.map((m) => (
            <div
              key={m.id}
              className="grid grid-cols-[minmax(0,1fr)_52px_72px] items-center gap-3 border-t px-5 py-[11px] text-[13.5px] sm:grid-cols-[minmax(0,1fr)_52px_72px_96px_88px]"
              style={{ borderColor: "var(--border)" }}
            >
              <Link href={`/athletes/${m.athleteId}`} className="flex min-w-0 items-center gap-2.5 font-semibold text-inherit">
                <AthleteAvatar fullName={m.fullName} color={m.avatarColor} size={30} radius={999} className="text-[11.5px]" />
                <span className="truncate">{m.fullName}</span>
              </Link>
              <DistancePill reference={m.reference} />
              <span className="font-bold tabular-nums">{formatDuration(m.timeSeconds)}</span>
              <span className="hidden tabular-nums sm:block" style={{ color: "var(--text-2)" }}>
                {formatPacePerKm(m.timeSeconds / REFERENCE_DISTANCE_KM[m.reference])}
              </span>
              <span className="hidden text-right sm:block" style={{ color: "var(--text-2)" }}>
                {formatDateEs(m.recordedOn)}
              </span>
            </div>
          ))}
        </section>

        <section className={`${cardClass} py-2`} style={cardStyle}>
          <div className="flex items-center justify-between px-5 pt-3 pb-2.5">
            <h2 className="m-0 text-[15px] font-bold">Sin ninguna marca</h2>
            <span
              className="inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-[12px] font-bold"
              style={{ background: "color-mix(in srgb, var(--pend) 16%, transparent)", color: "var(--pend)" }}
            >
              {withoutAny.length}
            </span>
          </div>
          {withoutAny.map((a) => (
            <Link
              key={a.id}
              href={`/athletes/${a.id}`}
              className="flex items-center gap-2.5 border-t px-5 py-[11px] text-[13.5px] font-semibold text-inherit transition-colors hover:bg-[var(--surface-2)]"
              style={{ borderColor: "var(--border)" }}
            >
              <AthleteAvatar fullName={a.fullName} color={a.avatarColor} size={30} radius={999} className="text-[11.5px]" />
              <span className="min-w-0 flex-1 truncate">{a.fullName}</span>
              <ChevronRight size={16} aria-hidden style={{ color: "var(--text-3)" }} />
            </Link>
          ))}
        </section>
      </div>
    </div>
  );
}

function DistanceCard({ reference, athletes }: { reference: RaceReference; athletes: RecordAthleteVM[] }) {
  const total = athletes.length;
  const have = athletes.filter((a) => a.latest[reference]).length;
  const best = bestOver(athletes, reference);

  return (
    <Link
      href={`/records/${reference}`}
      className={`${cardClass} flex flex-col gap-[18px] p-5 text-inherit transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)] hover:text-inherit`}
      style={cardStyle}
    >
      <div className="flex items-baseline justify-between">
        <span className="text-[34px] leading-none font-extrabold tracking-[-.04em]">{reference.toUpperCase()}</span>
        <ChevronRight size={18} aria-hidden style={{ color: "var(--text-2)" }} />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-[13px]" style={{ color: "var(--text-2)" }}>
          <span>Con marca</span>
          <span className="font-bold tabular-nums" style={{ color: "var(--text)" }}>
            {have} / {total}
          </span>
        </div>
        <CoverageBar have={have} total={total} />
      </div>
      <div className="grid grid-cols-2 gap-3 border-t pt-3.5" style={{ borderColor: "var(--border)" }}>
        <div className="min-w-0">
          <div className={statLabelClass} style={{ color: "var(--text-3)" }}>
            Mejor
          </div>
          <div className="mt-1 text-[19px] font-bold tabular-nums">{best ? formatDuration(best.mark.timeSeconds) : "—"}</div>
          {best && (
            <div className="truncate text-[12.5px]" style={{ color: "var(--text-2)" }}>
              {best.athlete.fullName}
            </div>
          )}
        </div>
        <div>
          <div className={statLabelClass} style={{ color: "var(--text-3)" }}>
            Sin marca
          </div>
          <div className="mt-1 text-[19px] font-bold tabular-nums" style={{ color: "var(--pend)" }}>
            {total - have}
          </div>
        </div>
      </div>
    </Link>
  );
}

export function CoverageBar({ have, total }: { have: number; total: number }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full" style={{ background: "var(--surface-3)" }}>
      <div
        className="h-full rounded-full"
        style={{ width: `${total ? Math.round((have / total) * 100) : 0}%`, background: "var(--coral)" }}
      />
    </div>
  );
}

function DistancePill({ reference }: { reference: RaceReference }) {
  return (
    <span
      className="justify-self-start rounded-full px-2 py-[3px] text-[12px] font-bold"
      style={{ background: "var(--surface-3)" }}
    >
      {reference.toUpperCase()}
    </span>
  );
}
