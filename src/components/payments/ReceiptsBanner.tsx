import Link from "next/link";
import { ChevronRight, Hourglass, ReceiptText } from "lucide-react";

/**
 * On Pagos, a pointer to the receipts page: a banner while payments wait
 * to be confirmed, a quiet link otherwise.
 */
export function ReceiptsBanner({ pending }: { pending: number }) {
  if (pending === 0) {
    return (
      <Link
        href="/payments/receipts"
        className="inline-flex w-fit items-center gap-1.5 text-[13px] font-semibold text-[var(--text-2)] transition-colors hover:text-[var(--coral)]"
      >
        <ReceiptText size={15} /> Ver recibos
      </Link>
    );
  }

  return (
    <Link
      href="/payments/receipts"
      className="flex items-center gap-3 rounded-[16px] border px-4 py-3 text-[var(--text)] shadow-[var(--shadow)] transition-[filter] hover:text-[var(--text)] hover:brightness-105"
      style={{ background: "var(--surface)", borderColor: "var(--pend)" }}
    >
      <span
        className="flex size-9 flex-none items-center justify-center rounded-xl"
        style={{ color: "var(--pend)", background: "rgba(217,119,6,.12)" }}
      >
        <Hourglass size={17} />
      </span>
      <span className="min-w-0 flex-1">
        <b>
          {pending} {pending === 1 ? "pago por confirmar" : "pagos por confirmar"}
        </b>
      </span>
      <span className="inline-flex flex-none items-center gap-1 text-[13px] font-bold" style={{ color: "var(--coral)" }}>
        Ver recibos <ChevronRight size={15} />
      </span>
    </Link>
  );
}
