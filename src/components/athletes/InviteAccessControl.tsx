"use client";

import { useState, useTransition } from "react";
import { Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { sendInviteAction, cancelInviteAction } from "@/app/athletes/actions";
import type { AccessStatus } from "@/lib/domain/types";

export function InviteAccessControl({
  athleteId,
  status,
  email,
  variant = "row",
}: {
  athleteId: string;
  status: AccessStatus;
  email?: string;
  variant?: "row" | "detail";
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [emailPromptOpen, setEmailPromptOpen] = useState(false);
  const [emailDraft, setEmailDraft] = useState("");

  if (status === "linked") return null;

  function runInvite(inviteEmail?: string) {
    setError(null);
    startTransition(async () => {
      const res = await sendInviteAction(athleteId, inviteEmail);
      if (res.error) {
        setError(res.error);
        return;
      }
      setEmailPromptOpen(false);
    });
  }

  function handleInviteClick() {
    if (!email) {
      setEmailDraft("");
      setError(null);
      setEmailPromptOpen(true);
      return;
    }
    runInvite();
  }

  function handleCancelClick() {
    setError(null);
    startTransition(async () => {
      const res = await cancelInviteAction(athleteId);
      if (res.error) setError(res.error);
    });
  }

  const isDetail = variant === "detail";
  const actionClass = isDetail
    ? "inline-flex h-9 items-center gap-1.5 rounded-[8px] border px-3 text-[13px] font-bold transition-colors hover:bg-[var(--surface-2)] disabled:opacity-60"
    : "inline-flex items-center gap-1 text-[12px] font-bold disabled:opacity-60";

  return (
    <div className="flex items-center gap-2.5">
      {status === "draft" && (
        <button
          type="button"
          onClick={handleInviteClick}
          disabled={pending}
          className={cn(actionClass)}
          style={{ color: isDetail ? "var(--text)" : "var(--coral)", borderColor: "var(--border)" }}
        >
          {pending ? (
            <>
              <Loader2 size={13} className="animate-spin" /> Enviando…
            </>
          ) : (
            "Invitar"
          )}
        </button>
      )}

      {status === "invited" && (
        <>
          <button
            type="button"
            onClick={handleInviteClick}
            disabled={pending}
            className={cn(actionClass)}
            style={{ color: isDetail ? "var(--text)" : "var(--coral)", borderColor: "var(--border)" }}
          >
            {pending ? (
              <>
                <Loader2 size={13} className="animate-spin" /> Enviando…
              </>
            ) : (
              "Reenviar invitación"
            )}
          </button>
          <button
            type="button"
            onClick={handleCancelClick}
            disabled={pending}
            title="Cancelar invitación"
            aria-label="Cancelar invitación"
            className="inline-flex size-5 flex-none items-center justify-center rounded-full transition-colors hover:bg-[var(--surface-2)] disabled:opacity-60"
            style={{ color: "var(--text-3)" }}
          >
            <X size={13} />
          </button>
        </>
      )}

      {error && !emailPromptOpen && (
        <span className="text-[11.5px] font-semibold" style={{ color: "var(--danger)" }}>
          {error}
        </span>
      )}

      <Dialog open={emailPromptOpen} onOpenChange={setEmailPromptOpen}>
        <DialogContent className="rounded-[18px] sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle>Añade un email para invitar</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`invite-email-${athleteId}`}>Email</Label>
            <Input
              id={`invite-email-${athleteId}`}
              type="email"
              placeholder="marta@ejemplo.com"
              value={emailDraft}
              onChange={(e) => setEmailDraft(e.target.value)}
            />
          </div>
          {error && (
            <p className="text-sm font-medium" style={{ color: "var(--danger)" }}>
              {error}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-[10px]"
              onClick={() => setEmailPromptOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={pending}
              className="h-10 rounded-[10px] font-bold"
              onClick={() => runInvite(emailDraft)}
            >
              {pending ? "Enviando…" : "Enviar invitación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
