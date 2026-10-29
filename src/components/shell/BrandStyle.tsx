"use client";

import { usePathname } from "next/navigation";
import type { ClubPalette } from "@/lib/domain/clubs";
import { brandCss } from "./brand";

/**
 * The club's colors (brandCss), never on /admin: the root layout survives
 * client navigation, so going back to /admin after reading a club would
 * otherwise keep its palette.
 */
export function BrandStyle({ palette }: { palette: ClubPalette | undefined }) {
  const pathname = usePathname();
  const css = brandCss(palette);
  if (!css || pathname === "/admin" || pathname.startsWith("/admin/")) return null;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
