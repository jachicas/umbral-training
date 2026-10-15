import type { RaceReference } from "./types";

export const REFERENCE_DISTANCE_KM: Record<RaceReference, number> = {
  "1k": 1,
  "5k": 5,
  "10k": 10,
  "21k": 21.0975,
};

export const RACE_REFERENCES: RaceReference[] = ["1k", "5k", "10k", "21k"];

/** "mm:ss" under an hour, "h:mm:ss" beyond. */
export function formatDuration(totalSeconds: number): string {
  const seconds = Math.round(totalSeconds);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Pace in seconds/km rendered as "m:ss". */
export function formatPacePerKm(secondsPerKm: number): string {
  return `${formatDuration(secondsPerKm)} /km`;
}

/**
 * Inverse of `formatDuration` — accepts "mm:ss" or "h:mm:ss" (and a bare
 * "ss"), returning null on anything unparseable so callers can surface a
 * field error instead of storing a NaN.
 */
export function parseDuration(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const parts = trimmed.split(":");
  if (parts.length > 3) return null;
  if (!parts.every((p) => /^\d{1,2}$/.test(p))) return null;

  const numbers = parts.map(Number);
  // Only the leading unit may exceed 59 — "1:75:00" is a typo, not 2h15m.
  if (numbers.slice(1).some((n) => n > 59)) return null;

  return numbers.reduce((total, n) => total * 60 + n, 0);
}

export function computePaceSecondsPerKm(
  timeSeconds: number,
  reference: RaceReference
): number {
  return timeSeconds / REFERENCE_DISTANCE_KM[reference];
}

/** Whole days between `from` (default now) and an ISO date; negative if in the past. */
export function daysUntil(dateISO: string, from: Date = new Date()): number {
  const target = new Date(dateISO + "T00:00:00");
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const diffMs = target.getTime() - today.getTime();
  return Math.round(diffMs / 86_400_000);
}

/** Local calendar date as "YYYY-MM-DD" (no UTC shift). */
export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function addDaysISO(dateISO: string, days: number): string {
  const d = new Date(dateISO + "T00:00:00");
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

/** Monday of the week containing `dateISO` (weeks run Monday–Sunday). */
export function mondayOfISO(dateISO: string): string {
  const d = new Date(dateISO + "T00:00:00");
  return addDaysISO(dateISO, -((d.getDay() + 6) % 7));
}

/** The seven dates of the week starting on `mondayISO`. */
export function weekDatesISO(mondayISO: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDaysISO(mondayISO, i));
}

const MONTHS_ES = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

export function formatDateEs(dateISO: string): string {
  const d = new Date(dateISO + "T00:00:00");
  return `${d.getDate()} ${MONTHS_ES[d.getMonth()]} ${d.getFullYear()}`;
}
