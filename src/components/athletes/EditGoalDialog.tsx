"use client";

import { Pencil, Plus } from "lucide-react";
import { saveGoalAction } from "@/app/athletes/actions";
import type { Goal, Race } from "@/lib/domain/types";
import { FormDialog } from "./fields/FormDialog";
import { GoalWizard } from "./fields/GoalWizard";

/**
 * `defined` false renders a prompting CTA instead of a quiet pencil — that is
 * the path out of a race goal that was created with only its type.
 */
export function EditGoalDialog({
  athleteId,
  goal,
  races,
  defined,
}: {
  athleteId: string;
  goal: Goal | null;
  races: Race[];
  defined: boolean;
}) {
  return (
    <FormDialog
      title={defined ? "Editar objetivo" : "Definir objetivo"}
      action={saveGoalAction.bind(null, athleteId)}
      maxWidthClass="sm:max-w-[480px]"
      hideFooter
      trigger={
        defined ? (
          <button
            type="button"
            aria-label="Editar objetivo"
            title="Editar objetivo"
            className="inline-flex size-7 items-center justify-center rounded-[8px] transition-colors hover:bg-[var(--surface-2)]"
            style={{ color: "var(--text-3)" }}
          >
            <Pencil size={14} />
          </button>
        ) : (
          <button
            type="button"
            className="inline-flex h-9 items-center gap-1.5 rounded-[8px] px-3 text-[13px] font-bold text-white"
            style={{ background: "var(--coral)" }}
          >
            <Plus size={15} /> Definir carrera
          </button>
        )
      }
    >
      {(errors, { pending, close }) => (
        <GoalWizard
          goal={goal}
          races={races}
          errors={errors}
          submit={{ pending, onCancel: close }}
          startWithRace={!defined}
        />
      )}
    </FormDialog>
  );
}
