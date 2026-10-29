"use client";

import { useState, useTransition } from "react";
import { Loader2, Send, X } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { sendInvitesAction, type InvitesActionResult } from "@/app/athletes/actions";

const athletesLabel = (n: number) => (n === 1 ? "1 atleta" : `${n} atletas`);

/** Sends the portal invite to the picked athletes in one go; the API queues one email each. */
export function BulkInviteBar({
  athleteIds,
  onClear,
  onDone,
}: {
  athleteIds: string[];
  onClear: () => void;
  onDone: (result: InvitesActionResult) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function send() {
    setError(null);
    startTransition(async () => {
      const res = await sendInvitesAction(athleteIds);
      setConfirming(false);
      if (res.error) {
        setError(res.error);
        return;
      }
      onDone(res);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2.5 sm:ml-auto">
      {error && (
        <span className="text-[12px] font-semibold" style={{ color: "var(--danger)" }}>
          {error}
        </span>
      )}
      <span className="text-[13px] font-semibold" style={{ color: "var(--text-2)" }}>
        {athleteIds.length === 1 ? "1 seleccionado" : `${athleteIds.length} seleccionados`}
      </span>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        disabled={pending}
        className="inline-flex h-9 items-center gap-1.5 rounded-[8px] px-3.5 text-[13px] font-bold disabled:opacity-60"
        style={{ background: "var(--coral)", color: "var(--on-coral)" }}
      >
        {pending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        Enviar invitación
      </button>
      <button
        type="button"
        onClick={onClear}
        disabled={pending}
        aria-label="Quitar selección"
        title="Quitar selección"
        className="inline-flex size-9 items-center justify-center rounded-[8px] border transition-colors hover:bg-[var(--surface-2)] disabled:opacity-60"
        style={{ borderColor: "var(--border)", color: "var(--text-2)" }}
      >
        <X size={15} />
      </button>

      <ConfirmDialog
        open={confirming}
        title={`¿Enviar invitación a ${athletesLabel(athleteIds.length)}?`}
        confirmLabel={pending ? "Enviando…" : "Enviar"}
        pending={pending}
        tone="primary"
        onConfirm={send}
        onCancel={() => setConfirming(false)}
      />
    </div>
  );
}

/** What the last bulk invite did: how many went out, and who was left out and why. */
export function BulkInviteResult({ result, onDismiss }: { result: InvitesActionResult; onDismiss: () => void }) {
  const invited = result.invitedCount ?? 0;
  const skipped = result.skipped ?? [];

  return (
    <div
      className="flex items-start gap-3 rounded-[10px] border px-4 py-3 text-[13px]"
      style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        {invited > 0 && (
          <p className="m-0 font-semibold">
            {invited === 1 ? "1 invitación en camino" : `${invited} invitaciones en camino`}
          </p>
        )}
        {skipped.length > 0 && (
          <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
            {skipped.map((s) => (
              <li key={s.athleteId} style={{ color: "var(--text-2)" }}>
                <b style={{ color: "var(--text)" }}>{s.fullName}</b>: {s.reason}
              </li>
            ))}
          </ul>
        )}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Cerrar"
        className="inline-flex size-6 flex-none items-center justify-center rounded-full transition-colors hover:bg-[var(--surface-2)]"
        style={{ color: "var(--text-3)" }}
      >
        <X size={14} />
      </button>
    </div>
  );
}
