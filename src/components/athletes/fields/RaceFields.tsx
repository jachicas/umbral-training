"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { RACE_SPORTS, normalizeRaceName, raceDistanceFields, raceFormats } from "@/lib/domain/races";
import { formatDateEs } from "@/lib/domain/time";
import type { Race, RaceDistanceKey, RaceSport } from "@/lib/domain/types";
import type { RaceFormInput, ValidationField } from "@/lib/services/athletes";
import { FieldError } from "./FieldError";
import { Segmented } from "./Segmented";

type Errors = Partial<Record<ValidationField, string>>;

/** A race as the coach types it: every value a string until the services parse it. */
export interface RaceDraft {
  name: string;
  date: string;
  location: string;
  sport: RaceSport;
  sportLabel: string;
  format: string;
  distances: Partial<Record<RaceDistanceKey, string>>;
}

export const blankRace = (name = ""): RaceDraft => ({
  name,
  date: "",
  location: "",
  sport: "road",
  sportLabel: "",
  format: "10k",
  distances: {},
});

/** A catalog race back as a draft, to edit it. */
export function draftOf(race: Race): RaceDraft {
  return {
    name: race.name,
    date: race.date,
    location: race.location ?? "",
    sport: race.sport,
    sportLabel: race.sportLabel ?? "",
    format: race.format ?? raceFormats(race.sport)?.[0].id ?? "",
    distances: Object.fromEntries(Object.entries(race.distances ?? {}).map(([k, v]) => [k, String(v)])),
  };
}

/** Only what the race's sport and format ask for travels. */
export function racePayload(draft: RaceDraft): RaceFormInput {
  const keys = raceDistanceFields(draft.sport, draft.format).map((f) => f.key);
  return {
    name: draft.name,
    date: draft.date,
    location: draft.location,
    sport: draft.sport,
    sportLabel: draft.sport === "other" ? draft.sportLabel : undefined,
    format: raceFormats(draft.sport) ? draft.format : undefined,
    distances: Object.fromEntries(keys.map((k) => [k, draft.distances[k] ?? ""])),
  };
}

/**
 * What a race asks for: its kind, format and distances (by sport), name, date
 * and place. With `races` and `onPick`, a name the coach may be typing again
 * offers the race already registered.
 */
export function RaceFields({
  draft,
  onChange,
  races,
  onPick,
  errors,
}: {
  draft: RaceDraft;
  onChange: (draft: RaceDraft) => void;
  races?: Race[];
  onPick?: (race: Race) => void;
  errors: Errors;
}) {
  const set = (patch: Partial<RaceDraft>) => onChange({ ...draft, ...patch });
  const formats = raceFormats(draft.sport);
  const distances = raceDistanceFields(draft.sport, draft.format);

  // A race the coach may be typing again: offer the one already registered.
  const needle = normalizeRaceName(draft.name);
  const existing =
    races && needle.length >= 3 ? races.find((r) => normalizeRaceName(r.name).includes(needle)) : undefined;

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="raceSport">Tipo de carrera</Label>
        <NativeSelect
          id="raceSport"
          value={draft.sport}
          className="w-full"
          onChange={(e) => {
            const sport = e.target.value as RaceSport;
            set({ sport, format: raceFormats(sport)?.[0].id ?? "" });
          }}
        >
          {RACE_SPORTS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </NativeSelect>
        <FieldError message={errors.raceSport} />
      </div>

      {draft.sport === "other" && (
        <TextField
          id="raceSportLabel"
          label="¿Qué carrera es?"
          placeholder="Aguas abiertas, aventura…"
          value={draft.sportLabel}
          onChange={(sportLabel) => set({ sportLabel })}
          error={errors.raceSportLabel}
        />
      )}

      {formats && (
        <div className="flex flex-col gap-1.5">
          <span id="raceFormat-label" className="text-sm font-medium">
            {draft.sport === "hyrox" ? "Categoría" : "Distancia"}
          </span>
          <Segmented
            name="_raceFormat"
            labelId="raceFormat-label"
            value={draft.format}
            onChange={(format) => set({ format })}
            options={formats}
          />
          <FieldError message={errors.raceFormat} />
        </div>
      )}

      {distances.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <div className={`grid gap-2 ${distances.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
            {distances.map((f) => (
              <div key={f.key} className="flex flex-col gap-1.5">
                <Label htmlFor={`distance-${f.key}`}>
                  {f.label}
                  {!f.required && (
                    <span className="font-normal" style={{ color: "var(--text-3)" }}>
                      {" "}
                      (opcional)
                    </span>
                  )}
                </Label>
                <div className="relative">
                  <Input
                    id={`distance-${f.key}`}
                    inputMode="decimal"
                    className="pr-9"
                    value={draft.distances[f.key] ?? ""}
                    onChange={(e) => set({ distances: { ...draft.distances, [f.key]: e.target.value } })}
                  />
                  <span
                    className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-[12px]"
                    style={{ color: "var(--text-3)" }}
                  >
                    {f.unit}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <FieldError message={errors.raceDistances} />
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <TextField
          id="raceName"
          label="Nombre"
          placeholder="Maratón de San Salvador"
          value={draft.name}
          onChange={(name) => set({ name })}
          error={errors.raceName}
        />
        {existing && onPick && (
          <button
            type="button"
            onClick={() => onPick(existing)}
            className="flex items-center justify-between gap-2 rounded-[10px] px-3 py-2 text-left text-[12.5px]"
            style={{ background: "var(--surface-2)" }}
          >
            <span className="min-w-0 truncate" style={{ color: "var(--text-2)" }}>
              Ya registrada: <b style={{ color: "var(--text)" }}>{existing.name}</b> · {formatDateEs(existing.date)}
            </span>
            <span className="flex-none font-bold" style={{ color: "var(--coral)" }}>
              Usar esta
            </span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <TextField
          id="raceDate"
          label="Fecha"
          type="date"
          value={draft.date}
          onChange={(date) => set({ date })}
          error={errors.raceDate}
        />
        <TextField
          id="raceLocation"
          label="Lugar"
          placeholder="Opcional"
          value={draft.location}
          onChange={(location) => set({ location })}
          error={errors.raceLocation}
        />
      </div>
    </>
  );
}

export function TextField({
  id,
  label,
  hint,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
}: {
  id: string;
  label: string;
  hint?: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
      {hint && (
        <p className="text-[12px]" style={{ color: "var(--text-3)" }}>
          {hint}
        </p>
      )}
      <FieldError message={error} />
    </div>
  );
}
