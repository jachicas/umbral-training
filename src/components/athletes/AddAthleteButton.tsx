import Link from "next/link";
import { UserPlus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Replaces the old "add athlete" modal — creation needs more room than a dialog gives it. */
export function AddAthleteButton() {
  return (
    <Link
      href="/athletes/new"
      className={cn(buttonVariants(), "h-[38px] gap-2 rounded-[8px] px-4 text-sm font-semibold")}
    >
      <UserPlus size={16} /> Añadir atleta
    </Link>
  );
}
