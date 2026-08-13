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

const MONTHS_ES = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

export function formatDateEs(dateISO: string): string {
  const d = new Date(dateISO + "T00:00:00");
  return `${d.getDate()} ${MONTHS_ES[d.getMonth()]} ${d.getFullYear()}`;
}
