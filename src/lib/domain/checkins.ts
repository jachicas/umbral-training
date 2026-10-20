/*
 * The weekly check-in, as the API serves it: at the end of each week the coach
 * sent, the athlete says how they felt, how hard it was, how much they did and
 * whether anything hurts. The API decides when it opens and closes, who is
 * asked and what gets flagged; this file only holds the shapes and their labels.
 */

export type CheckinCompletion = "all" | "most" | "few";

/** What in an answer the coach should look at, worst first. */
export type CheckinFlag = "pain" | "effort" | "feeling" | "completion";

/** `upcoming` before the week's Sunday, `open` until the Wednesday after, then `closed`. */
export type CheckinStatus = "upcoming" | "open" | "closed";

export interface WeeklyCheckin {
  /** The week's Monday. */
  weekStart: string;
  /** 1 (awful) to 5 (great). */
  feeling: number;
  /** Perceived effort, 1 to 10. */
  effort: number;
  completion: CheckinCompletion;
  pain: boolean;
  painNote?: string;
  comment?: string;
  flags: CheckinFlag[];
  submittedAt?: string;
}

/** A week's check-in as the athlete sees it. */
export interface PortalCheckin {
  status: CheckinStatus;
  opensOn: string;
  closesOn: string;
  answer: WeeklyCheckin | null;
}

export interface CheckinInput {
  feeling: number;
  effort: number;
  completion: CheckinCompletion;
  pain: boolean;
  painNote?: string;
  comment?: string;
}

/** One athlete asked about the week, with their answer or null. */
export interface CheckinRow {
  athleteId: string;
  fullName: string;
  checkin: WeeklyCheckin | null;
}

/** The coach's view of the newest check-in week: flagged first, then the rest, then who hasn't answered. */
export interface CheckinOverview {
  weekStart: string;
  opensOn: string;
  closesOn: string;
  status: CheckinStatus;
  asked: number;
  answered: number;
  flagged: number;
  rows: CheckinRow[];
}

export const FEELINGS: { value: number; emoji: string; label: string }[] = [
  { value: 1, emoji: "😫", label: "Muy mal" },
  { value: 2, emoji: "😕", label: "Mal" },
  { value: 3, emoji: "😐", label: "Normal" },
  { value: 4, emoji: "🙂", label: "Bien" },
  { value: 5, emoji: "😄", label: "Muy bien" },
];

export function feelingMeta(value: number) {
  return FEELINGS.find((f) => f.value === value) ?? FEELINGS[2];
}

/** How a perceived effort reads (the RPE scale). */
export function effortLabel(effort: number): string {
  if (effort <= 3) return "Suave";
  if (effort <= 6) return "Moderada";
  if (effort <= 8) return "Dura";
  return "Al máximo";
}

export const COMPLETION_LABEL: Record<CheckinCompletion, string> = {
  all: "Todos",
  most: "Casi todos",
  few: "Pocos",
};

export const FLAG_LABEL: Record<CheckinFlag, string> = {
  pain: "Molestia",
  effort: "Semana muy dura",
  feeling: "Ánimo bajo",
  completion: "Hizo pocos entrenos",
};
