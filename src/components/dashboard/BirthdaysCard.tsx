import Link from "next/link";
import { Cake, MessageCircle } from "lucide-react";
import type { DashboardBirthday } from "@/lib/domain/dashboard";
import { addDaysISO } from "@/lib/domain/time";

const WEEKDAYS_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

/** "Hoy", "Mañana", or "Jue 6". */
function dayLabel(date: string, today: string): string {
  if (date === today) return "Hoy";
  if (date === addDaysISO(today, 1)) return "Mañana";
  const d = new Date(date + "T00:00:00");
  return `${WEEKDAYS_SHORT[d.getDay()]} ${d.getDate()}`;
}

function whatsappUrl(number: string, fullName: string): string {
  const firstName = fullName.trim().split(/\s+/)[0];
  return `https://wa.me/${number}?text=${encodeURIComponent(`¡Feliz cumpleaños, ${firstName}!`)}`;
}

/** The week's birthdays, from the API: the day, the age they turn and a WhatsApp greeting. Hidden when there are none. */
export function BirthdaysCard({
  birthdays,
  today,
  className,
  style,
}: {
  birthdays: DashboardBirthday[];
  today: string;
  className: string;
  style: React.CSSProperties;
}) {
  if (birthdays.length === 0) return null;

  return (
    <div className={className} style={style}>
      <div className="mb-3.5 flex items-center gap-2 text-base font-bold">
        <Cake size={18} style={{ color: "var(--coral)" }} /> Cumpleaños
      </div>
      <ul className="flex flex-col">
        {birthdays.map((b) => {
          const isToday = b.date === today;
          return (
            <li key={b.athleteId} className="flex items-center gap-3 px-2 py-2">
              <span
                className="w-[52px] flex-none rounded-[8px] py-1 text-center text-[12px] font-bold"
                style={
                  isToday
                    ? { background: "var(--coral)", color: "var(--on-coral)" }
                    : { background: "var(--surface-2)", color: "var(--text-2)" }
                }
              >
                {dayLabel(b.date, today)}
              </span>
              <span className="min-w-0 flex-1">
                <Link
                  href={`/athletes/${b.athleteId}`}
                  className="block truncate text-[13.5px] font-semibold hover:underline"
                  style={{ color: "var(--text)" }}
                >
                  {b.fullName}
                </Link>
                <span className="block text-[12px]" style={{ color: "var(--text-3)" }}>
                  Cumple {b.age}
                </span>
              </span>
              {b.whatsapp && (
                <a
                  href={whatsappUrl(b.whatsapp, b.fullName)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Felicitar a ${b.fullName} por WhatsApp`}
                  title="WhatsApp"
                  className="flex size-8 flex-none items-center justify-center rounded-[9px] transition-[filter] hover:brightness-95"
                  style={{ background: "var(--coral-tint)", color: "var(--coral)" }}
                >
                  <MessageCircle size={16} />
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
