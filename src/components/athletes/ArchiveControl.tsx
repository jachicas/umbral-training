"use client";

import { useState, useTransition } from "react";
import { Archive, ArchiveRestore } from "lucide-react";
import { archiveAthleteAction, restoreAthleteAction } from "@/app/athletes/actions";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

/** Archive (with a confirmation) or restore the athlete, from their page header. */
export function ArchiveControl({ athleteId, fullName, archived }: { athleteId: string; fullName: string; archived: boolean }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function run(action: (id: string) => Promise<{ error?: string }>) {
    startTransition(async () => {
      const result = await action(athleteId);
      setError(result.error);
      setConfirming(false);
    });
  }

  const buttonClass =
    "flex h-[42px] items-center gap-[7px] rounded-[10px] border px-4 text-[13.5px] font-bold transition-colors hover:bg-[var(--surface-2)] disabled:opacity-60";

  return (
    <div className="flex flex-col items-end gap-1">
      {archived ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(restoreAthleteAction)}
          className={buttonClass}
          style={{ borderColor: "var(--border)", color: "var(--text)" }}
        >
          <ArchiveRestore size={16} /> {pending ? "Restaurando…" : "Restaurar"}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className={buttonClass}
          style={{ borderColor: "var(--border)", color: "var(--text-2)" }}
        >
          <Archive size={16} /> Archivar
        </button>
      )}
      {error && (
        <span className="text-[12px] font-semibold" style={{ color: "var(--danger)" }}>
          {error}
        </span>
      )}
      <ConfirmDialog
        open={confirming}
        title={`¿Archivar a ${fullName}?`}
        description="Deja de aparecer en Atletas, en su grupo y en las semanas. Su cuota deja de correr desde este mes; lo que ya debe se mantiene. Puedes restaurarlo cuando vuelva."
        confirmLabel="Archivar"
        pending={pending}
        onConfirm={() => run(archiveAthleteAction)}
        onCancel={() => setConfirming(false)}
      />
    </div>
  );
}
