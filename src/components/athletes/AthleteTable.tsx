import { AthleteRow, ATHLETE_ROW_GRID_COLS } from "./AthleteRow";
import type { AthleteRowVM } from "./types";

export function AthleteTable({ athletes }: { athletes: AthleteRowVM[] }) {
  return (
    <div
      className="overflow-hidden rounded-[10px] border"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      <div
        className="grid gap-4 px-5 py-2.5 text-[11.5px] font-semibold tracking-[.03em] uppercase"
        style={{
          gridTemplateColumns: ATHLETE_ROW_GRID_COLS,
          background: "var(--surface-2)",
          color: "var(--text-3)",
        }}
      >
        <span>Atleta</span>
        <span>Disciplinas</span>
        <span>Objetivo</span>
        <span>Pago</span>
        <span>Acceso</span>
        <span />
      </div>

      <div>
        {athletes.map((a, i) => (
          <div key={a.id} style={i > 0 ? { borderTop: "1px solid var(--border)" } : undefined}>
            <AthleteRow athlete={a} />
          </div>
        ))}
      </div>
    </div>
  );
}
