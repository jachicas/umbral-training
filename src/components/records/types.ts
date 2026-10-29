import { latestRecordFor } from "@/lib/domain/records";
import { RACE_REFERENCES } from "@/lib/domain/time";
import type { AthleteDetail, RaceReference } from "@/lib/domain/types";

export interface MarkVM {
  timeSeconds: number;
  recordedOn: string;
}

export interface RecordAthleteVM {
  id: string;
  fullName: string;
  avatarColor: string;
  /** Latest time per distance: the one paces come from. */
  latest: Partial<Record<RaceReference, MarkVM>>;
}

export function toRecordAthlete(d: AthleteDetail): RecordAthleteVM {
  const latest: RecordAthleteVM["latest"] = {};
  for (const r of RACE_REFERENCES) {
    const record = latestRecordFor(d.records, r);
    if (record) latest[r] = { timeSeconds: record.timeSeconds, recordedOn: record.recordedOn };
  }
  return { id: d.athlete.id, fullName: d.athlete.fullName, avatarColor: d.athlete.avatarColor, latest };
}

/** The fastest of the athletes' current times over a distance. */
export function bestOver(athletes: RecordAthleteVM[], reference: RaceReference) {
  let best: { athlete: RecordAthleteVM; mark: MarkVM } | null = null;
  for (const athlete of athletes) {
    const mark = athlete.latest[reference];
    if (mark && (!best || mark.timeSeconds < best.mark.timeSeconds)) best = { athlete, mark };
  }
  return best;
}
