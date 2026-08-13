import { ACCESS_STATUS_META } from "@/lib/domain/access";
import type { AccessStatus } from "@/lib/domain/types";

export function AccessStatusPill({ status }: { status: AccessStatus }) {
  const meta = ACCESS_STATUS_META[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-bold whitespace-nowrap"
      style={{
        color: meta.colorVar,
        background: meta.bg,
        border: meta.border === "dashed" ? "1px dashed var(--border-2)" : "1px solid transparent",
      }}
    >
      <span className="size-1.5 flex-none rounded-full" style={{ background: meta.dotVar }} />
      {meta.label}
    </span>
  );
}
