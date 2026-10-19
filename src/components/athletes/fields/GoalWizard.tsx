"use client";

import { useState, type ReactNode } from "react";
import { Check, ChevronLeft, Flag, Plus, Search, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import {
  RACE_SPORTS,
  normalizeRaceName,
  raceAimsForPace,
  raceDistanceFields,
  raceFormats,
  raceSummary,
} from "@/lib/domain/races";
import { formatDateEs, formatDuration } from "@/lib/domain/time";
import type { Goal, GoalType, Race, RaceDistanceKey, RaceSport } from "@/lib/domain/types";
import type { SaveGoalInput, ValidationField } from "@/lib/services/athletes";
import { FieldError } from "./FieldError";
import { Segmented } from "./Segmented";

type Errors = Partial<Record<ValidationField, string>>;
type Step = "type" | "race" | "details";

const STEPS: Step[] = ["type", "race", "details"];
const DETAIL_FIELDS: ValidationField[] = [
  "raceName",
  "raceDate",
  "raceLocation",
  "raceSport",
  "raceSportLabel",
  "raceFormat",
  "raceDistances",
  "targetPace",
  "targetTime",
];

interface NewRace {
  name: string;
  date: string;
  location: string;
  sport: RaceSport;
  sportLabel: string;
  format: string;
  distances: Partial<Record<RaceDistanceKey, string>>;
}

const blankRace = (name = ""): NewRace => ({
  name,
  date: "",
  location: "",
  sport: "road",
  sportLabel: "",
  format: "10k",
  distances: {},
});

/** The step a set of errors points to: the one holding the first field in error. */
function stepForErrors(errors: Errors): Step | null {
  if (errors.race) return "race";
  return DETAIL_FIELDS.some((f) => errors[f]) ? "details" : null;
}

/**
 * The athlete's goal, a step at a time: maintenance or a race; which race
 * (one already in the catalog, or a new one); then what that race asks for
 * and the target. Everything travels to the action as JSON in one hidden
 * `goal` field, so the steps can come and go without losing input.
 *
 * `submit` draws Cancel/Save on the last step (the edit dialog); without it
 * the surrounding form has its own button (creating an athlete).
 */
export function GoalWizard({
  goal,
  races,
  errors,
  submit,
  startWithRace = false,
}: {
  goal?: Goal | null;
  races: Race[];
  errors: Errors;
  submit?: { pending: boolean; onCancel: () => void };
  /** Opens on the race step ("Definir carrera"). */
  startWithRace?: boolean;
}) {
  const [type, setType] = useState<GoalType>(startWithRace ? "race" : (goal?.type ?? "maintenance"));
  const [step, setStep] = useState<Step>(startWithRace ? "race" : "type");
  const [raceId, setRaceId] = useState<string | null>(goal?.race?.id ?? null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<NewRace>(blankRace);
  const [query, setQuery] = useState("");
  const [targetPace, setTargetPace] = useState(goal?.targetPaceSecPerKm ? formatDuration(goal.targetPaceSecPerKm) : "");
  const [targetTime, setTargetTime] = useState(goal?.targetTimeSeconds ? formatDuration(goal.targetTimeSeconds) : "");

  // After a failed save, open the step that holds the error. Compared by
  // content: forms pass a fresh `{}` on every render.
  const errorsKey = JSON.stringify(errors);
  const [seenErrors, setSeenErrors] = useState(errorsKey);
  if (errorsKey !== seenErrors) {
    setSeenErrors(errorsKey);
    const target = stepForErrors(errors);
    if (target) setStep(target);
  }

  // The athlete's current race stays pickable even if it's no longer upcoming.
  const catalog = goal?.race && !races.some((r) => r.id === goal.race!.id) ? [goal.race, ...races] : races;
  const chosen = catalog.find((r) => r.id === raceId) ?? null;
  const sport = creating ? draft.sport : chosen?.sport;
  const aimsForPace = sport ? raceAimsForPace(sport) : true;

  function payload(): SaveGoalInput {
    if (type === "maintenance") return { type };
    const target = aimsForPace ? { targetPace } : { targetTime };
    if (!creating) return { type, raceId: raceId ?? undefined, ...target };

    const keys = raceDistanceFields(draft.sport, draft.format).map((f) => f.key);
    return {
      type,
      race: {
        name: draft.name,
        date: draft.date,
        location: draft.location,
        sport: draft.sport,
        sportLabel: draft.sport === "other" ? draft.sportLabel : undefined,
        format: raceFormats(draft.sport) ? draft.format : undefined,
        distances: Object.fromEntries(keys.map((k) => [k, draft.distances[k] ?? ""])),
      },
      ...target,
    };
  }

  function pick(race: Race) {
    setRaceId(race.id);
    setCreating(false);
    setStep("details");
  }

  function startNew(name = "") {
    setCreating(true);
    setRaceId(null);
    setDraft(blankRace(name));
    setStep("details");
  }

  const index = STEPS.indexOf(step);
  const last = type === "maintenance" ? step === "type" : step === "details";

  return (
    <div className="flex flex-col gap-4">
      <input type="hidden" name="goal" value={JSON.stringify(payload())} />

      {type === "race" && (
        <div className="flex gap-1" aria-hidden>
          {STEPS.map((s, i) => (
            <span
              key={s}
              className="h-[3px] flex-1 rounded-full"
              style={{ background: i <= index ? "var(--coral)" : "var(--surface-3)" }}
            />
          ))}
        </div>
      )}

      {step === "type" && <TypeStep type={type} onChange={setType} />}

      {step === "race" && (
        <RaceStep
          races={catalog}
          chosenId={creating ? null : raceId}
          query={query}
          onQuery={setQuery}
          onPick={pick}
          onNew={startNew}
          error={errors.race}
        />
      )}

      {step === "details" && (
        <div className="flex flex-col gap-4">
          {creating ? (
            <NewRaceFields
              draft={draft}
              onChange={setDraft}
              races={catalog}
              onPick={pick}
              errors={errors}
            />
          ) : (
            chosen && <ChosenRace race={chosen} onChange={() => setStep("race")} />
          )}

          {aimsForPace ? (
            <TextField
              id="targetPace"
              label="Ritmo objetivo"
              hint="Opcional, en min/km."
              placeholder="4:45"
              value={targetPace}
              onChange={setTargetPace}
              error={errors.targetPace}
            />
          ) : (
            <TextField
              id="targetTime"
              label="Tiempo objetivo"
              hint="Opcional, en h:mm:ss."
              placeholder="5:30:00"
              value={targetTime}
              onChange={setTargetTime}
              error={errors.targetTime}
            />
          )}
        </div>
      )}

      {submit && <FieldError message={errors.general} />}

      <div className="flex items-center justify-between gap-2">
        {index > 0 ? (
          <button
            type="button"
            onClick={() => setStep(STEPS[index - 1])}
            className="inline-flex items-center gap-1 text-[13px] font-semibold"
            style={{ color: "var(--text-2)" }}
          >
            <ChevronLeft size={15} /> Atrás
          </button>
        ) : (
          <span />
        )}

        <div className="flex gap-2">
          {submit && (
            <Button type="button" variant="outline" className="h-10 rounded-[10px]" onClick={submit.onCancel}>
              Cancelar
            </Button>
          )}
          {!last ? (
            <Button
              type="button"
              className="h-10 rounded-[10px] font-bold"
              // The race step moves on by picking a race; this continues with the current one.
              disabled={step === "race" && !chosen && !creating}
              onClick={() => setStep(STEPS[index + 1])}
            >
              Siguiente
            </Button>
          ) : (
            submit && (
              <Button type="submit" disabled={submit.pending} className="h-10 rounded-[10px] font-bold">
                {submit.pending ? "Guardando…" : "Guardar"}
              </Button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

function TypeStep({ type, onChange }: { type: GoalType; onChange: (type: GoalType) => void }) {
  const options: { id: GoalType; label: string; hint: string; icon: ReactNode }[] = [
    { id: "maintenance", label: "Mantenimiento", hint: "Sin carrera a la vista", icon: <Target size={17} /> },
    { id: "race", label: "Carrera", hint: "Con fecha y meta", icon: <Flag size={17} /> },
  ];

  return (
    <div role="radiogroup" aria-label="Objetivo" className="grid grid-cols-2 gap-2">
      {options.map((o) => {
        const active = o.id === type;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.id)}
            className="flex flex-col items-start gap-2 rounded-[12px] border p-3.5 text-left transition-colors"
            style={{
              borderColor: active ? "var(--coral)" : "var(--border)",
              background: active ? "var(--coral-tint)" : "transparent",
            }}
          >
            <span style={{ color: active ? "var(--coral)" : "var(--text-3)" }}>{o.icon}</span>
            <span>
              <span className="block text-[14px] font-bold">{o.label}</span>
              <span className="block text-[12px]" style={{ color: "var(--text-3)" }}>
                {o.hint}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function RaceRow({ race, active, onClick }: { race: Race; active?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 rounded-[10px] border px-3 py-2.5 text-left transition-colors hover:bg-[var(--surface-2)]"
      style={{ borderColor: active ? "var(--coral)" : "transparent" }}
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13.5px] font-semibold">{race.name}</span>
        <span className="block truncate text-[12px]" style={{ color: "var(--text-3)" }}>
          {raceSummary(race)} · {formatDateEs(race.date)}
        </span>
      </span>
      {active ? (
        <Check size={16} style={{ color: "var(--coral)" }} />
      ) : (
        !!race.athleteCount && (
          <span className="text-[11.5px] tabular-nums" style={{ color: "var(--text-3)" }}>
            {race.athleteCount} {race.athleteCount === 1 ? "atleta" : "atletas"}
          </span>
        )
      )}
    </button>
  );
}

function RaceStep({
  races,
  chosenId,
  query,
  onQuery,
  onPick,
  onNew,
  error,
}: {
  races: Race[];
  chosenId: string | null;
  query: string;
  onQuery: (q: string) => void;
  onPick: (race: Race) => void;
  onNew: (name?: string) => void;
  error?: string;
}) {
  const needle = normalizeRaceName(query);
  const matches = needle ? races.filter((r) => normalizeRaceName(r.name).includes(needle)) : races;

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => onNew(query.trim())}
        className="flex items-center gap-1.5 rounded-[10px] border px-3 py-2.5 text-[13px] font-semibold transition-colors hover:bg-[var(--surface-2)]"
        style={{ borderColor: "var(--border)" }}
      >
        <Plus size={15} style={{ color: "var(--coral)" }} />
        {query.trim() ? `Nueva carrera: “${query.trim()}”` : "Nueva carrera"}
      </button>

      {races.length > 0 && (
        <div className="relative">
          <Search size={14} className="absolute top-1/2 left-2.5 -translate-y-1/2" style={{ color: "var(--text-3)" }} />
          <input
            aria-label="Buscar carrera"
            placeholder="Buscar en tus carreras…"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
            className="h-9 w-full rounded-[9px] border pr-3 pl-8 text-[13px] outline-none"
            style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" }}
          />
        </div>
      )}

      <div className="flex max-h-[min(42vh,300px)] flex-col gap-0.5 overflow-y-auto">
        {matches.map((race) => (
          <RaceRow key={race.id} race={race} active={race.id === chosenId} onClick={() => onPick(race)} />
        ))}
        {races.length === 0 && (
          <p className="px-1 py-2 text-[12.5px]" style={{ color: "var(--text-3)" }}>
            Aún no tienes carreras registradas.
          </p>
        )}
        {races.length > 0 && matches.length === 0 && (
          <p className="px-1 py-2 text-[12.5px]" style={{ color: "var(--text-3)" }}>
            Ninguna carrera con ese nombre.
          </p>
        )}
      </div>

      <FieldError message={error} />
    </div>
  );
}

function ChosenRace({ race, onChange }: { race: Race; onChange: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-[12px] px-3.5 py-3" style={{ background: "var(--surface-2)" }}>
      <Flag size={16} style={{ color: "var(--coral)" }} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14px] font-bold">{race.name}</div>
        <div className="truncate text-[12px]" style={{ color: "var(--text-3)" }}>
          {raceSummary(race)} · {formatDateEs(race.date)}
        </div>
      </div>
      <button type="button" onClick={onChange} className="text-[12.5px] font-bold" style={{ color: "var(--coral)" }}>
        Cambiar
      </button>
    </div>
  );
}

function NewRaceFields({
  draft,
  onChange,
  races,
  onPick,
  errors,
}: {
  draft: NewRace;
  onChange: (draft: NewRace) => void;
  races: Race[];
  onPick: (race: Race) => void;
  errors: Errors;
}) {
  const set = (patch: Partial<NewRace>) => onChange({ ...draft, ...patch });
  const formats = raceFormats(draft.sport);
  const distances = raceDistanceFields(draft.sport, draft.format);

  // A race the coach may be typing again: offer the one already registered.
  const needle = normalizeRaceName(draft.name);
  const existing = needle.length >= 3 ? races.find((r) => normalizeRaceName(r.name).includes(needle)) : undefined;

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
        {existing && (
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

function TextField({
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
