import Link from "next/link";
import { AuthShell } from "./AuthShell";

/** A one-time link that was already used, or expired. */
export function ExpiredLinkNotice() {
  return (
    <AuthShell title="El enlace ya no sirve">
      <Link
        href="/login"
        className="flex h-11 items-center justify-center rounded-xl text-[14.5px] font-semibold"
        style={{ background: "var(--coral)", color: "var(--on-coral)" }}
      >
        Ir a entrar
      </Link>
    </AuthShell>
  );
}
