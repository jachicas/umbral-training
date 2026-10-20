"use client";

import { useMemo, useState } from "react";
import { FilterSelect, type FilterOption } from "@/components/ui/filter-select";
import { isPendingOrOverdue } from "@/lib/domain/payments";
import { AthleteTable } from "./AthleteTable";
import { AddAthleteButton } from "./AddAthleteButton";
import type { AthleteRowVM } from "./types";

type PayFilter = "all" | "paid" | "pending" | "free";
type AccessFilter = "all" | "draft" | "invited" | "linked";

const PAY_FILTERS: FilterOption<PayFilter>[] = [
  { value: "all", label: "Todos" },
  { value: "paid", label: "Pagados" },
  { value: "pending", label: "Pendientes" },
  { value: "free", label: "Gratis" },
];

const ACCESS_FILTERS: FilterOption<AccessFilter>[] = [
  { value: "all", label: "Todos" },
  { value: "draft", label: "Borrador" },
  { value: "invited", label: "Invitado" },
  { value: "linked", label: "Vinculado" },
];

/** `archived`: the list of archived athletes, which only differs in its empty state. */
export function AthleteExplorer({ athletes, archived = false }: { athletes: AthleteRowVM[]; archived?: boolean }) {
  const [pay, setPay] = useState<PayFilter>("all");
  const [access, setAccess] = useState<AccessFilter>("all");

  const filtered = useMemo(() => {
    return athletes.filter((a) => {
      if (pay === "paid" && a.paymentStatus !== "paid") return false;
      // An athlete with no agreed fee owes nothing, so it is not "pending".
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

  if (athletes.length === 0 && archived) {
    return (
      <div
        className="rounded-[10px] border border-dashed px-4 py-16 text-center text-sm"
        style={{ borderColor: "var(--border-2)", color: "var(--text-2)" }}
      >
        No tienes atletas archivados.
      </div>
    );
  }

  if (athletes.length === 0) {
    return (
      <div
        className="flex flex-col items-center gap-3.5 rounded-[10px] border border-dashed px-4 py-16 text-center"
        style={{ borderColor: "var(--border-2)" }}
      >
        <div>
          <p className="text-[15px] font-bold">Aún no tienes atletas</p>
        </div>
        <AddAthleteButton />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[22px]">
      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect label="Pago" value={pay} defaultValue="all" options={PAY_FILTERS} onChange={setPay} />
        <FilterSelect label="Acceso" value={access} defaultValue="all" options={ACCESS_FILTERS} onChange={setAccess} />
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
