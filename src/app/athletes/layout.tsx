import { AppShell } from "@/components/shell/AppShell";

const TABLER_ICONS_CSS =
  "https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.31.0/dist/tabler-icons.min.css";

export default function AthletesLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell active="athletes">
      {/* React 19 hoists <link> tags to <head> and dedupes by href. */}
      <link rel="stylesheet" href={TABLER_ICONS_CSS} />
      {children}
    </AppShell>
  );
}
