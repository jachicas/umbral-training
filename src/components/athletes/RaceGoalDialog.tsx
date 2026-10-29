"use client";

import { useState, useTransition } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { removeRaceGoalAction, saveRaceGoalAction } from "@/app/athletes/actions";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { Goal, Race } from "@/lib/domain/types";
import { FormDialog } from "./fields/FormDialog";
import { GoalWizard } from "./fields/GoalWizard";

const iconButtonClass =
  "inline-flex size-7 items-center justify-center rounded-[8px] transition-colors hover:bg-[var(--surface-2)] disabled:opacity-60";

/**
 * Adds a race to the athlete's line-up (`goal` null) or changes one. `cta`
 * draws a prominent button instead of an icon: the athlete has no race yet.
 */
export function RaceGoalDialog({
  athleteId,
  goal,
  races,
  cta = false,
}: {
  athleteId: string;
  goal: Goal | null;
  races: Race[];
  cta?: boolean;
}) {
  const adding = goal === null;
  const label = adding ? "Agregar carrera" : "Editar carrera";

  return (
    <FormDialog
      title={label}
      action={saveRaceGoalAction.bind(null, athleteId, goal?.id ?? null)}
      maxWidthClass="sm:max-w-[480px]"
      hideFooter
      trigger={
        cta ? (
          <button
            type="button"
            className="inline-flex h-9 items-center gap-1.5 rounded-[8px] px-3 text-[13px] font-bold text-[var(--on-coral)]"
            style={{ background: "var(--coral)" }}
          >
            <Plus size={15} /> {label}
          </button>
        ) : (
          <button type="button" aria-label={label} title={label} className={iconButtonClass} style={{ color: "var(--text-3)" }}>
            {adding ? <Plus size={16} /> : <Pencil size={14} />}
          </button>
        )
      }
    >
      {(errors, { pending, close }) => (
        <GoalWizard goal={goal} races={races} errors={errors} submit={{ pending, onCancel: close }} raceOnly />
      )}
    </FormDialog>
  );
}

/** Takes a race off the athlete's line-up, after asking. */
export function RemoveRaceGoalButton({ athleteId, goal }: { athleteId: string; goal: Goal }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function remove() {
    startTransition(async () => {
      const result = await removeRaceGoalAction(athleteId, goal.id);
      setError(result.error);
      setConfirming(false);
    });
  }

  return (
    <>
      <button
        type="button"
        aria-label="Quitar carrera"
        title={error ?? "Quitar carrera"}
        disabled={pending}
        onClick={() => setConfirming(true)}
        className={iconButtonClass}
        style={{ color: error ? "var(--danger)" : "var(--text-3)" }}
      >
        <Trash2 size={14} />
      </button>
      <ConfirmDialog
        open={confirming}
        title={`¿Quitar ${goal.raceName ?? "la carrera"}?`}
        confirmLabel="Quitar"
        pending={pending}
        onConfirm={remove}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
