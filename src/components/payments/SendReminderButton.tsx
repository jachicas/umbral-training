"use client";

import { useState, useTransition } from "react";
import { Send } from "lucide-react";
import { sendReminderAction } from "@/app/payments/actions";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatDateEs } from "@/lib/domain/time";

/** Today in the browser's timezone, "YYYY-MM-DD" (the coach's, in practice). */
function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Emails the athlete a fee reminder now, after asking. The API picks which one
 * (overdue or heads-up) and allows one a day; it's off without an email.
 */
export function SendReminderButton({
  athleteId,
  athleteName,
  email,
  lastRemindedOn,
  variant,
}: {
  athleteId: string;
  athleteName: string;
  email?: string;
  lastRemindedOn?: string;
  variant: "card" | "row";
}) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const sentToday = lastRemindedOn === todayISO();
  const disabled = !email || sentToday || pending;
  const why = !email ? "Sin email: agrégalo en su ficha para mandarle avisos" : sentToday ? "Ya se le mandó un aviso hoy" : undefined;

  function send() {
    startTransition(async () => {
      const result = await sendReminderAction(athleteId);
      setError(result.error);
      setConfirming(false);
    });
  }

  const dialog = (
    <ConfirmDialog
      open={confirming}
      title={`¿Mandarle un recordatorio a ${athleteName}?`}
      description={`Le llega a ${email} con lo que debe y cómo pagarte. Cuenta como su último aviso: el automático vuelve a salir en una semana si sigue debiendo.`}
      confirmLabel={pending ? "Enviando…" : "Enviar"}
      tone="primary"
      pending={pending}
      onConfirm={send}
      onCancel={() => setConfirming(false)}
    />
  );

  if (variant === "row") {
    return (
      <>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setConfirming(true)}
          aria-label={`Enviar recordatorio a ${athleteName}`}
          title={error ?? why ?? "Enviar recordatorio"}
          className="inline-flex size-8 items-center justify-center rounded-[8px] border transition-colors hover:bg-[var(--surface-2)] disabled:cursor-not-allowed disabled:opacity-40"
          style={{ borderColor: error ? "var(--danger)" : "var(--border)", color: error ? "var(--danger)" : "var(--text-2)" }}
        >
          <Send size={14} />
        </button>
        {dialog}
      </>
    );
  }

  return (
    <div className="mt-3 flex flex-col items-center gap-1">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setConfirming(true)}
        title={why}
        className="inline-flex h-9 items-center gap-1.5 rounded-[8px] px-3 text-[13px] font-bold transition-colors hover:bg-[var(--surface-2)] disabled:cursor-not-allowed disabled:opacity-50"
        style={{ color: "var(--text)" }}
      >
        <Send size={14} /> {sentToday ? "Aviso enviado hoy" : "Enviar recordatorio"}
      </button>
      <span className="text-[12px]" style={{ color: error ? "var(--danger)" : "var(--text-3)" }}>
        {error ?? (!email ? "Sin email: no recibe avisos" : lastRemindedOn ? `Último aviso: ${formatDateEs(lastRemindedOn)}` : "Aún no ha recibido avisos")}
      </span>
      {dialog}
    </div>
  );
}
