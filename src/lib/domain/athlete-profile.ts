import type { AthleteSex, AthleteThresholds, Discipline, ExperienceLevel } from "./types";

export const EXPERIENCE_LEVEL_LABEL: Record<ExperienceLevel, string> = {
  beginner: "Principiante",
  intermediate: "Intermedio",
  advanced: "Avanzado",
};

export const EXPERIENCE_LEVEL_ORDER: ExperienceLevel[] = ["beginner", "intermediate", "advanced"];

export const ATHLETE_SEX_LABEL: Record<AthleteSex, string> = {
  male: "Masculino",
  female: "Femenino",
};

/** True once at least one threshold relevant to the athlete's disciplines is set. */
export function hasAnyThreshold(thresholds: AthleteThresholds | undefined): boolean {
  if (!thresholds) return false;
  return Object.values(thresholds).some((v) => v !== undefined);
}

/** Which threshold fields are worth asking for, given the disciplines trained. */
export function relevantThresholdFields(disciplines: Discipline[]): {
  run: boolean;
  bike: boolean;
  swim: boolean;
} {
  return {
    run: disciplines.includes("run"),
    bike: disciplines.includes("bike"),
    swim: disciplines.includes("swim"),
  };
}
