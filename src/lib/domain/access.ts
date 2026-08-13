import type { AccessStatus } from "./types";

export interface AccessStatusMeta {
  label: string;
  colorVar: string;
  dotVar: string;
  bg: string;
  border: "dashed" | "solid";
}

export const ACCESS_STATUS_META: Record<AccessStatus, AccessStatusMeta> = {
  draft: {
    label: "Borrador",
    colorVar: "var(--text-2)",
    dotVar: "var(--text-3)",
    bg: "transparent",
    border: "dashed",
  },
  invited: {
    label: "Invitado",
    colorVar: "var(--pend)",
    dotVar: "var(--pend)",
    bg: "rgba(217,119,6,.12)",
    border: "solid",
  },
  linked: {
    label: "Vinculado",
    colorVar: "var(--ok)",
    dotVar: "var(--ok)",
    bg: "rgba(22,163,74,.12)",
    border: "solid",
  },
};

export function canSendInvite(status: AccessStatus): boolean {
  return status === "draft";
}

export function canManageInvite(status: AccessStatus): boolean {
  return status === "invited";
}
