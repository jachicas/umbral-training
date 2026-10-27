import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { getPortalHome } from "@/lib/services/portal";
import { DISCIPLINE_META } from "@/lib/domain/discipline";
import { PortalCard, PortalLabel } from "@/components/portal/PortalShell";
import { ProfileForm } from "@/components/portal/ProfileForm";

export const metadata: Metadata = { title: "Mi perfil · Umbral Training" };

/** Who the athlete is to their coach; they can update their phone and availability. */
export default async function PortalProfilePage() {
  const { athlete, coach } = await getPortalHome();

  return (
    <>
      <h1 className="m-0 px-1 pt-1 text-[26px] font-extrabold tracking-[-.5px]">Perfil</h1>

      <PortalCard>
        <PortalLabel>Tus datos</PortalLabel>
        <dl className="mt-3 mb-0 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2.5 text-[14px]">
          <Row label="Nombre">{athlete.fullName}</Row>
          <Row label="Email">{athlete.email ?? "—"}</Row>
          {athlete.groupName && <Row label="Grupo">{athlete.groupName}</Row>}
          {athlete.disciplines.length > 0 && (
            <Row label="Deportes">{athlete.disciplines.map((d) => DISCIPLINE_META[d].label).join(", ")}</Row>
          )}
        </dl>
      </PortalCard>

      <PortalCard>
        <PortalLabel>Contacto y disponibilidad</PortalLabel>
        <div className="mt-3">
          <ProfileForm athlete={athlete} />
        </div>
      </PortalCard>

      <PortalCard className="flex items-center gap-3.5">
        <div className="min-w-0 flex-1">
          <PortalLabel>Tu coach</PortalLabel>
          <div className="mt-1 text-[15px] font-bold">{coach.fullName}</div>
          <div className="truncate text-[13px]" style={{ color: "var(--text-2)" }}>
            {coach.email}
          </div>
        </div>
        <a
          href={`mailto:${coach.email}`}
          className="inline-flex h-10 flex-none items-center gap-2 rounded-[10px] px-4 text-[13.5px] font-bold text-[var(--on-coral)]"
          style={{ background: "var(--coral)" }}
        >
          <Mail size={15} /> Escribirle
        </a>
      </PortalCard>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt style={{ color: "var(--text-3)" }}>{label}</dt>
      <dd className="m-0 min-w-0 truncate font-semibold">{children}</dd>
    </>
  );
}
