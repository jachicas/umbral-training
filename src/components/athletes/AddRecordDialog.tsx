"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addRecordAction } from "@/app/athletes/actions";
import { RACE_REFERENCES, formatDuration } from "@/lib/domain/time";
import type { RaceReference } from "@/lib/domain/types";
import { FieldError } from "./fields/FieldError";
import { FormDialog } from "./fields/FormDialog";
import { Segmented } from "./fields/Segmented";

/** Local calendar date — `toISOString()` would shift the day near midnight. */
function todayLocalISO(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/** The athlete's current mark per distance, to start each field from. */
export type LatestMarks = Partial<Record<RaceReference, { timeSeconds: number; recordedOn: string; note?: string }>>;

export function AddRecordDialog({ athleteId, latest }: { athleteId: string; latest: LatestMarks }) {
  return (
    <FormDialog
      title="Añadir marcas"
      action={addRecordAction.bind(null, athleteId)}
      submitLabel="Guardar marcas"
      pendingLabel="Guardando…"
      trigger={
        <button
          type="button"
          className="inline-flex items-center gap-1 text-[13px] font-semibold transition-colors hover:text-[var(--coral)]"
          style={{ color: "var(--text)" }}
        >
          <Plus size={14} /> Añadir marca
        </button>
      }
    >
      {(errors) => <RecordFields errors={errors} latest={latest} />}
    </FormDialog>
  );
}

interface Entry {
  time: string;
  recordedOn: string;
  note: string;
}

/**
 * Pick a distance, write its time, date and note; switch to another and the
 * first one is kept. "Guardar marcas" sends every distance with a time, each
 * with its own date. Hidden inputs carry them all in the form.
 */
function RecordFields({ errors, latest }: { errors: Record<string, string | undefined>; latest: LatestMarks }) {
  const [reference, setReference] = useState<RaceReference>("5k");
  // Each distance starts from its current mark (or blank with today's date).
  const [initial] = useState<Record<RaceReference, Entry>>(
    () =>
      Object.fromEntries(
        RACE_REFERENCES.map((r) => {
          const mark = latest[r];
          return [
            r,
            mark
              ? { time: formatDuration(mark.timeSeconds), recordedOn: mark.recordedOn, note: mark.note ?? "" }
              : { time: "", recordedOn: todayLocalISO(), note: "" },
          ];
        })
      ) as Record<RaceReference, Entry>
  );
  // Controlled on purpose: React resets uncontrolled fields once a form action
  // completes, which would wipe the coach's input every failed validation.
  const [entries, setEntries] = useState<Record<RaceReference, Entry>>(initial);
  const entry = entries[reference];
  // Only distances that differ from their current mark get saved (no duplicates).
  const changed = (r: RaceReference) =>
    entries[r].time.trim() !== "" &&
    (entries[r].time.trim() !== initial[r].time ||
      entries[r].recordedOn !== initial[r].recordedOn ||
      entries[r].note.trim() !== initial[r].note);
  const set = (patch: Partial<Entry>) => setEntries((all) => ({ ...all, [reference]: { ...all[reference], ...patch } }));

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <span id="reference-label" className="text-sm font-medium">
          Distancia
        </span>
        <Segmented
          name="reference"
          labelId="reference-label"
          value={reference}
          onChange={setReference}
          // A dot marks the distances that will be saved.
          options={RACE_REFERENCES.map((r) => ({
            id: r,
            label: changed(r) ? `${r.toUpperCase()} •` : r.toUpperCase(),
          }))}
        />
      </div>

      <div className="flex gap-2.5">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="time">Tiempo</Label>
          <Input id="time" placeholder="21:30" value={entry.time} onChange={(e) => set({ time: e.target.value })} />
          <p className="text-[12px]" style={{ color: "var(--text-3)" }}>
            mm:ss o h:mm:ss
          </p>
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="recordedOn">Fecha</Label>
          <Input id="recordedOn" type="date" value={entry.recordedOn} onChange={(e) => set({ recordedOn: e.target.value })} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="note">Nota</Label>
        <Input
          id="note"
          placeholder="Opcional — carrera, condiciones…"
          value={entry.note}
          onChange={(e) => set({ note: e.target.value })}
        />
      </div>

      <FieldError message={errors.time ?? errors.recordedOn} />

      {RACE_REFERENCES.map((r) => (
        <span key={r} hidden>
          <input type="hidden" name={`time_${r}`} value={changed(r) ? entries[r].time : ""} />
          <input type="hidden" name={`recordedOn_${r}`} value={entries[r].recordedOn} />
          <input type="hidden" name={`note_${r}`} value={entries[r].note} />
        </span>
      ))}
    </>
  );
}
