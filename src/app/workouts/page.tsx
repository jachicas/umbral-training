import type { Metadata } from "next";
import { UmbralPrototype } from "@/components/prototype/UmbralPrototype";

export const metadata: Metadata = { title: "Entrenos · Umbral Training" };

export default function WorkoutsPage() {
  return <UmbralPrototype initialScreen="constructor" />;
}
