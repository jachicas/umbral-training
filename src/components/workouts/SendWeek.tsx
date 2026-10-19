"use client";

import { useState, useTransition } from "react";
import { ArrowRight, Check, Copy, FileDown, Link2, Send } from "lucide-react";
import { AthleteAvatar } from "@/components/athletes/AthleteAvatar";
import { markWeekSentAction } from "@/app/workouts/actions";
import { BackLink } from "./WorkoutsHeader";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SentBanner } from "./WeekParts";

export interface AthleteMessage {
  athleteId: string;
  fullName: string;
  avatarColor: string;
  phone?: string;
  /** Where the week's PDF goes when the week is sent. */
  email?: string;
  workoutCount: number;
  text: string;
}

const cardClass = "rounded-[18px] border p-5 shadow-[var(--shadow)]";
const cardStyle = { background: "var(--surface)", borderColor: "var(--border)" };

/**
 * Sending the week: it's locked, and each athlete with an email gets their
 * PDF. Each athlete's WhatsApp message and PDF are here too, to send by hand.
 */
export function SendWeek({
  weekStart,
  weekLabel,
  weekHref,
  sentOn,
  messages,
}: {
  weekStart: string;
  weekLabel: string;
  weekHref: string;
  /** Set once the coach marked the week as sent; it's locked from then on. */
  sentOn: string | null;
  messages: AthleteMessage[];
}) {
  const [activeId, setActiveId] = useState(messages[0]?.athleteId);
  const [copied, setCopied] = useState<string[]>([]);
  const [copyError, setCopyError] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [sending, startSending] = useTransition();
  const [sendError, setSendError] = useState<string>();

  const withEmail = messages.filter((m) => m.email).length;

  function send() {
    startSending(async () => {
      const result = await markWeekSentAction(weekStart);
      setSendError(result?.error);
      setConfirming(false);
    });
  }

  const activeIndex = messages.findIndex((m) => m.athleteId === activeId);
  const active = messages[activeIndex];
  const next = messages[activeIndex + 1];

  async function copy(message: AthleteMessage) {
    try {
      await navigator.clipboard.writeText(message.text);
      setCopyError(false);
      setCopied((c) => (c.includes(message.athleteId) ? c : [...c, message.athleteId]));
    } catch {
      setCopyError(true);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <BackLink href={weekHref}>Semana</BackLink>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="m-0 text-[24px] font-bold tracking-[-.4px]">Enviar semana {weekLabel}</h1>
          <div className="mt-1" style={{ color: "var(--text-2)" }}>
            Al enviarla, cada atleta con email recibe su PDF. También puedes copiar su mensaje para WhatsApp ·{" "}
            <b style={{ color: "var(--text)" }}>
              {copied.length}/{messages.length}
            </b>{" "}
            copiados
          </div>
        </div>
        {messages.length > 0 && (
          <div className="flex flex-wrap items-start gap-2.5">
            <a
              href={`/workouts/pdf/${weekStart}`}
              download
              className="flex h-[38px] items-center gap-1.5 rounded-[10px] border px-4 text-[13px] font-bold"
              style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
            >
              <FileDown size={14} /> Descargar PDFs
            </a>
            {!sentOn && (
              <span className="inline-flex flex-col items-end gap-1">
                <button
                  type="button"
                  onClick={() => setConfirming(true)}
                  className="flex h-[38px] items-center gap-1.5 rounded-[10px] px-4 text-[13px] font-bold text-white shadow-[var(--shadow)] transition-[filter] hover:brightness-110"
                  style={{ background: "var(--coral)" }}
                >
                  <Send size={14} /> Enviar semana
                </button>
                {sendError && (
                  <span className="text-[11.5px] font-semibold" style={{ color: "var(--danger)" }}>
                    {sendError}
                  </span>
                )}
              </span>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirming}
        title={`Enviar semana ${weekLabel}`}
        description={
          (withEmail > 0
            ? `Le llega su PDF por email a ${withEmail} de ${messages.length} ${messages.length === 1 ? "atleta" : "atletas"}.`
            : "Ningún atleta tiene email: no sale ningún correo.") + " Después la semana ya no se puede cambiar."
        }
        confirmLabel={sending ? "Enviando…" : "Enviar"}
        tone="primary"
        pending={sending}
        onConfirm={send}
        onCancel={() => setConfirming(false)}
      />

      {sentOn && <SentBanner sentOn={sentOn} />}

      {messages.length === 0 ? (
        <div className={cardClass} style={cardStyle}>
          <div className="py-10 text-center text-[13.5px]" style={{ color: "var(--text-3)" }}>
            No hay entrenos asignados esta semana.
          </div>
        </div>
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-[320px_1fr]">
          <div className={cardClass} style={cardStyle}>
            <div className="flex flex-col gap-1">
              {messages.map((m) => {
                const isActive = m.athleteId === activeId;
                const isCopied = copied.includes(m.athleteId);
                return (
                  <button
                    key={m.athleteId}
                    type="button"
                    onClick={() => setActiveId(m.athleteId)}
                    aria-current={isActive ? "true" : undefined}
                    className="flex items-center gap-3 rounded-[11px] px-2 py-2 text-left transition-colors hover:bg-[var(--surface-2)]"
                    style={isActive ? { background: "var(--surface-2)", boxShadow: "inset 3px 0 0 var(--coral)" } : undefined}
                  >
                    <AthleteAvatar fullName={m.fullName} color={m.avatarColor} size={32} radius={9} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13.5px] font-semibold">{m.fullName}</div>
                      <div className="text-[11.5px]" style={{ color: "var(--text-3)" }}>
                        {m.workoutCount} {m.workoutCount === 1 ? "entreno" : "entrenos"}
                        {!m.email && " · sin email"}
                      </div>
                    </div>
                    {isCopied && (
                      <span className="flex items-center gap-1 text-[11.5px] font-bold" style={{ color: "var(--ok)" }}>
                        <Check size={13} strokeWidth={3} /> Copiado
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {active && (
            <div className={cardClass} style={cardStyle}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <AthleteAvatar fullName={active.fullName} color={active.avatarColor} size={38} radius={11} />
                  <div>
                    <div className="text-[15px] font-bold">{active.fullName}</div>
                    <div className="text-[12px]" style={{ color: "var(--text-3)" }}>
                      {active.phone ?? "Sin teléfono registrado"}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={`/workouts/pdf/${weekStart}/${active.athleteId}`}
                    download
                    className="flex h-10 items-center gap-1.5 rounded-[10px] border px-3.5 text-[13px] font-bold"
                    style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
                  >
                    <FileDown size={14} /> PDF
                  </a>
                  <button
                    type="button"
                    disabled
                    title="Pronto: un link de solo lectura para el atleta"
                    className="flex h-10 cursor-not-allowed items-center gap-1.5 rounded-[10px] border px-3.5 text-[13px] font-bold"
                    style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-3)" }}
                  >
                    <Link2 size={14} /> Link <span className="text-[9px] tracking-[.04em]">PRONTO</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => copy(active)}
                    className="flex h-10 items-center gap-1.5 rounded-[10px] px-4 text-[13px] font-bold text-white shadow-[var(--shadow)] transition-[filter] hover:brightness-110"
                    style={{ background: copied.includes(active.athleteId) ? "var(--ok)" : "var(--coral)" }}
                  >
                    {copied.includes(active.athleteId) ? <Check size={14} strokeWidth={3} /> : <Copy size={14} />}
                    {copied.includes(active.athleteId) ? "Copiado" : "Copiar mensaje"}
                  </button>
                  {next && copied.includes(active.athleteId) && (
                    <button
                      type="button"
                      onClick={() => setActiveId(next.athleteId)}
                      className="flex h-10 items-center gap-1.5 rounded-[10px] border px-3.5 text-[13px] font-bold"
                      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                    >
                      Siguiente <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              </div>

              {copyError && (
                <div className="mb-3 text-[12.5px] font-semibold" style={{ color: "var(--danger)" }}>
                  No se pudo copiar. Selecciona el texto y cópialo a mano.
                </div>
              )}

              {/* WhatsApp-style bubble */}
              <div className="rounded-[14px] p-4" style={{ background: "var(--surface-2)" }}>
                <div
                  className="max-w-[520px] rounded-[12px] rounded-tl-[4px] px-4 py-3 text-[13.5px] leading-[1.55] whitespace-pre-wrap shadow-[var(--shadow)] select-text"
                  style={{ background: "rgba(37,211,102,.14)", color: "var(--text)" }}
                >
                  {active.text}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
