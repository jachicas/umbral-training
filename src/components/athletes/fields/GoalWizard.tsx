"use client";

import { useState, type ReactNode } from "react";
import { Check, ChevronLeft, Flag, Plus, Search, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { normalizeRaceName, raceAimsForPace, raceSummary } from "@/lib/domain/races";
import { formatDateEs, formatDuration } from "@/lib/domain/time";
import type { Goal, GoalType, Race } from "@/lib/domain/types";
import type { SaveGoalInput, ValidationField } from "@/lib/services/athletes";
import { DurationInput, durationParts, joinDuration } from "./DurationInput";
import { FieldError } from "./FieldError";
import { RaceFields, TextField, blankRace, racePayload, type RaceDraft } from "./RaceFields";

type Errors = Partial<Record<ValidationField, string>>;
type Step = "type" | "race" | "details";

const STEPS: Step[] = ["type", "race", "details"];
const RACE_STEPS: Step[] = ["race", "details"];
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
 *
 * `raceOnly` skips the type step: one race in the athlete's line-up, opening
 * on its details when it has a race already.
 */
export function GoalWizard({
  goal,
  races,
  errors,
  submit,
  raceOnly = false,
}: {
  goal?: Goal | null;
  races: Race[];
  errors: Errors;
  submit?: { pending: boolean; onCancel: () => void };
  raceOnly?: boolean;
}) {
  const [type, setType] = useState<GoalType>(raceOnly ? "race" : (goal?.type ?? "maintenance"));
  const [step, setStep] = useState<Step>(raceOnly ? (goal?.race ? "details" : "race") : "type");
  const [raceId, setRaceId] = useState<string | null>(goal?.race?.id ?? null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<RaceDraft>(blankRace);
  const [query, setQuery] = useState("");
  const [targetPace, setTargetPace] = useState(goal?.targetPaceSecPerKm ? formatDuration(goal.targetPaceSecPerKm) : "");
  const [targetTime, setTargetTime] = useState(() => durationParts(goal?.targetTimeSeconds));

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
    const target = aimsForPace ? { targetPace } : { targetTime: joinDuration(targetTime) };
    if (!creating) return { type, raceId: raceId ?? undefined, ...target };

    return { type, race: racePayload(draft), ...target };
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

  const steps = raceOnly ? RACE_STEPS : STEPS;
  const index = steps.indexOf(step);
  const last = type === "maintenance" ? step === "type" : step === "details";

  return (
    <div className="flex flex-col gap-4">
      <input type="hidden" name="goal" value={JSON.stringify(payload())} />

      {type === "race" && (
        <div className="flex gap-1" aria-hidden>
          {steps.map((s, i) => (
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
            <RaceFields
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
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="targetTime">Tiempo objetivo</Label>
              <DurationInput id="targetTime" value={targetTime} onChange={setTargetTime} invalid={!!errors.targetTime} />
              <FieldError message={errors.targetTime} />
            </div>
          )}
        </div>
      )}

      {submit && <FieldError message={errors.general} />}

      <div className="flex items-center justify-between gap-2">
        {index > 0 ? (
          <button
            type="button"
            onClick={() => setStep(steps[index - 1])}
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
              onClick={() => setStep(steps[index + 1])}
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
            Sin carreras por elegir.
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
