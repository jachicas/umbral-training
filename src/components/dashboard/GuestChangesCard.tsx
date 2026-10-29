import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { markGuestChangesSeenAction } from "@/app/actions";
import type { GuestChange } from "@/lib/domain/guest-changes";
import { formatDateEs, weekDatesISO } from "@/lib/domain/time";
import { weekRangeLabel } from "@/components/workouts/format";

/** Each API route the super admin can change something through, as the coach reads it. */
const ACTION_LABELS: Record<string, string> = {
  "POST athletes": "Agregó un atleta",
  "PUT athletes/{athlete}": "Editó los datos",
  "PATCH athletes/{athlete}": "Editó los datos",
  "PUT athletes/{athlete}/sport-profile": "Editó el perfil deportivo",
  "PUT athletes/{athlete}/goal": "Cambió la meta",
  "POST athletes/{athlete}/goals": "Agregó una carrera",
  "PUT athletes/{athlete}/goals/{goal}": "Editó una carrera",
  "DELETE athletes/{athlete}/goals/{goal}": "Quitó una carrera",
  "POST athletes/{athlete}/invite": "Invitó al portal",
  "POST athletes/invites": "Invitó al portal a varios atletas",
  "DELETE athletes/{athlete}/invite": "Canceló la invitación al portal",
  "POST athletes/{athlete}/records": "Registró un tiempo",
  "PUT athletes/{athlete}/membership": "Cambió la membresía",
  "POST athletes/{athlete}/membership/payments": "Marcó un mes como pagado",
  "DELETE athletes/{athlete}/membership/payments/{payment}": "Deshizo un pago",
  "POST athletes/{athlete}/membership/waivers": "Perdonó un mes",
  "POST athletes/{athlete}/membership/reminders": "Envió un recordatorio de pago",
  "POST athletes/{athlete}/archive": "Archivó",
  "DELETE athletes/{athlete}/archive": "Restauró",
  "PUT athletes/{athlete}/group": "Cambió de grupo",
  "POST payment-reports/{report}/confirm": "Confirmó un pago reportado",
  "POST payment-reports/{report}/reject": "Rechazó un pago reportado",
  "PUT settings": "Cambió las instrucciones de pago",
  "POST groups": "Creó un grupo",
  "PUT groups/{group}": "Renombró un grupo",
  "PATCH groups/{group}": "Renombró un grupo",
  "DELETE groups/{group}": "Eliminó un grupo",
  "POST library/sessions": "Creó un entreno en la biblioteca",
  "PUT library/sessions/{session}": "Editó un entreno de la biblioteca",
  "PATCH library/sessions/{session}": "Editó un entreno de la biblioteca",
  "DELETE library/sessions/{session}": "Eliminó un entreno de la biblioteca",
  "POST weeks/{week}/send": "Envió la semana",
  "POST weeks/{week}/groups/{group}/plan": "Armó la semana de un grupo",
  "POST weeks/{week}/athletes/{athlete}/days/{day}/sessions": "Agregó una sesión",
  "PUT weeks/{week}/athletes/{athlete}/sessions/{sessionId}": "Cambió una sesión",
  "DELETE weeks/{week}/athletes/{athlete}/sessions/{sessionId}": "Quitó una sesión",
  "PUT weeks/{week}/athletes/{athlete}/sessions/{sessionId}/repeats/{repeatId}": "Cambió las repeticiones",
  "PUT weeks/{week}/athletes/{athlete}/sessions/{sessionId}/steps/{stepId}": "Cambió la duración de un paso",
  "POST plans/{plan}/days/{day}/sessions": "Agregó una sesión al plan del grupo",
  "DELETE plans/{plan}/sessions/{sessionId}": "Quitó una sesión del plan del grupo",
  "POST races": "Agregó una carrera",
  "PUT races/{race}": "Editó una carrera",
  "PATCH races/{race}": "Editó una carrera",
};

/** "28 oct 2026 · 14:05": `createdAt` already comes in the coach's timezone. */
const when = (createdAt: string) => `${formatDateEs(createdAt.slice(0, 10))} · ${createdAt.slice(11, 16)}`;

/** What the super admin changed as a guest, until the coach marks it seen. Hidden when there's nothing. */
export function GuestChangesCard({
  changes,
  className,
  style,
}: {
  changes: GuestChange[];
  className: string;
  style: React.CSSProperties;
}) {
  if (changes.length === 0) return null;

  return (
    <div className={className} style={{ ...style, borderColor: "var(--coral)" }}>
      <div className="mb-3.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-base font-bold">
          <ShieldCheck size={18} style={{ color: "var(--coral)" }} /> Cambios del super admin
        </div>
        <form action={markGuestChangesSeenAction}>
          <button
            type="submit"
            className="h-8 rounded-[9px] px-3.5 text-[13px] font-bold transition-[filter] hover:brightness-110"
            style={{ background: "var(--coral)", color: "var(--on-coral)" }}
          >
            Entendido
          </button>
        </form>
      </div>

      <ul className="flex flex-col">
        {changes.map((change) => (
          <li
            key={change.id}
            className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 border-t py-2.5 text-[13.5px] first:border-t-0"
            style={{ borderColor: "var(--border)" }}
          >
            <span className="min-w-0">
              <b>{ACTION_LABELS[change.action] ?? "Hizo un cambio"}</b>
              {change.athlete && (
                <>
                  {" · "}
                  <Link href={`/athletes/${change.athlete.id}`} className="font-semibold" style={{ color: "var(--coral)" }}>
                    {change.athlete.fullName}
                  </Link>
                </>
              )}
              {change.weekStart && (
                <span style={{ color: "var(--text-2)" }}> · semana del {weekRangeLabel(weekDatesISO(change.weekStart))}</span>
              )}
            </span>
            <span className="flex-none text-[12.5px] tabular-nums" style={{ color: "var(--text-3)" }}>
              {when(change.createdAt)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
