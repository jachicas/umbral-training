"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

/* ------------------------------------------------------------------ */
/*  css(): parse a CSS declaration string into a React style object.  */
/*  Lets us mirror the design's inline styles verbatim → high fidelity.*/
/* ------------------------------------------------------------------ */
function css(str: string): React.CSSProperties {
  const out: Record<string, string> = {};
  for (const decl of str.split(";")) {
    const i = decl.indexOf(":");
    if (i === -1) continue;
    let k = decl.slice(0, i).trim();
    const v = decl.slice(i + 1).trim();
    if (!k) continue;
    if (!k.startsWith("--")) k = k.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    out[k] = v;
  }
  return out as React.CSSProperties;
}

/* ------------------------------------------------------------------ */
/*  Icon factory (Lucide-style inline SVG), ported from the design.   */
/* ------------------------------------------------------------------ */
type IconName =
  | "grid" | "users" | "activity" | "wallet" | "settings" | "search"
  | "sun" | "moon" | "plus" | "menu" | "chevronRight" | "chevronDown"
  | "back" | "dots" | "refresh" | "mic" | "download" | "pencil"
  | "waves" | "bike" | "run" | "gym" | "pause" | "flame" | "wind"
  | "clock" | "arrow" | "flag" | "calendar" | "mail" | "share" | "dumbbellKpi";

function Icon({
  name,
  size = 18,
  color = "currentColor",
  sw = 1.8,
}: {
  name: IconName;
  size?: number;
  color?: string;
  sw?: number;
}) {
  const c = color;
  const P: Record<string, [string, Record<string, unknown>][]> = {
    grid: [["rect", { x: 3, y: 3, width: 7, height: 7, rx: 1.5 }], ["rect", { x: 14, y: 3, width: 7, height: 7, rx: 1.5 }], ["rect", { x: 14, y: 14, width: 7, height: 7, rx: 1.5 }], ["rect", { x: 3, y: 14, width: 7, height: 7, rx: 1.5 }]],
    users: [["path", { d: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" }], ["circle", { cx: 9, cy: 7, r: 4 }], ["path", { d: "M23 21v-2a4 4 0 0 0-3-3.87" }], ["path", { d: "M16 3.13a4 4 0 0 1 0 7.75" }]],
    activity: [["polyline", { points: "22 12 18 12 15 21 9 3 6 12 2 12" }]],
    wallet: [["rect", { x: 2, y: 5, width: 20, height: 14, rx: 3 }], ["path", { d: "M16 12h.01" }], ["path", { d: "M2 10h20" }]],
    settings: [["circle", { cx: 12, cy: 12, r: 3 }], ["path", { d: "M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" }]],
    search: [["circle", { cx: 11, cy: 11, r: 7 }], ["line", { x1: 21, y1: 21, x2: 16.65, y2: 16.65 }]],
    sun: [["circle", { cx: 12, cy: 12, r: 4 }], ["path", { d: "M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" }]],
    moon: [["path", { d: "M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" }]],
    plus: [["line", { x1: 12, y1: 5, x2: 12, y2: 19 }], ["line", { x1: 5, y1: 12, x2: 19, y2: 12 }]],
    menu: [["line", { x1: 3, y1: 6, x2: 21, y2: 6 }], ["line", { x1: 3, y1: 12, x2: 21, y2: 12 }], ["line", { x1: 3, y1: 18, x2: 21, y2: 18 }]],
    chevronRight: [["polyline", { points: "9 6 15 12 9 18" }]],
    chevronDown: [["polyline", { points: "6 9 12 15 18 9" }]],
    back: [["polyline", { points: "15 6 9 12 15 18" }]],
    dots: [["circle", { cx: 12, cy: 5, r: 1.6, fill: c, stroke: "none" }], ["circle", { cx: 12, cy: 12, r: 1.6, fill: c, stroke: "none" }], ["circle", { cx: 12, cy: 19, r: 1.6, fill: c, stroke: "none" }]],
    refresh: [["path", { d: "M17 2l4 4-4 4" }], ["path", { d: "M3 11v-1a4 4 0 0 1 4-4h14" }], ["path", { d: "M7 22l-4-4 4-4" }], ["path", { d: "M21 13v1a4 4 0 0 1-4 4H3" }]],
    mic: [["rect", { x: 9, y: 2, width: 6, height: 11, rx: 3 }], ["path", { d: "M5 10v1a7 7 0 0 0 14 0v-1" }], ["line", { x1: 12, y1: 18, x2: 12, y2: 22 }]],
    download: [["path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }], ["polyline", { points: "7 10 12 15 17 10" }], ["line", { x1: 12, y1: 15, x2: 12, y2: 3 }]],
    pencil: [["path", { d: "M12 20h9" }], ["path", { d: "M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" }]],
    waves: [["path", { d: "M2 7c1.3-1.3 2.7-1.3 4 0s2.7 1.3 4 0 2.7-1.3 4 0 2.7 1.3 4 0" }], ["path", { d: "M2 12c1.3-1.3 2.7-1.3 4 0s2.7 1.3 4 0 2.7-1.3 4 0 2.7 1.3 4 0" }], ["path", { d: "M2 17c1.3-1.3 2.7-1.3 4 0s2.7 1.3 4 0 2.7-1.3 4 0 2.7 1.3 4 0" }]],
    bike: [["circle", { cx: 5.5, cy: 17, r: 3.5 }], ["circle", { cx: 18.5, cy: 17, r: 3.5 }], ["path", { d: "M5.5 17L9 8h4l3 6M9 8h6" }]],
    run: [["circle", { cx: 14, cy: 4.5, r: 2 }], ["path", { d: "M11 8l-4 3 3 3v6M14 8l2 2 3 1M10 14l-2 6" }]],
    gym: [["rect", { x: 1.5, y: 8.5, width: 3, height: 7, rx: 1 }], ["rect", { x: 19.5, y: 8.5, width: 3, height: 7, rx: 1 }], ["rect", { x: 4.5, y: 10, width: 2.5, height: 4, rx: 0.6 }], ["rect", { x: 17, y: 10, width: 2.5, height: 4, rx: 0.6 }], ["line", { x1: 7, y1: 12, x2: 17, y2: 12 }]],
    pause: [["rect", { x: 6, y: 5, width: 3.5, height: 14, rx: 1.4 }], ["rect", { x: 14.5, y: 5, width: 3.5, height: 14, rx: 1.4 }]],
    flame: [["path", { d: "M12 2c3 4 5 6 5 9a5 5 0 0 1-10 0c0-1.5.5-2.5 1.5-3.5.2 1.5 1 2.5 1.5 2.5.8 0 1-1.5 0-4 .5.5 1 1 1.5-1z" }]],
    wind: [["path", { d: "M2 8h12a3 3 0 1 0-3-3" }], ["path", { d: "M2 12h16a3 3 0 1 1-3 3" }], ["path", { d: "M2 16h9" }]],
    clock: [["circle", { cx: 12, cy: 12, r: 9 }], ["polyline", { points: "12 7 12 12 15 14" }]],
    arrow: [["line", { x1: 4, y1: 12, x2: 18, y2: 12 }], ["polyline", { points: "13 6 19 12 13 18" }]],
    flag: [["path", { d: "M4 15s1-1 4-1 5 2 8 2 4-1 4-1V4s-1 1-4 1-5-2-8-2-4 1-4 1z" }], ["line", { x1: 4, y1: 22, x2: 4, y2: 4 }]],
    calendar: [["rect", { x: 3, y: 4, width: 18, height: 17, rx: 2.5 }], ["line", { x1: 16, y1: 2, x2: 16, y2: 6 }], ["line", { x1: 8, y1: 2, x2: 8, y2: 6 }], ["line", { x1: 3, y1: 10, x2: 21, y2: 10 }]],
    mail: [["rect", { x: 2, y: 4, width: 20, height: 16, rx: 2.5 }], ["polyline", { points: "2 7 12 13 22 7" }]],
    share: [["circle", { cx: 18, cy: 5, r: 3 }], ["circle", { cx: 6, cy: 12, r: 3 }], ["circle", { cx: 18, cy: 19, r: 3 }], ["line", { x1: 8.6, y1: 10.5, x2: 15.4, y2: 6.5 }], ["line", { x1: 8.6, y1: 13.5, x2: 15.4, y2: 17.5 }]],
    dumbbellKpi: [["path", { d: "M6.5 6.5l11 11" }], ["rect", { x: 2, y: 9, width: 3, height: 6, rx: 1 }], ["rect", { x: 19, y: 9, width: 3, height: 6, rx: 1 }]],
  };
  const kids = (P[name] || []).map((seg, i) =>
    React.createElement(seg[0], Object.assign({ key: i }, seg[1]))
  );
  return React.createElement(
    "svg",
    {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: c,
      strokeWidth: sw,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      style: { display: "block" },
    },
    kids
  );
}

/* ------------------------------------------------------------------ */
/*  Domain data (mock, in memory) — ported from the design.           */
/* ------------------------------------------------------------------ */
type Disc = "swim" | "bike" | "run" | "gym";

interface DiscMeta {
  label: string;
  color: string;
  hex: string;
  tint: string;
  icon: IconName;
  verb: string;
  dist?: string;
  target?: string;
  est: string;
  dist2?: string;
  dist2l?: string;
}

const DISC_META: Record<Disc, DiscMeta> = {
  swim: { label: "Natación", color: "var(--swim)", hex: "#06B6D4", tint: "rgba(6,182,212,.12)", icon: "waves", verb: "Nadar", dist: "100 m", target: "1:45–1:50 /100m", est: "32:00", dist2: "1200 m", dist2l: "Distancia estimada" },
  bike: { label: "Ciclismo", color: "var(--bike)", hex: "#D9840A", tint: "rgba(217,132,10,.12)", icon: "bike", verb: "Pedalear", dist: "2.0 km", target: "250–270 W", est: "52:00", dist2: "24.0 km", dist2l: "Distancia estimada" },
  run: { label: "Carrera", color: "var(--run)", hex: "#E1573C", tint: "rgba(225,87,60,.12)", icon: "run", verb: "Correr", dist: "0.40 km", target: "4:30–4:40 /km", est: "48:10", dist2: "8.00 km", dist2l: "Distancia estimada" },
  gym: { label: "Gimnasio", color: "var(--gym)", hex: "#DB2777", tint: "rgba(219,39,119,.12)", icon: "gym", verb: "Fuerza", est: "55:00" },
};

interface Step {
  id: string;
  type?: "repeat" | "exercise" | "group";
  kind?: "warmup" | "main" | "rest" | "cooldown";
  intensity?: number;
  times?: number;
  children?: Step[];
  rest?: string;
  hard?: boolean;
  name?: string;
  sets?: number;
  reps?: number | string;
  load?: string;
  rpe?: string;
  ton?: number;
  mode?: string;
  rounds?: number;
}

function baseRes(): Step[] {
  return [
    { id: "w", kind: "warmup", intensity: 0.35 },
    { id: "rep1", type: "repeat", times: 10, children: [
      { id: "m1", kind: "main", intensity: 0.85 },
      { id: "r1", kind: "rest", intensity: 0.15, rest: "0:30" },
    ] },
    { id: "rep2", type: "repeat", times: 2, children: [
      { id: "rep2a", type: "repeat", times: 4, children: [
        { id: "m2", kind: "main", intensity: 1, hard: true },
        { id: "r2", kind: "rest", intensity: 0.15, rest: "0:15" },
      ] },
      { id: "rr", kind: "rest", intensity: 0.2, rest: "2:00" },
    ] },
    { id: "c", kind: "cooldown", intensity: 0.3 },
  ];
}

function baseGym(): Step[] {
  return [
    { id: "g1", type: "exercise", name: "Sentadilla trasera", sets: 4, reps: 8, load: "80 kg", rpe: "RIR 2", rest: "2:30", ton: 80 * 4 * 8 },
    { id: "sup", type: "group", mode: "Superserie A", rounds: 3, children: [
      { id: "g2", type: "exercise", name: "Press de banca", sets: 3, reps: 10, load: "60 kg", rpe: "RIR 2", rest: "—", ton: 60 * 3 * 10 },
      { id: "g3", type: "exercise", name: "Remo con barra", sets: 3, reps: 10, load: "55 kg", rpe: "RIR 2", rest: "1:30", ton: 55 * 3 * 10 },
    ] },
    { id: "g4", type: "exercise", name: "Plancha", sets: 3, reps: "45 s", load: "Peso corporal", rpe: "—", rest: "1:00", ton: 0 },
  ];
}

function kindLabel(kind: Step["kind"], disc: Disc): string {
  const meta = DISC_META[disc];
  if (kind === "main") return meta.verb;
  if (kind === "rest") return "Descanso";
  if (kind === "warmup") return "Calentamiento";
  if (kind === "cooldown") return "Enfriamiento";
  return "Paso";
}
function kindIcon(kind: Step["kind"], disc: Disc): IconName {
  if (kind === "main") return DISC_META[disc].icon;
  if (kind === "rest") return "pause";
  if (kind === "warmup") return "flame";
  if (kind === "cooldown") return "wind";
  return "run";
}
function stepMetrics(s: Step, disc: Disc): { metrics: { v: string; l: string }[]; target: string } {
  const meta = DISC_META[disc];
  if (s.kind === "main") return { metrics: [{ v: meta.dist || "", l: "Distancia" }, { v: "1:50", l: "Tiempo est." }], target: meta.target || "" };
  if (s.kind === "warmup") return { metrics: [{ v: "10:00", l: "Tiempo" }], target: "Suave" };
  if (s.kind === "cooldown") return { metrics: [{ v: "5:00", l: "Tiempo" }], target: "Suave" };
  return { metrics: [{ v: s.rest || "0:30", l: "Tiempo" }], target: "—" };
}

interface TreeNode {
  isRepeat: boolean;
  isStep: boolean;
  id: string;
  accent: string;
  icon?: React.ReactNode;
  label?: string;
  metrics?: { v: string; l: string }[];
  target?: string;
  times?: string;
  count?: number;
  collapsed?: boolean;
  skip?: boolean;
  chevron?: React.ReactNode;
  toggle?: () => void;
  children: TreeNode[];
}

/* ================================================================== */
/*  Step tree renderers (resistance)                                  */
/* ================================================================== */
function StepCard({ node }: { node: TreeNode }) {
  return (
    <div style={css(`background:var(--surface);border:1px solid var(--border);border-left:4px solid ${node.accent};border-radius:10px;padding:14px 16px;box-shadow:var(--shadow)`)}>
      <div style={css("display:flex;align-items:center;gap:10px;margin-bottom:10px")}>
        <span style={css(`display:flex;color:${node.accent}`)}>{node.icon}</span>
        <span style={css("font-weight:700;font-size:14px")}>{node.label}</span>
        <span style={css("margin-left:auto;color:var(--text-3)")}><Icon name="dots" size={16} /></span>
      </div>
      <div style={css("display:flex;gap:36px;flex-wrap:wrap;align-items:flex-end")}>
        {(node.metrics || []).map((m, i) => (
          <div key={i}>
            <div className="tn" style={css("font-size:17px;font-weight:700")}>{m.v}</div>
            <div style={css("font-size:11.5px;color:var(--text-2);margin-top:1px")}>{m.l}</div>
          </div>
        ))}
        <div style={css("margin-left:auto;text-align:right")}>
          <div className="tn" style={css(`font-size:15px;font-weight:700;color:${node.accent}`)}>{node.target}</div>
          <div style={css("font-size:11.5px;color:var(--text-2);margin-top:1px")}>Objetivo</div>
        </div>
      </div>
    </div>
  );
}

function StepNode({ node, depth }: { node: TreeNode; depth: number }) {
  if (node.isStep) return <StepCard node={node} />;
  const bg = depth === 0 ? "var(--surface-2)" : "var(--surface-3)";
  const radius = depth === 0 ? 16 : 14;
  return (
    <div style={css(`border:1px solid var(--border-2);border-radius:${radius}px;padding:12px;background:${bg};display:flex;flex-direction:column;gap:8px`)}>
      <div style={css("display:flex;align-items:center;gap:9px;padding:2px 6px")}>
        <button onClick={node.toggle} style={css("width:28px;height:28px;flex:0 0 auto;border:0;background:transparent;color:var(--text);display:flex;align-items:center;justify-content:center;cursor:pointer")}>{node.chevron}</button>
        <span className="tn" style={css("font-weight:800;font-size:16px")}>{node.times}</span>
        <span style={css("font-weight:700;font-size:14px")}>veces</span>
        <span style={css("font-size:12.5px;color:var(--text-3)")}>· {node.count} pasos</span>
        <span style={css("margin-left:auto;color:var(--text-3)")}><Icon name="dots" size={16} /></span>
      </div>
      {node.children.map((c) => <StepNode key={c.id} node={c} depth={depth + 1} />)}
      {node.skip && (
        <div style={css("padding:2px 8px 2px;font-size:12px;color:var(--text-2)")}>
          Saltar último descanso · <span style={css("color:var(--ok);font-weight:700")}>Sí</span>
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  Main app                                                          */
/* ================================================================== */
export type Screen = "dashboard" | "constructor" | "pdf";

export function UmbralPrototype({ initialScreen }: { initialScreen: Screen }) {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>(initialScreen);
  const [discipline, setDiscipline] = useState<Disc>("run");
  const [workoutName, setWorkoutName] = useState("Series 400");
  const [notes, setNotes] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [resExtra, setResExtra] = useState<Step[]>([]);
  const [gymExtra, setGymExtra] = useState<Step[]>([]);

  const disc = discipline;
  const meta = DISC_META[disc];
  const isGym = disc === "gym";
  // Dashboard ("/") and the workout builder ("/workouts") are separate routes;
  // constructor <-> pdf stays as in-page state.
  const go = (s: Screen) => {
    if (s === "dashboard") router.push("/");
    else if (screen === "dashboard") router.push("/workouts");
    else setScreen(s);
  };

  /* ---------- tree build (closure over collapsed state) ---------- */
  function buildTree(steps: Step[]): TreeNode[] {
    return steps.map((s) => {
      if (s.type === "repeat") {
        const col = collapsed[s.id];
        const hasRest = (s.children || []).some((c) => c.kind === "rest");
        return {
          isRepeat: true, isStep: false, id: s.id, accent: meta.hex,
          times: String(s.times), count: (s.children || []).length, collapsed: col, skip: hasRest,
          chevron: <Icon name={col ? "chevronRight" : "chevronDown"} size={18} color="var(--text)" />,
          toggle: () => setCollapsed((c) => ({ ...c, [s.id]: !c[s.id] })),
          children: col ? [] : buildTree(s.children || []),
        } as TreeNode;
      }
      const mm = stepMetrics(s, disc);
      const isRest = s.kind === "rest";
      return {
        isRepeat: false, isStep: true, id: s.id, children: [],
        accent: isRest ? "var(--text-3)" : meta.hex,
        icon: <Icon name={kindIcon(s.kind, disc)} size={18} color={isRest ? "var(--text-3)" : meta.hex} />,
        label: kindLabel(s.kind, disc), metrics: mm.metrics, target: mm.target,
      } as TreeNode;
    });
  }
  function expand(steps: Step[], out: { intensity: number; rest: boolean }[]) {
    steps.forEach((s) => {
      if (s.type === "repeat") { for (let i = 0; i < (s.times || 0); i++) expand(s.children || [], out); }
      else out.push({ intensity: s.intensity || 0, rest: s.kind === "rest" });
    });
  }

  /* ---------- dashboard data ---------- */
  const kpis = [
    { label: "Atletas totales", value: "24", delta: "+3", deltaColor: "var(--ok)", icon: "users" as IconName },
    { label: "Atletas activos", value: "18", delta: "75%", deltaColor: "var(--text-2)", icon: "activity" as IconName },
    { label: "Pagos pendientes", value: "5", delta: "€225", deltaColor: "var(--pend)", icon: "wallet" as IconName },
    { label: "Carreras próximas", value: "3", delta: "≤ 45 días", deltaColor: "var(--text-2)", icon: "flag" as IconName },
  ];
  const chip = (d: Disc) => ({ disc: DISC_META[d].label, color: DISC_META[d].color, tint: DISC_META[d].tint, chipIcon: DISC_META[d].icon });
  const sessions = [
    { athlete: "Marta Ríos", initials: "MR", avColor: "var(--coral)", type: "Series 400", when: "Hoy · 07:30", ...chip("run") },
    { athlete: "Diego Sanz", initials: "DS", avColor: "var(--swim)", type: "Técnica 100", when: "Hoy · 12:00", ...chip("swim") },
    { athlete: "Elena Prat", initials: "EP", avColor: "var(--bike)", type: "Umbral 3×10", when: "Hoy · 18:00", ...chip("bike") },
    { athlete: "Iván Costa", initials: "IC", avColor: "var(--gym)", type: "Fuerza inferior", when: "Mañana · 09:00", ...chip("gym") },
    { athlete: "Nora Vega", initials: "NV", avColor: "var(--coral)", type: "Rodaje largo", when: "Mañana · 08:00", ...chip("run") },
  ];
  const races = [
    { race: "Maratón de Valencia", athlete: "Marta Ríos", type: "42k", days: "38", color: "var(--run)", tint: DISC_META.run.tint, icon: "run" as IconName, iconColor: DISC_META.run.color },
    { race: "IM 70.3 Marbella", athlete: "Elena Prat", type: "70.3", days: "52", color: "var(--bike)", tint: DISC_META.bike.tint, icon: "bike" as IconName, iconColor: DISC_META.bike.color },
    { race: "Travesía Cala Sant", athlete: "Diego Sanz", type: "Aguas abiertas 3k", days: "19", color: "var(--swim)", tint: DISC_META.swim.tint, icon: "waves" as IconName, iconColor: DISC_META.swim.color },
  ];
  const legend = [
    { label: "Nado", color: DISC_META.swim.color },
    { label: "Bici", color: DISC_META.bike.color },
    { label: "Carrera", color: DISC_META.run.color },
    { label: "Fuerza", color: DISC_META.gym.color },
  ];
  const weekData = [
    { day: "Lun", v: [20, 0, 40, 0] }, { day: "Mar", v: [0, 60, 30, 0] }, { day: "Mié", v: [30, 0, 45, 50] },
    { day: "Jue", v: [0, 40, 50, 0] }, { day: "Vie", v: [25, 0, 35, 45] }, { day: "Sáb", v: [0, 90, 60, 0] }, { day: "Dom", v: [0, 0, 110, 0] },
  ];
  const cols = [DISC_META.swim.color, DISC_META.bike.color, DISC_META.run.color, DISC_META.gym.color];
  const maxTotal = Math.max(...weekData.map((d) => d.v.reduce((a, b) => a + b, 0)));
  const chartDays = weekData.map((d) => {
    const total = d.v.reduce((a, b) => a + b, 0);
    return { day: d.day, total: total ? String(total) : "", segs: d.v.map((mins, i) => ({ h: Math.round((mins / maxTotal) * 150), color: cols[i] })).filter((x) => x.h > 0) };
  });

  /* ---------- constructor ---------- */
  const disciplines = (["swim", "bike", "run", "gym"] as Disc[]).map((d) => {
    const m = DISC_META[d];
    const active = d === disc;
    const base = "display:flex;align-items:center;gap:8px;height:40px;padding:0 16px;border-radius:10px;cursor:pointer;font-family:inherit;font-weight:700;font-size:13.5px;";
    return {
      d, label: m.label, icon: m.icon, iconColor: active ? "#fff" : m.color,
      style: base + (active ? `background:${m.hex};color:#fff;border:1px solid ${m.hex};` : "background:var(--surface);color:var(--text);border:1px solid var(--border);"),
    };
  });

  const resSteps = baseRes().concat(resExtra);
  const tree = buildTree(resSteps);

  const barsRaw: { intensity: number; rest: boolean }[] = [];
  expand(resSteps, barsRaw);
  const bars = barsRaw.slice(0, 44).map((b) => ({
    h: Math.round(18 + b.intensity * 82),
    color: b.rest ? "var(--text-3)" : meta.hex,
    op: b.rest ? 0.45 : 1,
    title: b.rest ? "Descanso" : meta.verb,
  }));

  // gym rows
  const gymSteps = baseGym().concat(gymExtra);
  type GymRow =
    | { isGroup: true; isExercise: false; indent: number; mode: string; rounds: string }
    | { isGroup: false; isExercise: true; indent: number; name: string; setsReps: string; load: string; rpe: string; rest: string };
  const gymRows: GymRow[] = [];
  let totalSets = 0, tonnage = 0;
  const pushEx = (e: Step, indent: number) => {
    gymRows.push({ isGroup: false, isExercise: true, indent, name: e.name || "", setsReps: e.sets + " × " + e.reps, load: e.load || "", rpe: e.rpe || "", rest: e.rest || "" });
  };
  gymSteps.forEach((e) => {
    if (e.type === "group") {
      gymRows.push({ isGroup: true, isExercise: false, indent: 0, mode: e.mode || "", rounds: String(e.rounds) });
      (e.children || []).forEach((ch) => { pushEx(ch, 22); totalSets += (ch.sets || 0) * (e.rounds || 0); tonnage += (ch.ton || 0) * (e.rounds || 0); });
    } else { pushEx(e, 0); totalSets += e.sets || 0; tonnage += e.ton || 0; }
  });

  const estSecond = isGym ? totalSets + " series" : meta.dist2 || "";
  const estSecondLabel = isGym ? "Volumen · " + tonnage.toLocaleString("es-ES") + " kg de tonelaje" : meta.dist2l || "";

  /* ---------- pdf ---------- */
  type PdfRow = { label: string; detail: string; target: string; accent: string; bg: string; dotBg: string; n: string; indent: number };
  const pdfRows: PdfRow[] = [];
  const softBg = "var(--surface-2)";
  if (isGym) {
    let n = 1;
    gymSteps.forEach((e) => {
      if (e.type === "group") {
        pdfRows.push({ label: e.mode || "", detail: e.rounds + " rondas seguidas, descanso mínimo", target: "", accent: "var(--gym)", bg: softBg, dotBg: DISC_META.gym.tint, n: "∞", indent: 0 });
        (e.children || []).forEach((ch) => { pdfRows.push({ label: ch.name || "", detail: ch.sets + " × " + ch.reps + " · descanso " + ch.rest, target: ch.load || "", accent: "var(--gym)", bg: "var(--surface)", dotBg: DISC_META.gym.tint, n: String(n++), indent: 22 }); });
      } else pdfRows.push({ label: e.name || "", detail: e.sets + " × " + e.reps + " · descanso " + e.rest, target: e.load || "", accent: "var(--gym)", bg: "var(--surface)", dotBg: DISC_META.gym.tint, n: String(n++), indent: 0 });
    });
  } else {
    let n = 1;
    const walk = (steps: Step[], indent: number) => {
      steps.forEach((s) => {
        if (s.type === "repeat") {
          pdfRows.push({ label: "Repetir " + s.times + "×", detail: "Bloque de " + (s.children || []).length + " pasos", target: "", accent: meta.hex, bg: softBg, dotBg: meta.tint, n: "×" + s.times, indent });
          walk(s.children || [], indent + 22);
        } else {
          const mm = stepMetrics(s, disc);
          const det = mm.metrics.map((x) => x.v).join(" · ");
          pdfRows.push({ label: kindLabel(s.kind, disc), detail: det, target: s.kind === "main" ? mm.target : "", accent: s.kind === "rest" ? "var(--text-3)" : meta.hex, bg: "var(--surface)", dotBg: s.kind === "rest" ? "var(--surface-3)" : meta.tint, n: String(n++), indent });
        }
      });
    };
    walk(resSteps, 0);
  }
  const pdfSummary = isGym
    ? [{ v: totalSets + " series", l: "Volumen total" }, { v: tonnage.toLocaleString("es-ES") + " kg", l: "Tonelaje estimado" }, { v: meta.est, l: "Tiempo estimado" }]
    : [{ v: meta.est, l: "Tiempo estimado" }, { v: meta.dist2 || "", l: "Distancia estimada" }, { v: disc === "run" ? "12 series" : disc === "swim" ? "10×100" : "3 bloques", l: "Estructura" }];
  const pdfAthlete = "Marta Ríos";
  const pdfDisc = meta.label + " · Intervalos";

  const isResistance = !isGym;

  /* ================================================================ */
  return (
    <div style={css("font-size:14px;line-height:1.4")}>
          {/* ===================== DASHBOARD ===================== */}
          {screen === "dashboard" && (
            <div style={css("display:flex;flex-direction:column;gap:22px")}>
              <div style={css("display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap")}>
                <div>
                  <div style={css("font-size:12px;font-weight:600;color:var(--text-2);text-transform:uppercase;letter-spacing:.6px")}>Martes, 11 de agosto</div>
                  <h1 style={css("margin:6px 0 0;font-size:26px;font-weight:800;letter-spacing:-.6px")}>Hola, Laura 👋</h1>
                  <div style={css("color:var(--text-2);margin-top:4px")}>Tienes <b style={css("color:var(--text)")}>6</b> sesiones asignadas hoy y <b style={css("color:var(--pend)")}>5</b> pagos pendientes.</div>
                </div>
                <button onClick={() => go("constructor")} className="u-btn-coral" style={css("display:flex;align-items:center;gap:9px;height:44px;padding:0 20px;border:0;border-radius:10px;background:var(--coral);color:#fff;font-weight:700;font-size:14px;cursor:pointer;box-shadow:var(--shadow)")}><Icon name="plus" size={17} color="#fff" /> Nuevo entreno</button>
              </div>

              <div style={css("display:grid;grid-template-columns:repeat(4,1fr);gap:16px")}>
                {kpis.map((k, i) => (
                  <div key={i} style={css("background:var(--surface);border:1px solid var(--border);border-radius:18px;padding:20px;box-shadow:var(--shadow)")}>
                    <div style={css("display:flex;align-items:center;justify-content:space-between")}>
                      <div style={css("width:40px;height:40px;border-radius:12px;background:var(--coral-tint);color:var(--coral);display:flex;align-items:center;justify-content:center")}><Icon name={k.icon} size={20} color="var(--coral)" /></div>
                      <span style={css(`font-size:12px;font-weight:700;color:${k.deltaColor}`)}>{k.delta}</span>
                    </div>
                    <div className="tn" style={css("font-size:30px;font-weight:800;letter-spacing:-1px;margin-top:14px")}>{k.value}</div>
                    <div style={css("color:var(--text-2);font-size:13px;margin-top:2px")}>{k.label}</div>
                  </div>
                ))}
              </div>

              <div style={css("display:grid;grid-template-columns:1.5fr 1fr;gap:16px")}>
                {/* weekly volume */}
                <div style={css("background:var(--surface);border:1px solid var(--border);border-radius:18px;padding:22px;box-shadow:var(--shadow)")}>
                  <div style={css("display:flex;align-items:center;justify-content:space-between")}>
                    <div>
                      <div style={css("font-weight:700;font-size:16px")}>Volumen semanal del grupo</div>
                      <div style={css("color:var(--text-2);font-size:12.5px;margin-top:2px")}>Minutos por disciplina · últimos 7 días</div>
                    </div>
                    <div style={css("display:flex;gap:14px")}>
                      {legend.map((l, i) => (
                        <div key={i} style={css("display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text-2)")}><span style={css(`width:9px;height:9px;border-radius:3px;background:${l.color}`)}></span>{l.label}</div>
                      ))}
                    </div>
                  </div>
                  <div style={css("display:flex;align-items:flex-end;gap:14px;height:200px;margin-top:24px;padding-bottom:26px;position:relative")}>
                    {chartDays.map((d, i) => (
                      <div key={i} style={css("flex:1;display:flex;flex-direction:column;align-items:center;height:100%;justify-content:flex-end;gap:0;position:relative")}>
                        <div className="tn" style={css("font-size:11px;font-weight:700;color:var(--text-2);margin-bottom:6px")}>{d.total}</div>
                        <div style={css("width:70%;max-width:34px;display:flex;flex-direction:column;justify-content:flex-end;border-radius:7px;overflow:hidden;box-shadow:var(--shadow)")}>
                          {d.segs.map((s, j) => <div key={j} style={css(`height:${s.h}px;background:${s.color}`)}></div>)}
                        </div>
                        <div style={css("position:absolute;bottom:-24px;font-size:11.5px;color:var(--text-2);font-weight:600")}>{d.day}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* target races */}
                <div style={css("background:var(--surface);border:1px solid var(--border);border-radius:18px;padding:22px;box-shadow:var(--shadow)")}>
                  <div style={css("display:flex;align-items:center;justify-content:space-between;margin-bottom:16px")}>
                    <div style={css("font-weight:700;font-size:16px")}>Carreras objetivo</div>
                    <span style={css("color:var(--text-3)")}><Icon name="flag" size={18} /></span>
                  </div>
                  <div style={css("display:flex;flex-direction:column;gap:12px")}>
                    {races.map((r, i) => (
                      <div key={i} style={css("display:flex;align-items:center;gap:12px;padding:12px;border-radius:14px;background:var(--surface-2);border:1px solid var(--border)")}>
                        <div style={css(`width:38px;height:38px;flex:0 0 auto;border-radius:10px;background:${r.tint};color:${r.color};display:flex;align-items:center;justify-content:center`)}><Icon name={r.icon} size={18} color={r.iconColor} /></div>
                        <div style={css("min-width:0;flex:1")}>
                          <div style={css("font-weight:700;font-size:13.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>{r.race}</div>
                          <div style={css("font-size:12px;color:var(--text-2)")}>{r.athlete} · {r.type}</div>
                        </div>
                        <div style={css("text-align:right")}>
                          <div className="tn" style={css("font-weight:800;font-size:15px;color:var(--coral)")}>{r.days}</div>
                          <div style={css("font-size:10.5px;color:var(--text-3)")}>días</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* upcoming sessions */}
              <div style={css("background:var(--surface);border:1px solid var(--border);border-radius:18px;padding:22px;box-shadow:var(--shadow)")}>
                <div style={css("display:flex;align-items:center;justify-content:space-between;margin-bottom:8px")}>
                  <div style={css("font-weight:700;font-size:16px")}>Próximas sesiones</div>
                  <a href="#" onClick={(e) => { e.preventDefault(); go("constructor"); }} style={css("font-size:13px;font-weight:600;display:flex;align-items:center;gap:4px")}>Ver todas <Icon name="arrow" size={15} /></a>
                </div>
                <div style={css("display:grid;grid-template-columns:1.4fr 1fr 1fr .8fr 44px;gap:10px;padding:10px 8px;font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid var(--border)")}>
                  <div>Atleta</div><div>Disciplina</div><div>Entreno</div><div>Cuándo</div><div></div>
                </div>
                {sessions.map((s, i) => (
                  <div key={i} className="u-rowhover" style={css("display:grid;grid-template-columns:1.4fr 1fr 1fr .8fr 44px;gap:10px;align-items:center;padding:12px 8px;border-bottom:1px solid var(--border);border-radius:8px")}>
                    <div style={css("display:flex;align-items:center;gap:11px")}>
                      <div style={css(`width:34px;height:34px;flex:0 0 auto;border-radius:10px;background:${s.avColor};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px`)}>{s.initials}</div>
                      <span style={css("font-weight:600;font-size:13.5px")}>{s.athlete}</span>
                    </div>
                    <div><span style={css(`display:inline-flex;align-items:center;gap:7px;padding:5px 11px 5px 8px;border-radius:999px;background:${s.tint};color:${s.color};font-weight:700;font-size:12px`)}><Icon name={s.chipIcon} size={14} color={s.color} />{s.disc}</span></div>
                    <div style={css("font-size:13.5px;color:var(--text)")}>{s.type}</div>
                    <div className="tn" style={css("font-size:13px;color:var(--text-2)")}>{s.when}</div>
                    <div style={css("display:flex;justify-content:flex-end")}><span style={css("color:var(--text-3)")}><Icon name="dots" size={16} /></span></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===================== CONSTRUCTOR ===================== */}
          {screen === "constructor" && (
            <div style={css("display:flex;flex-direction:column;gap:20px")}>
              {/* header */}
              <div style={css("display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap")}>
                <div style={css("display:flex;flex-direction:column;gap:12px;min-width:0")}>
                  <a href="#" onClick={(e) => { e.preventDefault(); go("dashboard"); }} className="u-backlink" style={css("display:inline-flex;align-items:center;gap:5px;font-size:13px;font-weight:600;color:var(--text-2)")}><Icon name="back" size={16} /> Entrenos</a>
                  <div style={css("display:flex;align-items:center;gap:14px")}>
                    <div style={css(`width:52px;height:52px;flex:0 0 auto;border-radius:15px;background:${meta.hex};color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:var(--shadow)`)}><Icon name={meta.icon} size={26} color="#fff" /></div>
                    <div style={css("display:flex;align-items:center;gap:8px")}>
                      <input value={workoutName} onChange={(e) => setWorkoutName(e.target.value)} className="tn u-nameinput" style={css("border:0;outline:0;background:transparent;color:var(--text);font-size:26px;font-weight:800;letter-spacing:-.6px;width:auto;min-width:120px;max-width:420px;border-bottom:2px solid transparent")} />
                      <span style={css("color:var(--text-3)")}><Icon name="pencil" size={16} /></span>
                    </div>
                  </div>
                </div>
                <div style={css("display:flex;gap:10px")}>
                  <button onClick={() => go("dashboard")} className="u-btn-outline" style={css("height:44px;padding:0 20px;border-radius:10px;border:1px solid var(--border);background:var(--surface);color:var(--text);font-weight:700;font-size:14px;cursor:pointer")}>Cancelar</button>
                  <button onClick={() => go("pdf")} className="u-btn-coral" style={css("height:44px;padding:0 22px;border-radius:10px;border:0;background:var(--coral);color:#fff;font-weight:700;font-size:14px;cursor:pointer;box-shadow:var(--shadow)")}>Guardar entreno</button>
                </div>
              </div>

              {/* discipline tabs */}
              <div style={css("display:flex;gap:8px;flex-wrap:wrap")}>
                {disciplines.map((d) => (
                  <button key={d.d} onClick={() => setDiscipline(d.d)} style={css(d.style)}>
                    <span style={css("display:flex")}><Icon name={d.icon} size={17} color={d.iconColor} /></span>{d.label}
                  </button>
                ))}
              </div>

              <div style={css("display:grid;grid-template-columns:1fr 320px;gap:20px;align-items:start")}>
                {/* builder column */}
                <div style={css("display:flex;flex-direction:column;gap:16px;min-width:0")}>
                  {/* action buttons */}
                  <div style={css("display:flex;gap:10px")}>
                    {isGym && (
                      <>
                        <button onClick={() => setGymExtra((g) => g.concat([{ id: "ge" + Date.now(), type: "exercise", name: "Nuevo ejercicio", sets: 3, reps: 12, load: "40 kg", rpe: "RIR 3", rest: "1:30", ton: 40 * 3 * 12 }]))} className="u-btn-coral" style={css("display:flex;align-items:center;gap:8px;height:42px;padding:0 18px;border-radius:10px;border:0;background:var(--coral);color:#fff;font-weight:700;font-size:13.5px;cursor:pointer")}><Icon name="plus" size={17} color="#fff" /> Añadir ejercicio</button>
                        <button onClick={() => setGymExtra((g) => g.concat([{ id: "gg" + Date.now(), type: "group", mode: "Circuito", rounds: 3, children: [{ id: "gc" + Date.now(), type: "exercise", name: "Zancadas", sets: 3, reps: 12, load: "20 kg", rpe: "RIR 2", rest: "—", ton: 20 * 3 * 12 }] }]))} className="u-btn-outline" style={css("display:flex;align-items:center;gap:8px;height:42px;padding:0 18px;border-radius:10px;border:1px solid var(--border);background:var(--surface);color:var(--text);font-weight:700;font-size:13.5px;cursor:pointer")}><Icon name="refresh" size={16} /> Superserie / circuito</button>
                      </>
                    )}
                    {isResistance && (
                      <>
                        <button onClick={() => setResExtra((r) => r.concat([{ id: "ex" + Date.now(), kind: "main", intensity: 0.8 }]))} className="u-btn-coral" style={css("display:flex;align-items:center;gap:8px;height:42px;padding:0 18px;border-radius:10px;border:0;background:var(--coral);color:#fff;font-weight:700;font-size:13.5px;cursor:pointer")}><Icon name="plus" size={17} color="#fff" /> Añadir paso</button>
                        <button onClick={() => setResExtra((r) => r.concat([{ id: "exr" + Date.now(), type: "repeat", times: 4, children: [{ id: "exc" + Date.now(), kind: "main", intensity: 0.8 }, { id: "excr" + Date.now(), kind: "rest", intensity: 0.15, rest: "0:45" }] }]))} className="u-btn-outline" style={css("display:flex;align-items:center;gap:8px;height:42px;padding:0 18px;border-radius:10px;border:1px solid var(--border);background:var(--surface);color:var(--text);font-weight:700;font-size:13.5px;cursor:pointer")}><Icon name="refresh" size={16} /> Añadir repetición</button>
                      </>
                    )}
                  </div>

                  {/* intensity bars (resistance only) */}
                  {isResistance && (
                    <div style={css("background:var(--surface);border:1px solid var(--border);border-radius:18px;padding:22px;box-shadow:var(--shadow)")}>
                      <div style={css("display:flex;align-items:center;justify-content:space-between;margin-bottom:16px")}>
                        <div style={css("font-size:12px;font-weight:700;color:var(--text-2);text-transform:uppercase;letter-spacing:.5px")}>Perfil de intensidad</div>
                        <div style={css("font-size:11.5px;color:var(--text-3)")}>altura = intensidad</div>
                      </div>
                      <div style={css("display:flex;align-items:flex-end;gap:3px;height:130px")}>
                        {bars.map((b, i) => (
                          <div key={i} title={b.title} style={css(`flex:1;min-width:4px;height:${b.h}%;background:${b.color};border-radius:4px 4px 2px 2px;opacity:${b.op}`)}></div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* steps (resistance) — Garmin-style nested containers */}
                  {isResistance && (
                    <div style={css("display:flex;flex-direction:column;gap:10px")}>
                      {tree.map((n) => <StepNode key={n.id} node={n} depth={0} />)}
                    </div>
                  )}

                  {/* exercises (gym) */}
                  {isGym && (
                    <div style={css("display:flex;flex-direction:column;gap:8px")}>
                      {gymRows.map((r, i) => (
                        <div key={i} style={css(`margin-left:${r.indent}px`)}>
                          {r.isGroup ? (
                            <div style={css("display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:12px;background:var(--surface-2);border:1px solid var(--border);border-left:4px solid var(--gym)")}>
                              <span style={css("display:flex;color:var(--gym)")}><Icon name="refresh" size={16} /></span>
                              <span style={css("font-weight:700;font-size:13.5px")}>{r.mode}</span>
                              <span style={css("font-size:13px;color:var(--text-2)")}>· {r.rounds} rondas</span>
                              <span style={css("margin-left:auto;color:var(--text-3)")}><Icon name="dots" size={16} /></span>
                            </div>
                          ) : (
                            <div style={css("background:var(--surface);border:1px solid var(--border);border-left:4px solid var(--gym);border-radius:12px;padding:14px 16px;box-shadow:var(--shadow)")}>
                              <div style={css("display:flex;align-items:center;gap:10px;margin-bottom:12px")}>
                                <span style={css("display:flex;color:var(--gym)")}><Icon name="gym" size={18} color="var(--gym)" /></span>
                                <span style={css("font-weight:700;font-size:14px")}>{r.name}</span>
                                <span style={css("margin-left:auto;color:var(--text-3)")}><Icon name="dots" size={16} /></span>
                              </div>
                              <div style={css("display:flex;gap:30px;flex-wrap:wrap")}>
                                <div><div className="tn" style={css("font-size:17px;font-weight:700")}>{r.setsReps}</div><div style={css("font-size:11.5px;color:var(--text-2)")}>Series × reps</div></div>
                                <div><div className="tn" style={css("font-size:17px;font-weight:700")}>{r.load}</div><div style={css("font-size:11.5px;color:var(--text-2)")}>Carga</div></div>
                                <div><div className="tn" style={css("font-size:17px;font-weight:700")}>{r.rpe}</div><div style={css("font-size:11.5px;color:var(--text-2)")}>Esfuerzo</div></div>
                                <div style={css("margin-left:auto;text-align:right")}><div className="tn" style={css("font-size:15px;font-weight:700;color:var(--gym)")}>{r.rest}</div><div style={css("font-size:11.5px;color:var(--text-2)")}>Descanso</div></div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* right panel */}
                <div style={css("position:sticky;top:0;display:flex;flex-direction:column;gap:16px")}>
                  <div style={css("background:var(--surface);border:1px solid var(--border);border-radius:18px;padding:20px;box-shadow:var(--shadow)")}>
                    <div style={css("display:flex;flex-direction:column;gap:16px")}>
                      <div>
                        <div className="tn" style={css("font-size:28px;font-weight:800;letter-spacing:-1px")}>{meta.est}</div>
                        <div style={css("font-size:12px;color:var(--text-2)")}>Tiempo estimado</div>
                      </div>
                      <div style={css("height:1px;background:var(--border)")}></div>
                      <div>
                        <div className="tn" style={css("font-size:28px;font-weight:800;letter-spacing:-1px")}>{estSecond}</div>
                        <div style={css("font-size:12px;color:var(--text-2)")}>{estSecondLabel}</div>
                      </div>
                    </div>
                  </div>

                  <div style={css("background:var(--surface);border:1px solid var(--border);border-radius:18px;padding:20px;box-shadow:var(--shadow)")}>
                    <div style={css("font-weight:700;font-size:14px;margin-bottom:10px")}>Notas</div>
                    <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Instrucciones para el atleta…" className="u-textarea" style={css("width:100%;height:90px;border:1px solid var(--border);border-radius:10px;background:var(--surface-2);color:var(--text);padding:10px 12px;font-size:13px;outline:0")}></textarea>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================== PDF ===================== */}
          {screen === "pdf" && (
            <div style={css("display:flex;flex-direction:column;gap:18px;align-items:center")}>
              <div style={css("width:100%;max-width:820px;display:flex;align-items:center;justify-content:space-between;gap:12px")}>
                <a href="#" onClick={(e) => { e.preventDefault(); go("constructor"); }} className="u-backlink" style={css("display:inline-flex;align-items:center;gap:5px;font-size:13px;font-weight:600;color:var(--text-2)")}><Icon name="back" size={16} /> Volver al constructor</a>
                <div style={css("display:flex;gap:10px")}>
                  <button style={css("height:42px;padding:0 18px;border-radius:10px;border:1px solid var(--border);background:var(--surface);color:var(--text-3);font-weight:700;font-size:13px;cursor:not-allowed;display:flex;align-items:center;gap:8px")}><Icon name="mail" size={15} /> Enviar <span style={css("font-size:9px;letter-spacing:.4px")}>PRONTO</span></button>
                  <button style={css("height:42px;padding:0 18px;border-radius:10px;border:1px solid var(--border);background:var(--surface);color:var(--text-3);font-weight:700;font-size:13px;cursor:not-allowed;display:flex;align-items:center;gap:8px")}><Icon name="share" size={15} /> Compartir <span style={css("font-size:9px;letter-spacing:.4px")}>PRONTO</span></button>
                  <button className="u-btn-coral" style={css("height:42px;padding:0 20px;border-radius:10px;border:0;background:var(--coral);color:#fff;font-weight:700;font-size:13.5px;cursor:pointer;display:flex;align-items:center;gap:8px;box-shadow:var(--shadow)")}><Icon name="download" size={16} color="#fff" /> Descargar PDF</button>
                </div>
              </div>

              <div style={css("width:100%;max-width:820px;background:var(--surface);border:1px solid var(--border);border-radius:18px;box-shadow:var(--shadow-lg);overflow:hidden")}>
                <div style={css("padding:28px 34px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;gap:16px")}>
                  <div style={css("display:flex;align-items:center;gap:14px")}>
                    <div style={css("width:44px;height:44px;border-radius:12px;background:var(--coral);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:20px")}>U</div>
                    <div>
                      <div style={css("font-weight:800;font-size:16px;letter-spacing:-.2px")}>Umbral Training</div>
                      <div style={css("font-size:12px;color:var(--text-2)")}>Plan de entrenamiento</div>
                    </div>
                  </div>
                  <div style={css("text-align:right")}>
                    <div style={css("font-size:12px;color:var(--text-2)")}>Atleta</div>
                    <div style={css("font-weight:700;font-size:15px")}>{pdfAthlete}</div>
                  </div>
                </div>

                <div style={css("padding:30px 34px")}>
                  <div style={css("display:flex;align-items:center;gap:12px;margin-bottom:6px")}>
                    <div style={css(`width:38px;height:38px;border-radius:10px;background:${meta.hex};color:#fff;display:flex;align-items:center;justify-content:center`)}><Icon name={meta.icon} size={20} color="#fff" /></div>
                    <div>
                      <div className="tn" style={css("font-size:22px;font-weight:800;letter-spacing:-.4px")}>{workoutName}</div>
                      <div style={css("font-size:12.5px;color:var(--text-2)")}>{pdfDisc}</div>
                    </div>
                  </div>

                  <div style={css("display:flex;gap:10px;flex-wrap:wrap;margin:20px 0 26px")}>
                    {pdfSummary.map((c, i) => (
                      <div key={i} style={css("padding:12px 16px;border-radius:12px;background:var(--surface-2);border:1px solid var(--border);min-width:120px")}>
                        <div className="tn" style={css("font-size:18px;font-weight:800")}>{c.v}</div>
                        <div style={css("font-size:11.5px;color:var(--text-2);margin-top:1px")}>{c.l}</div>
                      </div>
                    ))}
                  </div>

                  <div style={css("font-size:12px;font-weight:700;color:var(--text-2);text-transform:uppercase;letter-spacing:.6px;margin-bottom:12px")}>Estructura del entreno</div>
                  <div style={css("display:flex;flex-direction:column;gap:8px")}>
                    {pdfRows.map((p, i) => (
                      <div key={i} style={css(`display:flex;align-items:center;gap:14px;margin-left:${p.indent}px;padding:13px 16px;border-radius:12px;background:${p.bg};border:1px solid var(--border);border-left:4px solid ${p.accent}`)}>
                        <div style={css(`width:26px;height:26px;flex:0 0 auto;border-radius:8px;background:${p.dotBg};color:${p.accent};display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px`)}>{p.n}</div>
                        <div style={css("font-weight:700;font-size:13.5px;min-width:110px")}>{p.label}</div>
                        <div style={css("flex:1;color:var(--text-2);font-size:13px")}>{p.detail}</div>
                        <div className="tn" style={css(`font-weight:700;font-size:13.5px;color:${p.accent}`)}>{p.target}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={css("padding:18px 34px;border-top:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;font-size:11.5px;color:var(--text-3)")}>
                  <span>Generado por Umbral Training · Coach Laura Méndez</span>
                  <span className="tn">11 ago 2026</span>
                </div>
              </div>
            </div>
          )}
    </div>
  );
}
