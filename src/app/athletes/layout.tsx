const TABLER_ICONS_CSS =
  "https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.31.0/dist/tabler-icons.min.css";

export default function AthletesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* `precedence` makes React 19 hoist the stylesheet to <head> and dedupe it. */}
      <link rel="stylesheet" href={TABLER_ICONS_CSS} precedence="default" />
      {children}
    </>
  );
}
