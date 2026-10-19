import type { Race, RaceDistanceKey, RaceSport } from "./types";

/*
 * What each kind of race asks for. The API checks it (RaceRules); this is
 * the copy the goal wizard needs to ask for it.
 */

export const RACE_SPORTS: { id: RaceSport; label: string }[] = [
  { id: "road", label: "Ruta" },
  { id: "trail", label: "Trail" },
  { id: "triathlon", label: "Triatlón" },
  { id: "duathlon", label: "Duatlón" },
  { id: "swim", label: "Natación" },
  { id: "cycling", label: "Ciclismo" },
  { id: "hyrox", label: "Hyrox" },
  { id: "other", label: "Otra" },
];

export const RACE_SPORT_LABEL = Object.fromEntries(RACE_SPORTS.map((s) => [s.id, s.label])) as Record<RaceSport, string>;

const RACE_FORMATS: Partial<Record<RaceSport, { id: string; label: string }[]>> = {
  road: [
    { id: "5k", label: "5K" },
    { id: "10k", label: "10K" },
    { id: "21k", label: "Media maratón" },
    { id: "42k", label: "Maratón" },
    { id: "other", label: "Otra distancia" },
  ],
  triathlon: [
    { id: "sprint", label: "Sprint" },
    { id: "olympic", label: "Olímpico" },
    { id: "70.3", label: "70.3" },
    { id: "140.6", label: "140.6" },
    { id: "other", label: "Otra distancia" },
  ],
  duathlon: [
    { id: "sprint", label: "Sprint" },
    { id: "standard", label: "Estándar" },
    { id: "other", label: "Otra distancia" },
  ],
  hyrox: [
    { id: "open", label: "Open" },
    { id: "pro", label: "Pro" },
    { id: "doubles", label: "Dobles" },
    { id: "relay", label: "Relevos" },
  ],
};

/** The formats a sport is run in; null when it has none (trail, swim…). */
export function raceFormats(sport: RaceSport): { id: string; label: string }[] | null {
  return RACE_FORMATS[sport] ?? null;
}

export interface RaceDistanceField {
  key: RaceDistanceKey;
  label: string;
  unit: string;
  required: boolean;
}

const field = (key: RaceDistanceKey, label: string, unit: string, required = true): RaceDistanceField => ({
  key,
  label,
  unit,
  required,
});

/** The distances a race asks for, given its sport and format. */
export function raceDistanceFields(sport: RaceSport, format?: string): RaceDistanceField[] {
  switch (sport) {
    case "road":
      return format === "other" ? [field("km", "Distancia", "km")] : [];
    case "trail":
    case "cycling":
      return [field("km", "Distancia", "km"), field("elevationM", "Desnivel +", "m", false)];
    case "triathlon":
      return format === "other"
        ? [field("swimKm", "Natación", "km"), field("bikeKm", "Bici", "km"), field("runKm", "Carrera", "km")]
        : [];
    case "duathlon":
      return format === "other"
        ? [field("run1Km", "Carrera 1", "km"), field("bikeKm", "Bici", "km"), field("run2Km", "Carrera 2", "km")]
        : [];
    case "swim":
      return [field("meters", "Distancia", "m")];
    case "hyrox":
      return [];
    case "other":
      return [field("km", "Distancia", "km", false)];
  }
}

/** Road and trail races aim for a pace; every other sport for a finish time. */
export function raceAimsForPace(sport: RaceSport): boolean {
  return sport === "road" || sport === "trail";
}

const km = (n: number) => `${String(n).replace(".", ",")} km`;

/** "Trail · 21,5 km · 1200 m+", "Triatlón · 70.3", "Natación · 3000 m". */
export function raceSummary(race: Pick<Race, "sport" | "sportLabel" | "format" | "distances">): string {
  const sport = race.sport === "other" && race.sportLabel ? race.sportLabel : RACE_SPORT_LABEL[race.sport];
  const d = race.distances ?? {};
  const parts = [sport];

  if (race.format && race.format !== "other") {
    parts.push(raceFormats(race.sport)?.find((f) => f.id === race.format)?.label ?? race.format);
  }
  if (d.swimKm !== undefined && d.bikeKm !== undefined && d.runKm !== undefined) {
    parts.push(`${d.swimKm} / ${d.bikeKm} / ${d.runKm} km`);
  } else if (d.run1Km !== undefined && d.bikeKm !== undefined && d.run2Km !== undefined) {
    parts.push(`${d.run1Km} / ${d.bikeKm} / ${d.run2Km} km`);
  } else if (d.meters !== undefined) {
    parts.push(`${d.meters} m`);
  } else if (d.km !== undefined) {
    parts.push(km(d.km));
  }
  if (d.elevationM) parts.push(`${d.elevationM} m+`);

  return parts.join(" · ");
}

/** Lowercase without accents, so "maraton" finds "Maratón". */
export function normalizeRaceName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}
