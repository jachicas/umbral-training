import type { Metadata } from "next";
import { getPaymentsOverview } from "@/lib/services/payments";
import { getSettings } from "@/lib/services/settings";
import { monthName } from "@/lib/domain/payments";
import { PaymentsView } from "@/components/payments/PaymentsView";
import { PaymentInstructionsCard } from "@/components/payments/PaymentInstructionsCard";
import { ReceiptsBanner } from "@/components/payments/ReceiptsBanner";

export const metadata: Metadata = { title: "Pagos · Umbral Training" };

export default async function PaymentsPage() {
  const [overview, settings] = await Promise.all([getPaymentsOverview(), getSettings()]);
  const { owingCount } = overview.summary;
  const month = monthName(overview.month);

  return (
    <div className="flex flex-col gap-[22px]">
      <div>
        <h1 className="m-0 text-[24px] font-bold tracking-[-.4px]">Pagos</h1>
        <div className="mt-1" style={{ color: "var(--text-2)" }}>
          {month.charAt(0).toUpperCase() + month.slice(1)} {overview.month.slice(0, 4)} ·{" "}
          <b style={{ color: owingCount ? "var(--pend)" : "var(--text)" }}>
            {owingCount} {owingCount === 1 ? "atleta debe" : "atletas deben"}
          </b>{" "}
          su cuota
        </div>
      </div>

      <ReceiptsBanner pending={overview.summary.pendingReportsCount} />

      <PaymentsView overview={overview} />

      <PaymentInstructionsCard instructions={settings.paymentInstructions} />
    </div>
  );
}
