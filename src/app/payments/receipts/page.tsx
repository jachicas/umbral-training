import type { Metadata } from "next";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { listReports } from "@/lib/services/payments";
import { BackLink } from "@/components/workouts/WorkoutsHeader";
import { PendingReceipts, ReviewedReceipts } from "@/components/payments/Receipts";

export const metadata: Metadata = { title: "Recibos · Umbral Training" };

/**
 * The receipts athletes sent with their transfers: the ones to confirm
 * (`?tab=pending`, the default) and the ones already reviewed.
 */
export default async function ReceiptsPage({ searchParams }: PageProps<"/payments/receipts">) {
  const { tab } = await searchParams;
  const reviewed = tab === "reviewed";
  // The pending count shows on its tab either way.
  const [pending, done] = await Promise.all([listReports("pending"), reviewed ? listReports("reviewed") : null]);

  return (
    <div className="flex flex-col gap-[18px]">
      <BackLink href="/payments">Pagos</BackLink>
      <h1 className="m-0 text-[24px] font-bold tracking-[-.4px]">Recibos</h1>

      <div className="inline-flex w-fit rounded-[12px] border p-1" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
        <Tab href="/payments/receipts" active={!reviewed}>
          Por confirmar
          {pending.length > 0 && (
            <span
              className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold text-white"
              style={{ background: "var(--pend)" }}
            >
              {pending.length}
            </span>
          )}
        </Tab>
        <Tab href="/payments/receipts?tab=reviewed" active={reviewed}>
          Revisados
        </Tab>
      </div>

      {reviewed ? <ReviewedReceipts reports={done ?? []} /> : <PendingReceipts reports={pending} />}
    </div>
  );
}

function Tab({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex items-center rounded-[9px] px-3.5 py-1.5 text-[13.5px] font-semibold transition-colors",
        active
          ? "bg-[var(--surface)] text-[var(--text)] shadow-[var(--shadow)] hover:text-[var(--text)]"
          : "text-[var(--text-2)] hover:text-[var(--text)]"
      )}
    >
      {children}
    </Link>
  );
}
