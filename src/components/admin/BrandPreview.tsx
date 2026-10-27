import type { Club } from "@/lib/domain/clubs";
import { ClubMark } from "./ClubBits";

/**
 * The saved brand at a glance: the sidebar with the mark and an active item
 * on the primary color, a button, and an avatar on the accent. Colors the
 * club didn't set show Umbral's.
 */
export function BrandPreview({ club }: { club: Club }) {
  const { primary, accent, sidebar } = club.palette;
  const onPrimary = { background: primary?.color ?? "var(--coral)", color: primary?.foreground ?? "var(--on-coral)" };
  const sidebarText = sidebar?.foreground ?? "var(--text)";

  return (
    <div className="flex overflow-hidden rounded-[14px] border" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
      <div className="flex w-[124px] flex-none flex-col gap-2 p-3" style={{ background: sidebar?.color ?? "var(--surface)", color: sidebarText }}>
        <div className="flex items-center gap-2">
          <ClubMark club={club} size={26} />
          <span className="truncate text-[12px] font-bold">{club.logoUrl ? club.name : "Umbral Training"}</span>
        </div>
        <div className="mt-1 rounded-[8px] px-2 py-1.5 text-[11.5px] font-semibold" style={onPrimary}>
          Dashboard
        </div>
        <div className="px-2 py-1 text-[11.5px] opacity-70">Atletas</div>
        <div className="px-2 py-1 text-[11.5px] opacity-70">Entrenos</div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col items-start justify-between gap-3 p-3">
        <div
          className="flex size-8 items-center justify-center rounded-full text-[11px] font-bold"
          style={{ background: accent?.color ?? "var(--gym)", color: accent?.foreground ?? "#fff" }}
        >
          AB
        </div>
        <span className="rounded-[9px] px-3 py-2 text-[12px] font-bold whitespace-nowrap" style={onPrimary}>
          Enviar
        </span>
      </div>
    </div>
  );
}
