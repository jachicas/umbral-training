"use client";

import { Pencil } from "lucide-react";
import { updateAthleteAction } from "@/app/athletes/actions";
import type { Athlete } from "@/lib/domain/types";
import { AthleteIdentityFields } from "./fields/AthleteIdentityFields";
import { FormDialog } from "./fields/FormDialog";

export function EditAthleteDialog({ athlete }: { athlete: Athlete }) {
  return (
    <FormDialog
      title="Editar atleta"
      action={updateAthleteAction.bind(null, athlete.id)}
      trigger={
        <button
          type="button"
          className="flex h-[42px] items-center gap-[7px] rounded-[10px] border px-4 text-[13.5px] font-bold transition-colors hover:bg-[var(--surface-2)]"
          style={{
            borderColor: "var(--border)",
            background: "var(--surface)",
            color: "var(--text)",
          }}
        >
          <Pencil size={15} /> Editar
        </button>
      }
    >
      {(errors) => (
        <AthleteIdentityFields
          defaultFullName={athlete.fullName}
          defaultEmail={athlete.email ?? ""}
          defaultPhone={athlete.phone ?? ""}
          defaultBirthDate={athlete.birthDate ?? ""}
          defaultSex={athlete.sex}
          errors={errors}
          emailHint={
            athlete.accessStatus === "draft"
              ? "Opcional"
              : "Obligatorio"
          }
        />
      )}
    </FormDialog>
  );
}
