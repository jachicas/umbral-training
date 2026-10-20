import {
  COMPLETION_LABEL,
  FLAG_LABEL,
  effortLabel,
  feelingMeta,
  type WeeklyCheckin,
} from "@/lib/domain/checkins";

/** One check-in at a glance for the coach: mood, effort, sessions done, what to look at, and their words. */
export function CheckinSummary({ checkin }: { checkin: WeeklyCheckin }) {
  const feeling = feelingMeta(checkin.feeling);
  // Pain gets its own line with where it hurts.
  const flags = checkin.flags.filter((flag) => flag !== "pain");

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px]" style={{ color: "var(--text-2)" }}>
        <span className="text-[16px] leading-none" aria-hidden>
          {feeling.emoji}
        </span>
        <span className="font-semibold" style={{ color: "var(--text)" }}>
          {feeling.label}
        </span>
        <span>·</span>
        <span className="tabular-nums">
          Esfuerzo {checkin.effort}/10 ({effortLabel(checkin.effort).toLowerCase()})
        </span>
        <span>·</span>
        <span>Entrenos: {COMPLETION_LABEL[checkin.completion].toLowerCase()}</span>
      </div>
      {(checkin.pain || flags.length > 0) && (
        <div className="flex flex-wrap gap-1.5">
          {checkin.pain && <Flag>Molestia: {checkin.painNote}</Flag>}
          {flags.map((flag) => (
            <Flag key={flag}>{FLAG_LABEL[flag]}</Flag>
          ))}
        </div>
      )}
      {checkin.comment && (
        <p className="m-0 text-[12.5px] italic" style={{ color: "var(--text-2)" }}>
          “{checkin.comment}”
        </p>
      )}
    </div>
  );
}

function Flag({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="rounded-md px-2 py-0.5 text-[11.5px] font-bold"
      style={{ background: "color-mix(in srgb, var(--danger) 14%, transparent)", color: "var(--danger)" }}
    >
      {children}
    </span>
  );
}
