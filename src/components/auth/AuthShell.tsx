import type { ReactNode } from "react";
import Image from "next/image";

const BACKGROUND_IMAGE = "/backgrounds/tt-ride.jpg";

/** The signed-out frame — sign-in and the invite's first password: a glass panel with the form beside a photo. */
export function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <main className="relative flex min-h-dvh items-center justify-center p-3 md:p-6" style={{ color: "var(--text)" }}>
      {/* The photo fills the page, blurred on wide screens where the panel on
          the right shows it sharp; on a phone it stays sharp behind the card. */}
      <div aria-hidden className="fixed inset-0 overflow-hidden" style={{ backgroundColor: "var(--bg)" }}>
        <Image
          src={BACKGROUND_IMAGE}
          alt=""
          fill
          priority
          sizes="100vw"
          className="scale-110 object-cover md:blur-2xl"
          style={{ objectPosition: "62% center" }}
        />
        <div className="absolute inset-0" style={{ backgroundImage: "var(--bg-scrim)" }} />
      </div>

      <div className="glass relative grid w-full max-w-[1080px] gap-3 rounded-[32px] p-3 md:min-h-[min(660px,calc(100dvh-48px))] md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        {/* ---------------- form ---------------- */}
        <section className="flex flex-col px-4 py-5 md:px-8 md:py-7">
          <div className="flex items-center gap-2.5">
            <div
              className="flex size-9 flex-none items-center justify-center rounded-[11px] text-[17px] font-extrabold tracking-tight text-white"
              style={{ background: "var(--coral)" }}
            >
              U
            </div>
            <div className="text-[14.5px] font-bold tracking-tight">Umbral Training</div>
          </div>

          <div className="mx-auto flex w-full max-w-[360px] flex-1 flex-col justify-center py-10 md:py-8">
            <div className="mb-7 text-center">
              <h1 className="text-[28px] leading-tight font-bold tracking-tight">{title}</h1>
              {subtitle && (
                <div className="mt-1.5 text-[14px]" style={{ color: "var(--text-2)" }}>
                  {subtitle}
                </div>
              )}
            </div>
            {children}
          </div>
        </section>

        {/* ---------------- photo ---------------- */}
        <aside aria-hidden className="relative overflow-hidden rounded-[24px] max-md:hidden">
          <Image
            src={BACKGROUND_IMAGE}
            alt=""
            fill
            sizes="(min-width: 768px) 560px, 0px"
            className="object-cover"
            style={{ objectPosition: "60% center" }}
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(180deg, rgba(5,8,12,0) 45%, rgba(5,8,12,0.7) 100%)" }}
          />

          {/* Kept in the sky, clear of the rider. */}
          <div className="absolute top-6 left-6 flex flex-col items-start gap-3">
            <div className={`${photoGlass} flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[12.5px] font-medium`}>
              <span className="size-2 rounded-full" style={{ background: "var(--bike)" }} />
              Hoy · Bici 40 km
            </div>
            <WeekCard />
          </div>

          <div className="absolute inset-x-0 bottom-0 p-7 text-white">
            <div className="text-[24px] leading-tight font-bold tracking-tight">Cada sesión, con un plan.</div>
          </div>
        </aside>
      </div>
    </main>
  );
}

/** Dark-tinted glass, so white text holds up against the bright sky. */
const photoGlass =
  "border border-white/20 bg-[rgba(12,20,32,0.32)] text-white shadow-[0_12px_40px_rgba(0,0,0,0.18)] backdrop-blur-xl";

const WEEK = [
  { sport: "Natación", detail: "2.000 m", color: "var(--swim)", done: true },
  { sport: "Bici", detail: "40 km · Z3", color: "var(--bike)", done: false },
  { sport: "Carrera", detail: "10 km · 4:45 /km", color: "var(--run)", done: false },
];

/** A decorative glimpse of an athlete's week, floating over the photo. */
function WeekCard() {
  return (
    <div className={`${photoGlass} w-[230px] rounded-[18px] p-3.5`}>
      <div className="mb-2.5 flex items-center justify-between text-[12.5px]">
        <span className="font-semibold">Esta semana</span>
        <span className="text-white/70">1 de 3</span>
      </div>
      <div className="flex flex-col gap-2">
        {WEEK.map((item) => (
          <div key={item.sport} className="flex items-center gap-2.5 rounded-[11px] bg-white/10 px-2.5 py-2">
            <span className="h-7 w-1 flex-none rounded-full" style={{ background: item.color }} />
            <div className="min-w-0 flex-1 leading-tight">
              <div className={item.done ? "text-[13px] font-medium text-white/60 line-through" : "text-[13px] font-medium"}>
                {item.sport}
              </div>
              <div className="text-[11.5px] text-white/70">{item.detail}</div>
            </div>
            {item.done && (
              <span className="flex size-[18px] flex-none items-center justify-center rounded-full bg-white text-[11px] font-bold text-[var(--ok)]">
                ✓
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
