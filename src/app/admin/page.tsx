import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { listClubs } from "@/lib/services/clubs";
import { ClubMark, StatusPill, cardClass, cardStyle, coachStatus } from "@/components/admin/ClubBits";

export const metadata: Metadata = { title: "Clubs · Umbral Training" };

export default async function ClubsPage() {
  const clubs = await listClubs();

  return (
    <div className="flex flex-col gap-[22px]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="m-0 text-[24px] font-bold tracking-[-.4px]">Clubs</h1>
          <div className="mt-1" style={{ color: "var(--text-2)" }}>
            {clubs.length} {clubs.length === 1 ? "club" : "clubs"}
          </div>
        </div>
        <Link
          href="/admin/clubs/new"
          className="flex h-[42px] items-center gap-[7px] rounded-[10px] px-[18px] text-[13.5px] font-bold shadow-[var(--shadow)] transition-[filter] hover:brightness-110"
          style={{ background: "var(--coral)", color: "var(--on-coral)" }}
        >
          <Plus size={16} /> Nuevo club
        </Link>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {clubs.map((club) => (
          <Link
            key={club.id}
            href={`/admin/clubs/${club.id}`}
            className={`${cardClass} flex flex-col gap-4 transition-[filter] hover:brightness-[1.03]`}
            // Links are coral app-wide; a card reads as plain text.
            style={{ ...cardStyle, color: "var(--text)" }}
          >
            <div className="flex items-center gap-3">
              <ClubMark club={club} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[16px] font-bold">{club.name}</div>
                <div className="truncate text-[13px]" style={{ color: "var(--text-2)" }}>
                  {club.coach?.fullName}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[13px]" style={{ color: "var(--text-2)" }}>
                <b style={{ color: "var(--text)" }}>{club.athletesCount ?? 0}</b>{" "}
                {club.athletesCount === 1 ? "atleta" : "atletas"}
              </span>
              <StatusPill status={club.suspendedAt ? "suspended" : coachStatus(club.coach)} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
