"use client";

import { useActionState, useState, startTransition } from "react";
import { Camera, FileText, Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { FieldError } from "@/components/athletes/fields/FieldError";
import { reportPaymentAction, type ReportState } from "@/app/portal/actions";
import { formatMoney, periodsLabel } from "@/lib/domain/payments";
import type { PayableMonth } from "@/lib/domain/portal";

const initialState: ReportState = {};

/** Phones take 4000 px photos; the receipt reads fine at this size. */
const MAX_SIDE = 1800;

/**
 * A big photo becomes a ~300 KB JPEG before it's sent. PDFs, HEIC (which
 * most browsers can't draw) and anything that fails to load go as they are.
 */
async function shrink(file: File): Promise<File> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 1_500_000) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

/** "Reportar pago": the months, when they paid, and a photo of the transfer receipt (required). */
export function ReportPaymentDialog({ payable, today }: { payable: PayableMonth[]; today: string }) {
  const [open, setOpen] = useState(false);
  const [months, setMonths] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState(reportPaymentAction, initialState);
  const [preparing, setPreparing] = useState(false);
  const errors = state.errors ?? {};

  const chosen = payable.slice(0, months);
  const total = chosen.reduce((sum, m) => sum + m.amount, 0);
  const currency = payable[0]?.currency ?? "$";

  // The state when the dialog opened: a newer successful one means it was sent, so it closes.
  const [openedWith, setOpenedWith] = useState(state);
  const shown = open && !(state.success && state !== openedWith);

  function pick(next: File | null) {
    if (preview) URL.revokeObjectURL(preview);
    setFile(next);
    setPreview(next && next.type.startsWith("image/") ? URL.createObjectURL(next) : null);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    data.set("months", String(months));
    if (file) {
      setPreparing(true);
      data.set("receipt", await shrink(file));
      setPreparing(false);
    } else {
      data.delete("receipt");
    }
    startTransition(() => formAction(data));
  }

  const busy = pending || preparing;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setMonths(1);
          pick(null);
          setOpenedWith(state);
          setOpen(true);
        }}
        className="inline-flex h-11 items-center gap-2 rounded-full px-5 text-[14px] font-bold text-[var(--on-coral)] shadow-[var(--shadow)] transition-[filter] hover:brightness-110"
        style={{ background: "var(--coral)" }}
      >
        <Send size={16} /> Reportar pago
      </button>

      <Dialog open={shown} onOpenChange={(next) => !busy && setOpen(next)}>
        <DialogContent className="rounded-[20px] sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Reportar pago</DialogTitle>
          </DialogHeader>

          <form onSubmit={submit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="report-months">Qué pagas</Label>
              {payable.length === 1 ? (
                <div
                  className="rounded-[10px] border px-3 py-2.5 text-[14px] font-semibold"
                  style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
                >
                  {periodsLabel(payable)} · {formatMoney(payable[0].amount, currency)}
                  {payable[0].advance && (
                    <span className="ml-1.5 text-[12px] font-medium" style={{ color: "var(--text-3)" }}>
                      (por adelantado)
                    </span>
                  )}
                </div>
              ) : (
                <NativeSelect
                  id="report-months"
                  value={months}
                  onChange={(e) => setMonths(Number(e.target.value))}
                  className="h-11 w-full text-[14px]"
                >
                  {payable.map((_, i) => {
                    const slice = payable.slice(0, i + 1);
                    return (
                      <option key={i} value={i + 1}>
                        {periodsLabel(slice)} · {formatMoney(slice.reduce((s, m) => s + m.amount, 0), currency)}
                      </option>
                    );
                  })}
                </NativeSelect>
              )}
              <FieldError message={errors.months} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Comprobante</Label>
              <label
                className="flex cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-[14px] border-2 border-dashed p-3 text-center text-[13px] transition-colors hover:bg-[var(--surface-2)]"
                style={{ borderColor: errors.receipt ? "var(--danger)" : "var(--border-2)", color: "var(--text-2)" }}
              >
                {preview ? (
                  // eslint-disable-next-line @next/next/no-img-element -- a local preview (blob: URL)
                  <img src={preview} alt="Comprobante" className="max-h-56 rounded-[10px] object-contain" />
                ) : file ? (
                  <span className="flex items-center gap-2 py-4 font-semibold" style={{ color: "var(--text)" }}>
                    <FileText size={18} /> {file.name}
                  </span>
                ) : (
                  <span className="flex flex-col items-center gap-1.5 py-5">
                    <Camera size={26} style={{ color: "var(--coral)" }} />
                    <b style={{ color: "var(--text)" }}>Toma o elige la foto</b>
                    <span className="text-[12px]">JPG, PNG o PDF, hasta 10 MB</span>
                  </span>
                )}
                {file && <span className="text-[12px] font-semibold" style={{ color: "var(--coral)" }}>Cambiar</span>}
                <input
                  type="file"
                  name="receipt"
                  accept="image/*,application/pdf"
                  className="sr-only"
                  onChange={(e) => pick(e.target.files?.[0] ?? null)}
                />
              </label>
              <FieldError message={errors.receipt} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="report-paid-on">Fecha del pago</Label>
                <Input id="report-paid-on" name="paidOn" type="date" defaultValue={today} max={today} required className="h-11" />
                <FieldError message={errors.paidOn} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="report-note">Referencia</Label>
                <Input id="report-note" name="note" maxLength={300} placeholder="Opcional" className="h-11" />
                <FieldError message={errors.note} />
              </div>
            </div>

            <FieldError message={errors.general} />

            <DialogFooter className="items-center sm:justify-between">
              <div className="text-[14px]" style={{ color: "var(--text-2)" }}>
                Total <b className="text-[17px] tabular-nums" style={{ color: "var(--text)" }}>{formatMoney(total, currency)}</b>
              </div>
              <Button type="submit" disabled={busy} className="h-11 rounded-[10px] px-5 font-bold">
                {busy ? "Enviando…" : "Enviar comprobante"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
