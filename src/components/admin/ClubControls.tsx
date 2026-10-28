"use client";

import { useActionState, useState, useTransition } from "react";
import { ImageUp, LogIn, Mail, Pause, Play, Trash2 } from "lucide-react";
import {
  reactivateClubAction,
  removeLogoAction,
  resendCoachInviteAction,
  suspendClubAction,
  uploadLogoAction,
  viewClubAction,
  type ClubActionState,
} from "@/app/admin/actions";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FieldError } from "@/components/athletes/fields/FieldError";
import type { Club } from "@/lib/domain/clubs";

const outlineButton =
  "inline-flex h-9 items-center gap-1.5 rounded-[9px] border px-3.5 text-[13px] font-bold transition-colors hover:bg-[var(--surface-2)] disabled:opacity-60";
const outlineStyle = { borderColor: "var(--border)", color: "var(--text)" };

/** Runs one of the club's buttons, keeping its error (if any) to show beside it. */
function useClubAction() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const run = (action: () => Promise<ClubActionState>) =>
    startTransition(async () => setError((await action()).error));
  return { pending, error, run };
}

/** Enters the coach's panel as this club's guest: what changes there, its coach sees. */
export function ViewClubButton({ clubId }: { clubId: string }) {
  return (
    <form action={viewClubAction.bind(null, clubId)}>
      <button
        type="submit"
        className="flex h-[42px] items-center gap-[7px] rounded-[10px] px-[18px] text-[13.5px] font-bold shadow-[var(--shadow)] transition-[filter] hover:brightness-110"
        style={{ background: "var(--coral)", color: "var(--on-coral)" }}
      >
        <LogIn size={16} /> Entrar como invitado
      </button>
    </form>
  );
}

export function ResendInviteButton({ clubId }: { clubId: string }) {
  const { pending, error, run } = useClubAction();
  const [sent, setSent] = useState(false);

  return (
    <div className="flex flex-col items-start gap-1.5">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setSent(false);
          run(async () => {
            const result = await resendCoachInviteAction(clubId);
            setSent(!result.error);
            return result;
          });
        }}
        className={outlineButton}
        style={outlineStyle}
      >
        <Mail size={14} /> {pending ? "Enviando…" : sent ? "Enviada" : "Reenviar invitación"}
      </button>
      <FieldError message={error} />
    </div>
  );
}

/** Suspends (asking first) or reactivates the club. */
export function SuspensionButton({ club }: { club: Club }) {
  const { pending, error, run } = useClubAction();
  const [confirming, setConfirming] = useState(false);

  if (club.suspendedAt) {
    return (
      <div className="flex flex-col items-start gap-1.5">
        <button type="button" disabled={pending} onClick={() => run(() => reactivateClubAction(club.id))} className={outlineButton} style={outlineStyle}>
          <Play size={14} /> {pending ? "Reactivando…" : "Reactivar"}
        </button>
        <FieldError message={error} />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1.5">
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className={outlineButton}
        style={{ borderColor: "var(--border)", color: "var(--danger)" }}
      >
        <Pause size={14} /> Suspender
      </button>
      <FieldError message={error} />
      <ConfirmDialog
        open={confirming}
        title={`¿Suspender ${club.name}?`}
        confirmLabel="Suspender"
        pending={pending}
        onCancel={() => setConfirming(false)}
        onConfirm={() =>
          run(async () => {
            const result = await suspendClubAction(club.id);
            setConfirming(false);
            return result;
          })
        }
      />
    </div>
  );
}

/** Uploads (or replaces) the logo, or removes it. */
export function LogoControls({ club }: { club: Club }) {
  const [state, formAction, uploading] = useActionState(uploadLogoAction.bind(null, club.id), {});
  const remove = useClubAction();

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <form action={formAction} className="flex items-center gap-2">
          <label className={`${outlineButton} cursor-pointer`} style={outlineStyle}>
            <ImageUp size={14} /> {uploading ? "Subiendo…" : club.logoUrl ? "Cambiar logo" : "Subir logo"}
            <input
              type="file"
              name="logo"
              accept="image/png,image/jpeg"
              className="sr-only"
              disabled={uploading}
              onChange={(e) => e.currentTarget.form?.requestSubmit()}
            />
          </label>
        </form>
        {club.logoUrl && (
          <button
            type="button"
            disabled={remove.pending}
            onClick={() => remove.run(() => removeLogoAction(club.id))}
            className={outlineButton}
            style={{ borderColor: "var(--border)", color: "var(--danger)" }}
          >
            <Trash2 size={14} /> {remove.pending ? "Quitando…" : "Quitar"}
          </button>
        )}
      </div>
      <FieldError message={state.errors?.logo ?? state.errors?.general ?? remove.error} />
    </div>
  );
}
