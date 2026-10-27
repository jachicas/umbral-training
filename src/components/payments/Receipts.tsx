"use client";

import { useState, useTransition } from "react";
import { Check, ExternalLink, FileText, Maximize2, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { confirmReportAction, rejectReportAction } from "@/app/payments/actions";
import { FormDialog } from "@/components/athletes/fields/FormDialog";
import { FieldError } from "@/components/athletes/fields/FieldError";
import { Label } from "@/components/ui/label";
import { formatMoney, periodsLabel, type PaymentReport } from "@/lib/domain/payments";
import { formatDateEs } from "@/lib/domain/time";

/** Browsers can't draw HEIC (or a PDF) in an <img>: those get an icon and a link. */
const isDrawable = (mime: string) => /^image\/(jpeg|png|webp|gif)$/.test(mime);

/**
 * Receipts waiting for review: transfers athletes reported. Confirming
 * settles the months as paid; rejecting sends it back with a reason.
 */
export function PendingReceipts({ reports }: { reports: PaymentReport[] }) {
  if (reports.length === 0) {
    return <Empty>No hay pagos por confirmar.</Empty>;
  }
  return (
    <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
      {reports.map((report) => (
        <ReportRow key={report.id} report={report} />
      ))}
    </ul>
  );
}

/** Receipts already confirmed or rejected, newest review first, to look one up again. */
export function ReviewedReceipts({ reports }: { reports: PaymentReport[] }) {
  if (reports.length === 0) {
    return <Empty>Sin recibos revisados.</Empty>;
  }
  return (
    <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
      {reports.map((report) => {
        const confirmed = report.status === "confirmed";
        return (
          <li
            key={report.id}
            className="flex flex-wrap items-center gap-3.5 rounded-[14px] border p-2.5"
            style={{ borderColor: "var(--border)", background: "var(--surface)" }}
          >
            <Thumb report={report} />
            <div className="min-w-[180px] flex-1">
              <div className="text-[14.5px] font-bold">{report.athleteName}</div>
              <div className="text-[13px]" style={{ color: "var(--text-2)" }}>
                <b className="tabular-nums" style={{ color: "var(--text)" }}>
                  {formatMoney(report.amount, report.currency)}
                </b>{" "}
                · {periodsLabel(report.periods)} · pagó el {formatDateEs(report.paidOn)}
              </div>
              {!confirmed && report.rejectionReason && (
                <div className="mt-0.5 text-[12.5px]" style={{ color: "var(--text-3)" }}>
                  Motivo: {report.rejectionReason}
                </div>
              )}
            </div>
            <div className="text-right">
              <span
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-bold"
                style={
                  confirmed
                    ? { color: "var(--ok)", background: "rgba(22,163,74,.12)" }
                    : { color: "var(--danger)", background: "rgba(220,38,38,.12)" }
                }
              >
                {confirmed ? <Check size={13} /> : <X size={13} />} {confirmed ? "Confirmado" : "Rechazado"}
              </span>
              {report.reviewedAt && (
                <div className="mt-1 text-[11.5px]" style={{ color: "var(--text-3)" }}>
                  {formatDateEs(report.reviewedAt.slice(0, 10))}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-[14px] border border-dashed px-4 py-10 text-center text-[13.5px]"
      style={{ borderColor: "var(--border-2)", color: "var(--text-2)" }}
    >
      {children}
    </div>
  );
}

/** The receipt's photo (or a file icon); it opens the viewer. */
function Thumb({ report }: { report: PaymentReport }) {
  return (
    <ReceiptViewer
      report={report}
      tile
      className="relative flex size-16 flex-none cursor-zoom-in items-center justify-center overflow-hidden rounded-[11px] border"
    >
      {report.receiptUrl && isDrawable(report.receiptMime) ? (
        // eslint-disable-next-line @next/next/no-img-element -- a signed storage link
        <img src={report.receiptUrl} alt={`Comprobante de ${report.athleteName}`} className="size-full object-cover" />
      ) : (
        <FileText size={24} />
      )}
    </ReceiptViewer>
  );
}

/**
 * Opens the receipt over the page, as big as the screen allows: a photo, a
 * PDF in its own frame, or (HEIC, which browsers can't draw) a link to it.
 */
function ReceiptViewer({
  report,
  className,
  tile = false,
  children,
}: {
  report: PaymentReport;
  className: string;
  /** The thumbnail's framed tile; otherwise a plain text link. */
  tile?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const url = report.receiptUrl;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={!url}
        title="Ver comprobante"
        className={className}
        style={tile ? { borderColor: "var(--border)", background: "var(--surface-3)", color: "var(--text-2)" } : { color: "var(--coral)" }}
      >
        {children}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-[20px] sm:max-w-[min(860px,calc(100%-2rem))]">
          <DialogHeader>
            <DialogTitle>Comprobante de {report.athleteName}</DialogTitle>
            <DialogDescription>
              {formatMoney(report.amount, report.currency)} · {periodsLabel(report.periods)} · pagó el {formatDateEs(report.paidOn)}
              {report.note ? ` · “${report.note}”` : ""}
            </DialogDescription>
          </DialogHeader>

          <div
            className="flex items-center justify-center overflow-hidden rounded-[14px]"
            style={{ background: "rgba(0,0,0,.35)" }}
          >
            {!url ? null : isDrawable(report.receiptMime) ? (
              // eslint-disable-next-line @next/next/no-img-element -- a signed storage link
              <img src={url} alt={`Comprobante de ${report.athleteName}`} className="max-h-[72vh] w-auto max-w-full object-contain" />
            ) : report.receiptMime === "application/pdf" ? (
              <iframe src={url} title={`Comprobante de ${report.athleteName}`} className="h-[72vh] w-full bg-white" />
            ) : (
              <div className="flex flex-col items-center gap-2 px-6 py-14 text-center text-[13.5px]" style={{ color: "#e7e5e4" }}>
                <FileText size={30} />
                Vista previa no disponible.
              </div>
            )}
          </div>

          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-fit items-center gap-1.5 text-[13px] font-semibold"
            >
              Abrir en otra pestaña <ExternalLink size={13} />
            </a>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function ReportRow({ report }: { report: PaymentReport }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function confirm() {
    setError(null);
    startTransition(async () => {
      const res = await confirmReportAction(report.id);
      if (res.error) setError(res.error);
    });
  }

  return (
    <li
      className="flex flex-wrap items-center gap-3.5 rounded-[14px] border p-2.5"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      <Thumb report={report} />

      <div className="min-w-[180px] flex-1">
        <div className="text-[14.5px] font-bold">{report.athleteName}</div>
        <div className="text-[13px]" style={{ color: "var(--text-2)" }}>
          <b className="tabular-nums" style={{ color: "var(--text)" }}>
            {formatMoney(report.amount, report.currency)}
          </b>{" "}
          · {periodsLabel(report.periods)} · pagó el {formatDateEs(report.paidOn)}
        </div>
        {report.note && (
          <div className="mt-0.5 text-[12.5px] italic" style={{ color: "var(--text-3)" }}>
            “{report.note}”
          </div>
        )}
        <ReceiptViewer report={report} className="mt-1 inline-flex items-center gap-1 text-[12px] font-semibold">
          Ver comprobante <Maximize2 size={12} />
        </ReceiptViewer>
        {error && <FieldError message={error} />}
      </div>

      <div className="flex items-center gap-2">
        <FormDialog
          title={`Rechazar el pago de ${report.athleteName}`}
          description={`${formatMoney(report.amount, report.currency)} · ${periodsLabel(report.periods)}`}
          action={rejectReportAction.bind(null, report.id)}
          submitLabel="Rechazar"
          pendingLabel="Rechazando…"
          trigger={
            <button
              type="button"
              disabled={pending}
              className="inline-flex h-9 items-center gap-1.5 rounded-[9px] border px-3 text-[13px] font-bold transition-colors hover:bg-[var(--surface-3)] disabled:opacity-60"
              style={{ borderColor: "var(--border)", color: "var(--text)" }}
            >
              <X size={15} /> Rechazar
            </button>
          }
        >
          {(errors) => (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`reason-${report.id}`}>Motivo (lo ve el atleta)</Label>
              <textarea
                id={`reason-${report.id}`}
                name="reason"
                rows={3}
                maxLength={300}
                className="rounded-[10px] border px-3 py-2 text-[14px] outline-none"
                style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" }}
              />
              <FieldError message={errors.general} />
            </div>
          )}
        </FormDialog>
        <button
          type="button"
          onClick={confirm}
          disabled={pending}
          className="inline-flex h-9 items-center gap-1.5 rounded-[9px] px-3.5 text-[13px] font-bold text-white transition-[filter] hover:brightness-110 disabled:opacity-60"
          style={{ background: "var(--ok)" }}
        >
          <Check size={15} /> {pending ? "Confirmando…" : "Sí, me llegó"}
        </button>
      </div>
    </li>
  );
}
