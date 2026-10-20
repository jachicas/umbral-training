import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type WorkoutsTab = "week" | "groups" | "library";

const TABS: { id: WorkoutsTab; label: string; href: string }[] = [
  { id: "week", label: "Semana", href: "/workouts" },
  { id: "groups", label: "Grupos", href: "/workouts/groups" },
  { id: "library", label: "Biblioteca", href: "/workouts/library" },
];

/** Shared header for the Entrenos tabs: title, subtitle, actions and the tab switcher. */
export function WorkoutsHeader({
  active,
  subtitle,
  actions,
}: {
  active: WorkoutsTab;
  subtitle?: React.ReactNode;
  actions: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="m-0 text-[24px] font-bold tracking-[-.4px]">Entrenos</h1>
          {subtitle && (
            <div className="mt-1" style={{ color: "var(--text-2)" }}>
              {subtitle}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2.5">{actions}</div>
      </div>

      <nav
        className="inline-flex w-fit gap-1 rounded-[12px] border p-1"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        {TABS.map((tab) => (
          <Link
            key={tab.id}
            href={tab.href}
            aria-current={tab.id === active ? "page" : undefined}
            className={cn(
              "rounded-[9px] px-4 py-1.5 text-[13px] font-bold transition-colors",
              tab.id === active ? "text-white shadow-[var(--shadow)]" : "hover:text-[var(--text)]"
            )}
            style={
              tab.id === active
                ? { background: "var(--coral)" }
                : { color: "var(--text-2)" }
            }
          >
            {tab.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

const actionBase =
  "flex h-[42px] items-center gap-[7px] rounded-[10px] px-[18px] text-[13.5px] font-bold transition-[filter] hover:brightness-110";

export function PrimaryAction({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(actionBase, "text-white shadow-[var(--shadow)]")}
      style={{ background: "var(--coral)" }}
    >
      {children}
    </Link>
  );
}

export function SecondaryAction({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(actionBase, "border")}
      style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
    >
      {children}
    </Link>
  );
}

/** Small back link used at the top of the flow's inner screens. */
export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex w-fit items-center gap-1.5 text-[13px] font-semibold transition-colors hover:text-[var(--coral)]"
      style={{ color: "var(--text-2)" }}
    >
      <ChevronLeft size={16} /> {children}
    </Link>
  );
}
