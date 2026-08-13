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

const initialState: FormState = {};

/**
 * Shell for every "edit one card" dialog: owns the action state, closes on
 * success, and remounts the form afterwards so field groups holding internal
 * state (disciplines, goal type) re-derive from fresh props next time.
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
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  submitLabel?: string;
  pendingLabel?: string;
  maxWidthClass?: string;
  children: (errors: Errors) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(action, initialState);
  const [lastHandled, setLastHandled] = useState(state);
  const [formKey, setFormKey] = useState(0);

  // Derived during render rather than in an effect — it only reacts to a value
  // that already changed (see "Adjusting state when a prop changes").
  if (state !== lastHandled) {
    setLastHandled(state);
    if (state.success) {
      setOpen(false);
      setFormKey((k) => k + 1);
    }
  }

  const errors = state.errors ?? {};

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className={`rounded-[18px] ${maxWidthClass}`}>
        <form key={formKey} action={formAction} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>

          {children(errors)}

          <FieldError message={errors.general} />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-[10px]"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={pending} className="h-10 rounded-[10px] font-bold">
              {pending ? pendingLabel : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
