import type { Club, ClubCoach } from "@/lib/domain/clubs";

/** A card of the admin pages. */
export const cardClass = "rounded-[18px] border p-5 shadow-[var(--shadow)]";
export const cardStyle = { background: "var(--surface)", borderColor: "var(--border)" };

/** The club's logo, or its initial on its primary color (Umbral's coral when it set none). */
export function ClubMark({ club, size = 44 }: { club: Club; size?: number }) {
  const style = { width: size, height: size };

  if (club.logoUrl) {
    // A public Supabase Storage link; next/image would need the host configured.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={club.logoUrl} alt="" className="flex-none rounded-[12px] object-contain" style={style} />;
  }
  return (
    <div
      className="flex flex-none items-center justify-center rounded-[12px] font-extrabold"
      style={{
        ...style,
        fontSize: size * 0.42,
        background: club.palette.primary?.color ?? "var(--coral)",
        color: club.palette.primary?.foreground ?? "var(--on-coral)",
      }}
    >
      {club.name.trim().charAt(0).toUpperCase()}
    </div>
  );
}

const PILLS = {
  invited: { label: "Invitado", color: "var(--pend)" },
  active: { label: "Activo", color: "var(--ok)" },
  suspended: { label: "Suspendido", color: "var(--danger)" },
} as const;

export function StatusPill({ status }: { status: keyof typeof PILLS }) {
  const pill = PILLS[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-bold whitespace-nowrap"
      style={{ color: pill.color, background: `color-mix(in srgb, ${pill.color} 12%, transparent)` }}
    >
      <span className="size-1.5 flex-none rounded-full" style={{ background: pill.color }} />
      {pill.label}
    </span>
  );
}

export const coachStatus = (coach: ClubCoach | undefined) => coach?.accessStatus ?? "invited";
