"use client";

import { useActionState, useState, type ReactElement, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { FormState } from "@/app/athletes/actions";
import type { ValidationField } from "@/lib/services/athletes";
import { FieldError } from "./FieldError";

type Errors = Partial<Record<ValidationField, string>>;

type FormAction = (prev: FormState, formData: FormData) => Promise<FormState>;

const initialState: FormState = {};

/**
 * Shell for every "edit one card" dialog. The form body is keyed by how many
 * times the dialog has been opened, so each opening starts from a clean
 * action state (no errors left over from a cancelled attempt) and field
 * groups holding internal state (disciplines, goal type) re-derive from fresh
 * props.
 */
export function FormDialog({
  trigger,
  title,
  description,
  action,
  submitLabel = "Guardar",
  pendingLabel = "Guardando…",
  maxWidthClass = "sm:max-w-[440px]",
  children,
}: {
  trigger: ReactElement;
  title: string;
  description?: string;
  action: FormAction;
  submitLabel?: string;
  pendingLabel?: string;
  maxWidthClass?: string;
  children: (errors: Errors) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [openCount, setOpenCount] = useState(0);

  function handleOpenChange(next: boolean) {
    if (next) setOpenCount((n) => n + 1);
    setOpen(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={trigger} />
      <DialogContent className={`rounded-[18px] ${maxWidthClass}`}>
        <FormDialogBody
          key={openCount}
          title={title}
          description={description}
          action={action}
          submitLabel={submitLabel}
          pendingLabel={pendingLabel}
          onClose={() => setOpen(false)}
        >
          {children}
        </FormDialogBody>
      </DialogContent>
    </Dialog>
  );
}

function FormDialogBody({
  title,
  description,
  action,
  submitLabel,
  pendingLabel,
  onClose,
  children,
}: {
  title: string;
  description?: string;
  action: FormAction;
  submitLabel: string;
  pendingLabel: string;
  onClose: () => void;
  children: (errors: Errors) => ReactNode;
}) {
  const [state, formAction, pending] = useActionState(async (prev: FormState, formData: FormData) => {
    const next = await action(prev, formData);
    if (next.success) onClose();
    return next;
  }, initialState);

  const errors = state.errors ?? {};

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        {description && <DialogDescription>{description}</DialogDescription>}
      </DialogHeader>

      {children(errors)}

      <FieldError message={errors.general} />

      <DialogFooter>
        <Button type="button" variant="outline" className="h-10 rounded-[10px]" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={pending} className="h-10 rounded-[10px] font-bold">
          {pending ? pendingLabel : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}
