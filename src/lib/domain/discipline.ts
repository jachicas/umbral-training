import type { Discipline } from "./types";

export interface DisciplineMeta {
  label: string;
  colorVar: string;
  tintVar: string;
  ti: string;
}

export const DISCIPLINE_META: Record<Discipline, DisciplineMeta> = {
  swim: { label: "Natación", colorVar: "var(--swim)", tintVar: "rgba(6,182,212,.12)", ti: "ti-swimming" },
  bike: { label: "Ciclismo", colorVar: "var(--bike)", tintVar: "rgba(217,132,10,.12)", ti: "ti-bike" },
  run: { label: "Carrera", colorVar: "var(--run)", tintVar: "rgba(225,87,60,.12)", ti: "ti-run" },
  gym: { label: "Gimnasio", colorVar: "var(--gym)", tintVar: "rgba(219,39,119,.12)", ti: "ti-barbell" },
};

export const DISCIPLINE_ORDER: Discipline[] = ["swim", "bike", "run", "gym"];
