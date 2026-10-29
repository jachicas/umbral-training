"use client";

import { useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FilterSelect, type FilterOption } from "@/components/ui/filter-select";
import { Pagination } from "@/components/ui/pagination";
import { isPendingOrOverdue } from "@/lib/domain/payments";
import { AthleteTable, isInvitable } from "./AthleteTable";
import { AddAthleteButton } from "./AddAthleteButton";
import { BulkInviteBar, BulkInviteResult } from "./BulkInviteBar";
import type { InvitesActionResult } from "@/app/athletes/actions";
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

const PAGE_SIZE = 20;

/** Lowercase and without accents, so "umana" finds "Umaña". */
const normalize = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

/** `archived`: the list of archived athletes, which only differs in its empty state. */
export function AthleteExplorer({ athletes, archived = false }: { athletes: AthleteRowVM[]; archived?: boolean }) {
  // Typed in the header's search (`HeaderSearch`), which keeps it in the URL.
  const query = useSearchParams().get("q")?.trim() ?? "";
  const [pay, setPay] = useState<PayFilter>("all");
  const [access, setAccess] = useState<AccessFilter>("all");
  // Back to the first page whenever the filters or the search change.
  const filterKey = `${pay}|${access}|${query}`;
  const [pageAt, setPageAt] = useState({ key: filterKey, page: 1 });
  const listRef = useRef<HTMLDivElement>(null);
  // Picked to invite at once. Only those still shown and invitable count, so a filter hides them from the send too.
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [inviteResult, setInviteResult] = useState<InvitesActionResult | null>(null);

  const filtered = useMemo(() => {
    const terms = normalize(query).split(/\s+/).filter(Boolean);
    return athletes.filter((a) => {
      if (terms.length > 0) {
        const haystack = normalize(`${a.fullName} ${a.email ?? ""} ${a.objectiveLabel}`);
        if (!terms.every((t) => haystack.includes(t))) return false;
      }
      if (pay === "paid" && a.paymentStatus !== "paid") return false;
      // An athlete with no agreed fee owes nothing, so it is not "pending".
      if (pay === "pending" && !(a.paymentConfigured && isPendingOrOverdue(a.paymentStatus))) {
        return false;
      }
      if (pay === "free" && a.paymentStatus !== "waived") return false;
      if (access !== "all" && a.accessStatus !== access) return false;
      return true;
    });
  }, [athletes, pay, access, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = pageAt.key === filterKey ? Math.min(pageAt.page, pageCount) : 1;
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const pickedIds = filtered.filter((a) => selected.has(a.id) && isInvitable(a)).map((a) => a.id);

  function invitesSent(result: InvitesActionResult) {
    setSelected(new Set());
    setInviteResult(result);
  }

  function clearFilters() {
    setPay("all");
    setAccess("all");
    const params = new URLSearchParams(window.location.search);
    params.delete("q");
    const rest = params.toString();
    window.history.replaceState(null, "", rest ? `${window.location.pathname}?${rest}` : window.location.pathname);
  }

  function changePage(p: number) {
    setPageAt({ key: filterKey, page: p });
    listRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
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
        {pickedIds.length > 0 && (
          <BulkInviteBar athleteIds={pickedIds} onClear={() => setSelected(new Set())} onDone={invitesSent} />
        )}
      </div>

      {inviteResult && <BulkInviteResult result={inviteResult} onDismiss={() => setInviteResult(null)} />}

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
        <div ref={listRef} className="flex scroll-mt-4 flex-col gap-4">
          <AthleteTable
            athletes={pageRows}
            selected={archived ? undefined : selected}
            onSelectedChange={archived ? undefined : setSelected}
          />
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={filtered.length}
            onPageChange={changePage}
          />
        </div>
      )}
    </div>
  );
}
