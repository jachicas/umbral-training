"use client";

import { Pencil, Plus } from "lucide-react";
import { saveMembershipAction } from "@/app/athletes/actions";
import type { Membership } from "@/lib/domain/types";
import { FormDialog } from "./fields/FormDialog";
import { MembershipFields } from "./fields/MembershipFields";

export function EditMembershipDialog({
  athleteId,
  membership,
  configured,
}: {
  athleteId: string;
  membership: Membership;
  configured: boolean;
}) {
  return (
    <FormDialog
      title={configured ? "Editar membresía" : "Configurar membresía"}
      action={saveMembershipAction.bind(null, athleteId)}
      trigger={
        configured ? (
          <button
            type="button"
            aria-label="Editar membresía"
            title="Editar membresía"
            className="inline-flex size-7 items-center justify-center rounded-[8px] transition-colors hover:bg-[var(--surface-2)]"
            style={{ color: "var(--text-3)" }}
          >
            <Pencil size={14} />
          </button>
        ) : (
          <button
            type="button"
            className="inline-flex h-9 items-center gap-1.5 rounded-[8px] px-3 text-[13px] font-bold text-[var(--on-coral)]"
            style={{ background: "var(--coral)" }}
          >
            <Plus size={15} /> Configurar
          </button>
        )
      }
    >
      {(errors) => <MembershipFields membership={membership} errors={errors} />}
    </FormDialog>
  );
}
