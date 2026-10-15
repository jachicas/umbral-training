import type {
  AthletePaces,
  IntensityTarget,
  ResolvedPace,
  StepDuration,
  WeekPlan,
  WorkoutSession,
  WorkoutStep,
} from "@/lib/domain/workouts";
import { sessionRepeats, stepKey } from "@/lib/domain/workouts";
import { formatDuration } from "@/lib/domain/time";

/* Display-only helpers: they turn plans + backend-resolved paces into Spanish copy. */

const WEEKDAYS_ES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS_ES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function parseISO(dateISO: string): Date {
  return new Date(dateISO + "T00:00:00");
}

/** "Mar 13" */
export function dayLabel(dateISO: string): string {
  const d = parseISO(dateISO);
  return `${WEEKDAYS_ES[d.getDay()]} ${d.getDate()}`;
}

/** "12–18 oct", or "28 sep – 4 oct" across months. */
export function weekRangeLabel(weekDates: string[]): string {
  const first = parseISO(weekDates[0]);
  const last = parseISO(weekDates[weekDates.length - 1]);
  if (first.getMonth() === last.getMonth()) {
    return `${first.getDate()}–${last.getDate()} ${MONTHS_ES[last.getMonth()]}`;
  }
  return `${first.getDate()} ${MONTHS_ES[first.getMonth()]} – ${last.getDate()} ${MONTHS_ES[last.getMonth()]}`;
}

/** 900 s → "15'", 90 s → "1:30", 400 m → "400 m", 16000 m → "16 km". */
export function formatStepDuration(duration: StepDuration): string {
  if (duration.kind === "time") {
    return duration.seconds % 60 === 0 ? `${duration.seconds / 60}'` : formatDuration(duration.seconds);
  }
  if (duration.meters < 1000) return `${duration.meters} m`;
  return `${Number((duration.meters / 1000).toFixed(1))} km`;
}

export function formatPace(paceSecPerKm: number): string {
  return `${formatDuration(paceSecPerKm)}/km`;
}

/** "85% del 1k" or the feel label as written by the coach. */
export function targetLabel(target: IntensityTarget): string {
  return target.kind === "relative" ? `${target.percent}% del ${target.reference}` : target.label;
}

/** "Suave" → "suave", but acronyms like "RPE 7" or "Z2" stay as written. */
function lowerFirst(text: string): string {
  if (/^[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ0-9]/.test(text)) return text;
  return text.charAt(0).toLowerCase() + text.slice(1);
}

function targetPhrase(target: IntensityTarget, pace?: ResolvedPace): string {
  if (target.kind === "feel") return lowerFirst(target.label);
  return pace ? `a ${formatPace(pace.paceSecPerKm)}` : `al ${targetLabel(target)}`;
}

const KIND_WORD: Record<WorkoutStep["kind"], string> = {
  warmup: "calentamiento",
  work: "",
  recovery: "recuperación",
  cooldown: "enfriamiento",
};

export interface AthleteView {
  paces?: AthletePaces;
}

/** A step's phrase without its duration: "calentamiento suave", "a 4:30/km". */
export function stepTail(session: WorkoutSession, step: WorkoutStep, paces?: AthletePaces): string {
  const pace = paces?.[stepKey(session.id, step.id)];
  return [KIND_WORD[step.kind], targetPhrase(step.target, pace)].filter(Boolean).join(" ");
}

function stepPhrase(session: WorkoutSession, step: WorkoutStep, paces?: AthletePaces): string {
  return `${formatStepDuration(step.duration)} ${stepTail(session, step, paces)}`;
}

/**
 * One line per block, e.g. "10 × 400 m a 4:30/km · rec. 1' trote".
 * Without athlete paces it reads as the coach wrote it ("al 85% del 1k").
 */
export function describeSession(session: WorkoutSession, view: AthleteView = {}): string[] {
  return session.nodes.map((node) => {
    if (node.type === "note") return node.text;
    if (node.type === "step") return stepPhrase(session, node, view.paces);
    const work = node.steps.filter((s) => s.kind !== "recovery").map((s) => stepPhrase(session, s, view.paces));
    const recovery = node.steps
      .filter((s) => s.kind === "recovery")
      .map((s) => `rec. ${formatStepDuration(s.duration)} ${targetPhrase(s.target)}`);
    return [`${node.times} × ${work.join(" + ")}`, ...recovery].join(" · ");
  });
}

/** Compact one-liner for a day card: "10 × 400 m · 85% del 1k". */
export function sessionSummary(session: WorkoutSession): string {
  const repeat = sessionRepeats(session)[0];
  const firstStep = session.nodes.find((n): n is WorkoutStep => n.type === "step");
  const mainStep = repeat ? repeat.steps[0] : firstStep;
  if (!mainStep) {
    // Only notes (e.g. a stretching session): show the first one.
    const note = session.nodes.find((n) => n.type === "note");
    return note && note.type === "note" ? note.text : "";
  }
  const amount = repeat
    ? `${repeat.times} × ${formatStepDuration(mainStep.duration)}`
    : formatStepDuration(mainStep.duration);
  return `${amount} · ${targetLabel(mainStep.target)}`;
}

/** WhatsApp-ready text for one athlete's week (`*bold*` is WhatsApp markup). */
export function weekMessage(
  athleteName: string,
  weekDates: string[],
  plan: WeekPlan,
  view: AthleteView
): string {
  const firstName = athleteName.trim().split(/\s+/)[0];
  const days = plan.days.map((sessions, i) => {
    const date = weekDates[i];
    if (sessions.length === 0) return `*${dayLabel(date)}* · Descanso`;
    return sessions
      .map((session) =>
        [`*${dayLabel(date)}* · ${session.name}`, ...describeSession(session, view).map((l) => `• ${l}`)].join("\n")
      )
      .join("\n\n");
  });
  return [`Hola ${firstName} 👋 Tu semana del ${weekRangeLabel(weekDates)}:`, ...days].join("\n\n");
}

/** "1 atleta" / "3 atletas" */
export function countLabel(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`;
}
