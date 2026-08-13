"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatsFor } from "@/lib/domain/goals";
import { formatDuration } from "@/lib/domain/time";
import type { Goal, GoalModality, GoalType } from "@/lib/domain/types";
import type { ValidationField } from "@/lib/services/athletes";
import { FieldError } from "./FieldError";
import { Segmented } from "./Segmented";

type Errors = Partial<Record<ValidationField, string>>;

/**
 * Goal type plus, for a race, the detail the objective card needs to render
 * (name, date, modality, format, target pace). Race fields stay mounted only
 * while "Carrera" is selected so a switch to maintenance submits nothing stale.
 */
export function GoalFields({ goal, errors }: { goal?: Goal | null; errors?: Errors }) {
  const [type, setType] = useState<GoalType>(goal?.type ?? "maintenance");
  const [modality, setModality] = useState<GoalModality>(goal?.modality ?? "running");
  // Controlled on purpose: React resets uncontrolled fields once a form action
  // completes, which would wipe the coach's input every failed validation.
  const [raceName, setRaceName] = useState(goal?.raceName ?? "");
  const [raceDate, setRaceDate] = useState(goal?.raceDate ?? "");
  const [targetPace, setTargetPace] = useState(
    goal?.targetPaceSecPerKm ? formatDuration(goal.targetPaceSecPerKm) : ""
  );

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Objetivo</span>
        <Segmented
          name="goalType"
          value={type}
          onChange={setType}
          options={[
            { id: "maintenance", label: "Mantenimiento" },
            { id: "race", label: "Carrera" },
          ]}
        />
      </div>

      {type === "race" && (
        <>
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Modalidad</span>
            <Segmented
              name="modality"
              value={modality}
              onChange={setModality}
              options={[
                { id: "running", label: "Running" },
                { id: "triathlon", label: "Triatlón" },
              ]}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Formato</span>
            {/* Keyed so switching modality re-initialises the format selection. */}
            <FormatPicker key={modality} modality={modality} currentFormat={goal?.format} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="raceName">Nombre de la carrera</Label>
            <Input
              id="raceName"
              name="raceName"
              placeholder="Maratón de Valencia"
              value={raceName}
              onChange={(e) => setRaceName(e.target.value)}
            />
            <FieldError message={errors?.raceName} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="raceDate">Fecha</Label>
            <Input
              id="raceDate"
              name="raceDate"
              type="date"
              value={raceDate}
              onChange={(e) => setRaceDate(e.target.value)}
            />
            <FieldError message={errors?.raceDate} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="targetPace">Ritmo objetivo</Label>
            <Input
              id="targetPace"
              name="targetPace"
              placeholder="4:45"
              value={targetPace}
              onChange={(e) => setTargetPace(e.target.value)}
            />
            <p className="text-[12px]" style={{ color: "var(--text-3)" }}>
              Opcional, en min/km.
            </p>
            <FieldError message={errors?.targetPace} />
          </div>
        </>
      )}
    </>
  );
}

/**
 * Format options depend on the modality. Mounted with a key on modality so the
 * initial selection is recomputed rather than carrying a stale format across.
 */
function FormatPicker({
  modality,
  currentFormat,
}: {
  modality: GoalModality;
  currentFormat?: string;
}) {
  const options = formatsFor(modality);
  const stillValid = options.some((o) => o.id === currentFormat);
  const [format, setFormat] = useState(stillValid ? currentFormat! : options[0].id);

  return <Segmented name="format" value={format} onChange={setFormat} options={options} />;
}
