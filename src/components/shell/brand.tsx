import type { Club, ClubPalette, Swatch } from "@/lib/domain/clubs";

/**
 * What the shells show of the club: its logo and name once it has a logo,
 * Umbral's until then (as in its emails and PDFs); `sidebar` when it set a
 * sidebar color.
 */
export interface ShellBrand {
  name: string;
  logoUrl?: string;
  sidebar: boolean;
}

export const UMBRAL_BRAND: ShellBrand = { name: "Umbral Training", sidebar: false };

export function shellBrand(club: Club | undefined): ShellBrand {
  if (!club) return UMBRAL_BRAND;
  return {
    name: club.logoUrl ? club.name : UMBRAL_BRAND.name,
    logoUrl: club.logoUrl,
    sidebar: Boolean(club.palette.sidebar),
  };
}

const HEX = /^#[0-9a-f]{6}$/i;

/** Only colors that are plain "#rrggbb" reach the page's CSS. */
const safe = (swatch: Swatch | undefined) =>
  swatch && HEX.test(swatch.color) && HEX.test(swatch.foreground) ? swatch : undefined;

const mix = (color: string, percent: number) => `color-mix(in srgb, ${color} ${percent}%, transparent)`;

/**
 * The club's colors as CSS tokens over Umbral's (globals.css): the primary
 * becomes --coral, with its tints and the text on it (--on-coral); the
 * accent tints hovers and colors the avatars; the sidebar color goes to
 * `.club-sidebar`. `:root:root` outranks globals' `:root` and `.dark`
 * wherever this lands in <head>. Empty for a club that set no colors.
 */
export function brandCss(palette: ClubPalette | undefined): string {
  const primary = safe(palette?.primary);
  const accent = safe(palette?.accent);
  const sidebar = safe(palette?.sidebar);
  const light: string[] = [];
  const dark: string[] = [];

  if (primary) {
    light.push(
      `--coral: ${primary.color}`,
      `--coral-hover: color-mix(in srgb, ${primary.color} 86%, #000)`,
      `--coral-tint: ${mix(primary.color, 12)}`,
      `--coral-tint-2: ${mix(primary.color, 18)}`,
      `--on-coral: ${primary.foreground}`
    );
    dark.push(`--coral-tint: ${mix(primary.color, 18)}`, `--coral-tint-2: ${mix(primary.color, 26)}`);
  }
  if (accent) {
    light.push(`--accent: ${mix(accent.color, 16)}`, `--club-accent: ${accent.color}`, `--on-club-accent: ${accent.foreground}`);
  }
  if (sidebar) {
    light.push(`--club-sidebar: ${sidebar.color}`, `--club-sidebar-fg: ${sidebar.foreground}`);
  }

  return [
    light.length ? `:root:root{${light.join(";")}}` : "",
    dark.length ? `:root.dark{${dark.join(";")}}` : "",
  ].join("");
}

export function BrandStyle({ palette }: { palette: ClubPalette | undefined }) {
  const css = brandCss(palette);
  return css ? <style dangerouslySetInnerHTML={{ __html: css }} /> : null;
}

/** The club's mark in a shell: its logo, or Umbral's "U" on the primary color. */
export function BrandMark({ brand, className }: { brand: ShellBrand; className: string }) {
  if (brand.logoUrl) {
    // A public storage link; next/image would need the host configured.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={brand.logoUrl} alt="" className={`${className} object-contain`} />;
  }
  return (
    <div
      className={`${className} flex items-center justify-center font-extrabold tracking-tight`}
      style={{ background: "var(--coral)", color: "var(--on-coral)" }}
    >
      U
    </div>
  );
}
