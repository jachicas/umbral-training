"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/** Asks before something that can't be undone with one click (removing a session, sending a week…). */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  pending = false,
  tone = "danger",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  pending?: boolean;
  /** "primary" for a step that commits rather than destroys (sending a week). */
  tone?: "danger" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent className="rounded-[18px] sm:max-w-[380px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" className="h-10 rounded-[10px]" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={pending}
            className="h-10 rounded-[10px] font-bold text-white"
            style={{ background: tone === "danger" ? "var(--danger)" : "var(--coral)" }}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
