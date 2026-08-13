"use client";

import { Pencil, Plus } from "lucide-react";
import { saveGoalAction } from "@/app/athletes/actions";
import type { Goal } from "@/lib/domain/types";
import { FormDialog } from "./fields/FormDialog";
import { GoalFields } from "./fields/GoalFields";

/**
 * `defined` false renders a prompting CTA instead of a quiet pencil — that is
 * the path out of a race goal that was created with only its type.
 */
export function EditGoalDialog({
  athleteId,
  goal,
  defined,
}: {
  athleteId: string;
  goal: Goal | null;
  defined: boolean;
}) {
  return (
    <FormDialog
      title={defined ? "Editar objetivo" : "Definir objetivo"}
      description="Mantenimiento, o una carrera con su fecha para calcular los días restantes."
      action={saveGoalAction.bind(null, athleteId)}
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
      {(errors) => <GoalFields goal={goal} errors={errors} />}
    </FormDialog>
  );
}
