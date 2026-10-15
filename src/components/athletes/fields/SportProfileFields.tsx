"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EXPERIENCE_LEVEL_LABEL, EXPERIENCE_LEVEL_ORDER } from "@/lib/domain/athlete-profile";
import { formatDuration } from "@/lib/domain/time";
import type { Athlete, Discipline, ExperienceLevel } from "@/lib/domain/types";
import type { ValidationField } from "@/lib/services/athletes";
import { DisciplinePicker } from "./DisciplinePicker";
import { FieldError } from "./FieldError";
import { Segmented } from "./Segmented";

type Errors = Partial<Record<ValidationField, string>>;

/**
 * Disciplines, experience, availability and the training thresholds that
 * condition on which disciplines are picked — a runner never sees an FTP
 * field. Heart rate applies to every discipline (gym included), so its fields
 * are always rendered and never dropped on save. Shared by the onboarding page
 * and the athlete profile's "Perfil deportivo" card.
 */
export function SportProfileFields({ athlete, errors }: { athlete?: Athlete | null; errors?: Errors }) {
  const [disciplines, setDisciplines] = useState<Discipline[]>(athlete?.disciplines ?? []);
  const [level, setLevel] = useState<ExperienceLevel | "">(athlete?.level ?? "");
  const [weeklyDays, setWeeklyDays] = useState(athlete?.weeklyAvailabilityDays?.toString() ?? "");
  const [weeklyHours, setWeeklyHours] = useState(athlete?.weeklyAvailabilityHours?.toString() ?? "");
  const [runPace, setRunPace] = useState(
    athlete?.thresholds?.runThresholdPaceSecPerKm
      ? formatDuration(athlete.thresholds.runThresholdPaceSecPerKm)
      : ""
  );
  const [ftp, setFtp] = useState(athlete?.thresholds?.bikeFtpWatts?.toString() ?? "");
  const [swimPace, setSwimPace] = useState(
    athlete?.thresholds?.swimThresholdPaceSecPer100m
      ? formatDuration(athlete.thresholds.swimThresholdPaceSecPer100m)
      : ""
  );
  const [maxHr, setMaxHr] = useState(athlete?.thresholds?.maxHr?.toString() ?? "");
  const [restHr, setRestHr] = useState(athlete?.thresholds?.restHr?.toString() ?? "");

  const showRun = disciplines.includes("run");
  const showBike = disciplines.includes("bike");
  const showSwim = disciplines.includes("swim");

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <span id="disciplines-label" className="text-sm font-medium">
          Disciplinas
        </span>
        <DisciplinePicker
          labelId="disciplines-label"
          defaultValue={disciplines}
          onChange={setDisciplines}
        />
        <p className="text-[12px]" style={{ color: "var(--text-3)" }}>
          Opcional — puedes añadirlas más adelante.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <span id="level-label" className="text-sm font-medium">
          Nivel
        </span>
        <Segmented
          name="level"
          labelId="level-label"
          value={level}
          onChange={setLevel}
          options={[
            { id: "" as const, label: "Sin definir" },
            ...EXPERIENCE_LEVEL_ORDER.map((l) => ({ id: l, label: EXPERIENCE_LEVEL_LABEL[l] })),
          ]}
        />
      </div>

      <div className="flex gap-2.5">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="weeklyAvailabilityDays">Días/semana</Label>
          <Input
            id="weeklyAvailabilityDays"
            name="weeklyAvailabilityDays"
            inputMode="numeric"
            placeholder="5"
            value={weeklyDays}
            onChange={(e) => setWeeklyDays(e.target.value)}
          />
          <FieldError message={errors?.weeklyDays} />
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="weeklyAvailabilityHours">Horas/semana</Label>
          <Input
            id="weeklyAvailabilityHours"
            name="weeklyAvailabilityHours"
            inputMode="decimal"
            placeholder="7"
            value={weeklyHours}
            onChange={(e) => setWeeklyHours(e.target.value)}
          />
          <FieldError message={errors?.weeklyHours} />
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-[10px] border p-3" style={{ borderColor: "var(--border)" }}>
        <span className="text-[12.5px] font-bold" style={{ color: "var(--text-2)" }}>
          Umbrales de entrenamiento
        </span>

        {showRun && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="runThresholdPace">Ritmo umbral (carrera)</Label>
            <Input
              id="runThresholdPace"
              name="runThresholdPace"
              placeholder="4:20"
              value={runPace}
              onChange={(e) => setRunPace(e.target.value)}
            />
            <p className="text-[12px]" style={{ color: "var(--text-3)" }}>
              m:ss por km
            </p>
            <FieldError message={errors?.runPace} />
          </div>
        )}

        {showBike && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bikeFtpWatts">FTP (ciclismo)</Label>
            <Input
              id="bikeFtpWatts"
              name="bikeFtpWatts"
              inputMode="numeric"
              placeholder="210"
              value={ftp}
              onChange={(e) => setFtp(e.target.value)}
            />
            <p className="text-[12px]" style={{ color: "var(--text-3)" }}>
              Vatios
            </p>
            <FieldError message={errors?.ftp} />
          </div>
        )}

        {showSwim && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="swimThresholdPace">CSS (natación)</Label>
            <Input
              id="swimThresholdPace"
              name="swimThresholdPace"
              placeholder="1:35"
              value={swimPace}
              onChange={(e) => setSwimPace(e.target.value)}
            />
            <p className="text-[12px]" style={{ color: "var(--text-3)" }}>
              m:ss por 100m
            </p>
            <FieldError message={errors?.swimPace} />
          </div>
        )}

        <div className="flex gap-2.5">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="maxHr">FC máxima</Label>
            <Input
              id="maxHr"
              name="maxHr"
              inputMode="numeric"
              placeholder="188"
              value={maxHr}
              onChange={(e) => setMaxHr(e.target.value)}
            />
            <FieldError message={errors?.maxHr} />
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="restHr">FC reposo</Label>
            <Input
              id="restHr"
              name="restHr"
              inputMode="numeric"
              placeholder="48"
              value={restHr}
              onChange={(e) => setRestHr(e.target.value)}
            />
            <FieldError message={errors?.restHr} />
          </div>
        </div>
      </div>
    </>
  );
}
