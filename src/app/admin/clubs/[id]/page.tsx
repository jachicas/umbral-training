import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ApiNotFoundError } from "@/lib/api/client";
import { getClub } from "@/lib/services/clubs";
import { updateClubAction } from "@/app/admin/actions";
import { BrandPreview } from "@/components/admin/BrandPreview";
import { ClubForm } from "@/components/admin/ClubForm";
import { ClubMark, StatusPill, cardClass, cardStyle, coachStatus } from "@/components/admin/ClubBits";
import { LogoControls, ResendInviteButton, SuspensionButton, ViewClubButton } from "@/components/admin/ClubControls";

export const metadata: Metadata = { title: "Club · Umbral Training" };

const sectionTitle = "mb-4 text-base font-bold";

export default async function ClubPage({ params }: PageProps<"/admin/clubs/[id]">) {
  const { id } = await params;
  const club = await getClub(id).catch((error) => {
    if (error instanceof ApiNotFoundError) notFound();
    throw error;
  });
  const coach = club.coach;

  return (
    <div className="flex flex-col gap-[22px]">
      <div>
        <Link href="/admin" className="inline-flex items-center gap-1.5 text-[13px] font-semibold" style={{ color: "var(--text-2)" }}>
          <ArrowLeft size={15} /> Clubs
        </Link>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3.5">
            <ClubMark club={club} size={52} />
            <div className="min-w-0">
              <h1 className="m-0 truncate text-[24px] font-bold tracking-[-.4px]">{club.name}</h1>
              <div className="mt-1 flex items-center gap-2 text-[13px]" style={{ color: "var(--text-2)" }}>
                {club.athletesCount ?? 0} {club.athletesCount === 1 ? "atleta" : "atletas"}
                {club.suspendedAt && <StatusPill status="suspended" />}
              </div>
            </div>
          </div>
          <ViewClubButton clubId={club.id} />
        </div>
      </div>

      <div className="grid gap-[22px] lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section className={cardClass} style={cardStyle}>
          <h2 className={sectionTitle}>Marca</h2>
          <ClubForm action={updateClubAction.bind(null, club.id)} club={club} submitLabel="Guardar" pendingLabel="Guardando…" />
        </section>

        <div className="flex flex-col gap-[22px]">
          <section className={cardClass} style={cardStyle}>
            <h2 className={sectionTitle}>Vista previa</h2>
            <div className="flex flex-col gap-4">
              <BrandPreview club={club} />
              <LogoControls club={club} />
            </div>
          </section>

          {coach && (
            <section className={cardClass} style={cardStyle}>
              <div className="mb-4 flex items-center justify-between gap-2">
                <h2 className="m-0 text-base font-bold">Coach</h2>
                <StatusPill status={coachStatus(coach)} />
              </div>
              <div className="text-[14px] font-semibold">{coach.fullName}</div>
              <div className="text-[13px]" style={{ color: "var(--text-2)" }}>
                {coach.email}
              </div>
              {coach.accessStatus === "invited" && (
                <div className="mt-4">
                  <ResendInviteButton clubId={club.id} />
                </div>
              )}
            </section>
          )}

          <section className={cardClass} style={cardStyle}>
            <h2 className={sectionTitle}>Estado</h2>
            <SuspensionButton club={club} />
          </section>
        </div>
      </div>
    </div>
  );
}
