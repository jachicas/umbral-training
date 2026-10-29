"use client";

import { useState, useTransition } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { deleteRaceAction, saveRaceAction } from "@/app/races/actions";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormDialog } from "@/components/athletes/fields/FormDialog";
import { RaceFields, blankRace, draftOf, racePayload, type RaceDraft } from "@/components/athletes/fields/RaceFields";
import type { ValidationField } from "@/lib/services/athletes";
import type { Race } from "@/lib/domain/types";

const outlineButtonClass =
  "inline-flex h-10 items-center gap-1.5 rounded-[10px] border px-3.5 text-[13.5px] font-bold transition-colors hover:bg-[var(--surface-2)] disabled:opacity-60";

/** Registers a race (`race` omitted) or edits one; editing changes it for every athlete who runs it. */
export function RaceDialog({ race }: { race?: Race }) {
  const label = race ? "Editar" : "Nueva carrera";

  return (
    <FormDialog
      title={race ? "Editar carrera" : "Nueva carrera"}
      action={saveRaceAction.bind(null, race?.id ?? null)}
      maxWidthClass="sm:max-w-[480px]"
      trigger={
        race ? (
          <button type="button" className={outlineButtonClass} style={{ borderColor: "var(--border-2)", color: "var(--text)" }}>
            <Pencil size={14} /> {label}
          </button>
        ) : (
          <button
            type="button"
            className="inline-flex h-[42px] items-center gap-1.5 rounded-[10px] px-4 text-[13.5px] font-bold"
            style={{ background: "var(--coral)", color: "var(--on-coral)" }}
          >
            <Plus size={16} /> {label}
          </button>
        )
      }
    >
      {(errors) => <RaceForm race={race} errors={errors} />}
    </FormDialog>
  );
}

function RaceForm({ race, errors }: { race?: Race; errors: Partial<Record<ValidationField, string>> }) {
  const [draft, setDraft] = useState<RaceDraft>(() => (race ? draftOf(race) : blankRace()));

  return (
    <>
      <input type="hidden" name="race" value={JSON.stringify(racePayload(draft))} />
      <RaceFields draft={draft} onChange={setDraft} errors={errors} />
    </>
  );
}

/** Deletes a race nobody has in their line-up, after asking. */
export function DeleteRaceButton({ race }: { race: Race }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function remove() {
    startTransition(async () => {
      const result = await deleteRaceAction(race.id);
      setError(result.error);
      setConfirming(false);
    });
  }

  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={() => setConfirming(true)}
        className={outlineButtonClass}
        style={{ borderColor: "var(--border-2)", color: "var(--danger)" }}
      >
        <Trash2 size={14} /> Eliminar
      </button>
      {error && (
        <p role="alert" className="m-0 basis-full text-[12.5px] font-semibold" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}
      <ConfirmDialog
        open={confirming}
        title={`¿Eliminar ${race.name}?`}
        confirmLabel="Eliminar"
        tone="danger"
        pending={pending}
        onConfirm={remove}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
