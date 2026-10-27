import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClubAction } from "@/app/admin/actions";
import { ClubForm } from "@/components/admin/ClubForm";
import { cardClass, cardStyle } from "@/components/admin/ClubBits";

export const metadata: Metadata = { title: "Nuevo club · Umbral Training" };

export default function NewClubPage() {
  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-[22px]">
      <div>
        <Link href="/admin" className="inline-flex items-center gap-1.5 text-[13px] font-semibold" style={{ color: "var(--text-2)" }}>
          <ArrowLeft size={15} /> Clubs
        </Link>
        <h1 className="m-0 mt-2 text-[24px] font-bold tracking-[-.4px]">Nuevo club</h1>
      </div>

      <section className={cardClass} style={cardStyle}>
        <ClubForm action={createClubAction} withCoach submitLabel="Crear e invitar" pendingLabel="Creando…" />
      </section>
    </div>
  );
}
