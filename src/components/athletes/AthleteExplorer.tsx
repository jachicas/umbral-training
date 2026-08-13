"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { isPendingOrOverdue } from "@/lib/domain/payments";
import { AthleteTable } from "./AthleteTable";
import { AddAthleteButton } from "./AddAthleteButton";
import type { AthleteRowVM } from "./types";

type PayFilter = "all" | "paid" | "pending" | "free";
type AccessFilter = "all" | "draft" | "invited" | "linked";

const PAY_FILTERS: { id: PayFilter; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "paid", label: "Pagados" },
  { id: "pending", label: "Pendientes" },
  { id: "free", label: "Gratis" },
];

const ACCESS_FILTERS: { id: AccessFilter; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "draft", label: "Borrador" },
  { id: "invited", label: "Invitado" },
  { id: "linked", label: "Vinculado" },
];

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-8 rounded-lg border px-3 text-[12.5px] font-bold transition-colors",
        active ? "border-transparent text-white" : "hover:bg-[var(--surface-2)]"
      )}
      style={
        active
          ? { background: "var(--coral)" }
          : { background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }
      }
    >
      {children}
    </button>
  );
}

export function AthleteExplorer({ athletes }: { athletes: AthleteRowVM[] }) {
  const [pay, setPay] = useState<PayFilter>("all");
  const [access, setAccess] = useState<AccessFilter>("all");

  const filtered = useMemo(() => {
    return athletes.filter((a) => {
      if (pay === "paid" && a.paymentStatus !== "paid") return false;
      // An athlete with no agreed cuota owes nothing, so it is not "pendiente".
      if (pay === "pending" && !(a.paymentConfigured && isPendingOrOverdue(a.paymentStatus))) {
        return false;
      }
      if (pay === "free" && a.paymentStatus !== "waived") return false;
      if (access !== "all" && a.accessStatus !== access) return false;
      return true;
    });
  }, [athletes, pay, access]);

  function clearFilters() {
    setPay("all");
    setAccess("all");
  }

  return (
    <div className="flex flex-col gap-[22px]">
      <div className="flex flex-wrap items-center gap-[22px]">
        <div className="flex items-center gap-2.5">
          <span
            className="text-xs font-bold tracking-[.03em] uppercase"
            style={{ color: "var(--text-3)" }}
          >
            Pago
          </span>
          <div className="flex flex-wrap gap-1.5">
            {PAY_FILTERS.map((f) => (
              <Pill key={f.id} active={pay === f.id} onClick={() => setPay(f.id)}>
                {f.label}
              </Pill>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <span
            className="text-xs font-bold tracking-[.03em] uppercase"
            style={{ color: "var(--text-3)" }}
          >
            Acceso
          </span>
          <div className="flex flex-wrap gap-1.5">
            {ACCESS_FILTERS.map((f) => (
              <Pill key={f.id} active={access === f.id} onClick={() => setAccess(f.id)}>
                {f.label}
              </Pill>
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div
          className="flex flex-col items-center gap-3.5 rounded-[10px] border border-dashed py-16 text-center"
          style={{ borderColor: "var(--border-2)" }}
        >
          <p className="text-sm" style={{ color: "var(--text-2)" }}>
            Ningún atleta coincide con estos filtros.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={clearFilters}
              className="h-9 rounded-[8px] border px-3.5 text-[13px] font-bold transition-colors hover:bg-[var(--surface-2)]"
              style={{ borderColor: "var(--border)", color: "var(--text)" }}
            >
              Quitar filtros
            </button>
            <AddAthleteButton />
          </div>
        </div>
      ) : (
        <AthleteTable athletes={filtered} />
      )}
    </div>
  );
}
