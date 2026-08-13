"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Moon, Plus, Search, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, type NavId } from "./nav";

const COACH_NAME = "Laura Méndez";
const COACH_INITIALS = "LM";

export function AppShell({
  active,
  children,
}: {
  active: NavId;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [dark, setDark] = useState(false);
  const expanded = !collapsed;

  return (
    <div
      className={cn("flex min-h-screen w-full", dark && "dark")}
      style={{ background: "var(--bg)", color: "var(--text)" }}
    >
      {/* ---------------- sidebar ---------------- */}
      {/* Below md the rail always stays icon-only (74px) regardless of the
          desktop expand/collapse toggle — there's no room for labels on a
          phone screen, so we skip a full off-canvas drawer for this
          coach-only admin surface (PRD deprioritizes mobile polish here). */}
      <aside
        className="sticky top-0 flex h-screen w-[74px] flex-none flex-col gap-2 border-r px-4 py-[22px] transition-[width] duration-150 md:w-[var(--sidebar-w)]"
        style={
          {
            "--sidebar-w": expanded ? "240px" : "74px",
            background: "var(--surface)",
            borderColor: "var(--border)",
          } as React.CSSProperties
        }
      >
        <div className="flex items-center gap-3 px-2 pt-1 pb-5">
          <div
            className="flex size-[38px] flex-none items-center justify-center rounded-xl text-[18px] font-extrabold tracking-tight text-white"
            style={{ background: "var(--coral)" }}
          >
            U
          </div>
          <div className={cn("min-w-0 max-md:hidden", !expanded && "md:hidden")}>
            <div className="whitespace-nowrap text-[15px] font-extrabold tracking-tight">
              Umbral
            </div>
            <div
              className="text-[11px] font-semibold tracking-[.04em] uppercase"
              style={{ color: "var(--text-2)" }}
            >
              Training
            </div>
          </div>
        </div>

        {NAV_ITEMS.map((item) => {
          const isActive = item.id === active;
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              title={item.label}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex w-full items-center gap-3 rounded-[11px] px-3 py-[11px] text-[13.5px] font-semibold transition-colors",
                isActive ? "text-white" : "hover:bg-[var(--surface-2)]"
              )}
              style={{
                background: isActive ? "var(--coral)" : "transparent",
                color: isActive ? "#fff" : "var(--text-2)",
              }}
            >
              <Icon size={19} className="flex-none" />
              <span className={cn("truncate max-md:hidden", !expanded && "md:hidden")}>
                {item.label}
              </span>
              {item.soon && (
                <span
                  className={cn(
                    "ml-auto rounded-full border px-1.5 py-0.5 text-[9px] font-bold tracking-[.04em] max-md:hidden",
                    !expanded && "md:hidden"
                  )}
                  style={{ color: "var(--text-3)", borderColor: "var(--border)" }}
                >
                  PRONTO
                </span>
              )}
            </Link>
          );
        })}

        <div
          className="mt-auto flex items-center gap-2.5 rounded-2xl border p-2.5"
          style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
        >
          <div
            className="flex size-[34px] flex-none items-center justify-center rounded-[10px] text-[13px] font-bold text-white"
            style={{ background: "var(--gym)" }}
          >
            {COACH_INITIALS}
          </div>
          <div className={cn("min-w-0 max-md:hidden", !expanded && "md:hidden")}>
            <div className="truncate text-[12.5px] font-bold">{COACH_NAME}</div>
            <div className="text-[11px]" style={{ color: "var(--text-2)" }}>
              Coach
            </div>
          </div>
        </div>
      </aside>

        {/* ---------------- content ---------------- */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header
            className="sticky top-0 z-20 flex items-center gap-2 border-b px-3.5 py-3.5 backdrop-blur-md md:gap-4 md:px-7"
            style={{
              background: "color-mix(in srgb, var(--bg) 82%, transparent)",
              borderColor: "var(--border)",
            }}
          >
            <button
              type="button"
              onClick={() => setCollapsed((v) => !v)}
              aria-label="Alternar barra lateral"
              className="flex size-[38px] flex-none items-center justify-center rounded-[10px] border transition-colors hover:bg-[var(--surface-2)]"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
            >
              <Menu size={19} />
            </button>

            <div
              className="flex h-10 min-w-0 max-w-[460px] flex-1 items-center gap-2.5 rounded-[10px] border px-3.5"
              style={{ borderColor: "var(--border)", background: "var(--surface)" }}
            >
              <Search size={17} style={{ color: "var(--text-3)" }} />
              <input
                placeholder="Buscar atletas, entrenos, carreras…"
                className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-[var(--text-3)]"
                style={{ color: "var(--text)" }}
              />
            </div>

            <div className="flex-1" />

            <button
              type="button"
              onClick={() => setDark((v) => !v)}
              aria-label="Cambiar tema"
              title="Cambiar tema"
              className="flex size-10 flex-none items-center justify-center rounded-[10px] border transition-colors hover:bg-[var(--surface-2)]"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              type="button"
              aria-label="Nuevo"
              title="Nuevo"
              className="flex size-10 flex-none items-center justify-center rounded-[10px] border transition-colors hover:bg-[var(--surface-2)] max-md:hidden"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
            >
              <Plus size={19} />
            </button>

            <div
              className="flex items-center gap-2.5 rounded-full border py-[5px] pr-3 pl-[5px] max-md:border-0 max-md:bg-transparent max-md:p-0"
              style={{ borderColor: "var(--border)", background: "var(--surface)" }}
            >
              <div
                className="flex size-8 flex-none items-center justify-center rounded-full text-[12px] font-bold text-white"
                style={{ background: "var(--gym)" }}
              >
                {COACH_INITIALS}
              </div>
              <div className="leading-[1.15] max-md:hidden">
                <div className="text-[12.5px] font-bold">{COACH_NAME}</div>
                <div className="text-[10.5px]" style={{ color: "var(--text-2)" }}>
                  Coach
                </div>
              </div>
            </div>
          </header>

          <main className="mx-auto w-full max-w-[1440px] flex-1 p-7">{children}</main>
        </div>
    </div>
  );
}

