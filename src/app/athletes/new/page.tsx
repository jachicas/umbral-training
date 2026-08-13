import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { CreateAthleteForm } from "@/components/athletes/CreateAthleteForm";

export const metadata: Metadata = { title: "Añadir atleta · Umbral Training" };

export default function NewAthletePage() {
  return (
    <div className="flex flex-col gap-5">
      <Link
        href="/athletes"
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold transition-colors hover:text-[var(--coral)]"
        style={{ color: "var(--text-2)" }}
      >
        <ChevronLeft size={16} /> Atletas
      </Link>

      <div>
        <h1 className="m-0 text-[24px] font-bold tracking-[-.4px]">Añadir atleta</h1>
        <div className="mt-1" style={{ color: "var(--text-2)" }}>
          Crea la ficha para empezar a planificar. Podrás invitarle a acceder cuando quieras.
        </div>
      </div>

      <CreateAthleteForm />
    </div>
  );
}
