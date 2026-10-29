"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** The pages to show: all of them when few, else the ends and the current one's neighbours, with gaps. */
function pageList(page: number, pageCount: number): (number | "gap")[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);
  const pages = new Set([1, pageCount, page - 1, page, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= pageCount).sort((a, b) => a - b);
  return sorted.flatMap((p, i) => (i > 0 && p - sorted[i - 1] > 1 ? ["gap" as const, p] : [p]));
}

/** "1–20 de 34" and the page buttons; renders nothing when everything fits on one page. */
export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const pageCount = Math.ceil(total / pageSize);
  if (pageCount <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const buttonClass =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-[8px] border px-2.5 text-[13px] font-bold tabular-nums transition-colors disabled:opacity-40";

  return (
    <nav aria-label="Paginación" className="flex flex-wrap items-center justify-between gap-3">
      <span className="text-[13px] tabular-nums" style={{ color: "var(--text-2)" }}>
        <b style={{ color: "var(--text)" }}>
          {from}–{to}
        </b>{" "}
        de {total}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          aria-label="Página anterior"
          className={cn(buttonClass, "enabled:hover:bg-[var(--surface-2)]")}
          style={{ borderColor: "var(--border)", color: "var(--text-2)" }}
        >
          <ChevronLeft size={15} />
        </button>
        {pageList(page, pageCount).map((p, i) =>
          p === "gap" ? (
            <span key={`gap-${i}`} className="px-1 text-[13px]" style={{ color: "var(--text-3)" }}>
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              aria-current={p === page ? "page" : undefined}
              className={cn(
                buttonClass,
                p === page
                  ? "border-transparent bg-[var(--coral)] text-[var(--on-coral)]"
                  : "border-[var(--border)] text-[var(--text-2)] hover:bg-[var(--surface-2)]"
              )}
            >
              {p}
            </button>
          )
        )}
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page === pageCount}
          aria-label="Página siguiente"
          className={cn(buttonClass, "enabled:hover:bg-[var(--surface-2)]")}
          style={{ borderColor: "var(--border)", color: "var(--text-2)" }}
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </nav>
  );
}
