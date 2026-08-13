import type { RaceRecord, RaceReference } from "./types";

/** Records for a reference, oldest first (for sparklines / evolution). */
export function historyFor(records: RaceRecord[], reference: RaceReference): RaceRecord[] {
  return records
    .filter((r) => r.reference === reference)
    .sort((a, b) => a.recordedOn.localeCompare(b.recordedOn));
}

/** Most recent record for a reference, or null if the athlete has none yet. */
export function latestRecordFor(records: RaceRecord[], reference: RaceReference): RaceRecord | null {
  const history = historyFor(records, reference);
  return history.length ? history[history.length - 1] : null;
}
