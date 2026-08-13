"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addRecordAction } from "@/app/athletes/actions";
import { RACE_REFERENCES } from "@/lib/domain/time";
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

export function AddRecordDialog({ athleteId }: { athleteId: string }) {
  return (
    <FormDialog
      title="Añadir marca"
      description="La marca más reciente de cada distancia es la que manda en la ficha."
      action={addRecordAction.bind(null, athleteId)}
      submitLabel="Añadir marca"
      pendingLabel="Añadiendo…"
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
      {(errors) => <RecordFields errors={errors} />}
    </FormDialog>
  );
}

function RecordFields({ errors }: { errors: Record<string, string | undefined> }) {
  const [reference, setReference] = useState<RaceReference>("5k");
  // Controlled on purpose: React resets uncontrolled fields once a form action
  // completes, which would wipe the coach's input every failed validation.
  const [time, setTime] = useState("");
  const [recordedOn, setRecordedOn] = useState(todayLocalISO);
  const [note, setNote] = useState("");

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Distancia</span>
        <Segmented
          name="reference"
          value={reference}
          onChange={setReference}
          options={RACE_REFERENCES.map((r) => ({ id: r, label: r.toUpperCase() }))}
        />
      </div>

      <div className="flex gap-2.5">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="time">Tiempo</Label>
          <Input
            id="time"
            name="time"
            placeholder="21:30"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
          <p className="text-[12px]" style={{ color: "var(--text-3)" }}>
            mm:ss o h:mm:ss
          </p>
          <FieldError message={errors.time} />
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="recordedOn">Fecha</Label>
          <Input
            id="recordedOn"
            name="recordedOn"
            type="date"
            value={recordedOn}
            onChange={(e) => setRecordedOn(e.target.value)}
          />
          <FieldError message={errors.recordedOn} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="note">Nota</Label>
        <Input
          id="note"
          name="note"
          placeholder="Opcional — carrera, condiciones…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
    </>
  );
}
