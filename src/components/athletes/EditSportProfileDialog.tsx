"use client";

import { Pencil } from "lucide-react";
import { saveSportProfileAction } from "@/app/athletes/actions";
import type { Athlete } from "@/lib/domain/types";
import { FormDialog } from "./fields/FormDialog";
import { SportProfileFields } from "./fields/SportProfileFields";

export function EditSportProfileDialog({ athlete }: { athlete: Athlete }) {
  return (
    <FormDialog
      title="Editar perfil deportivo"
      description="Disciplinas, nivel, disponibilidad y umbrales de entrenamiento."
      action={saveSportProfileAction.bind(null, athlete.id)}
      trigger={
        <button
          type="button"
          aria-label="Editar perfil deportivo"
          title="Editar perfil deportivo"
          className="inline-flex size-7 items-center justify-center rounded-[8px] transition-colors hover:bg-[var(--surface-2)]"
          style={{ color: "var(--text-3)" }}
        >
          <Pencil size={14} />
        </button>
      }
    >
      {(errors) => <SportProfileFields athlete={athlete} errors={errors} />}
    </FormDialog>
  );
}
