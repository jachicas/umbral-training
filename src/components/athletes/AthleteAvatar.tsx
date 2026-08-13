import { cn } from "@/lib/utils";

export function initialsOf(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

export function AthleteAvatar({
  fullName,
  color,
  size = 46,
  radius = 13,
  className,
}: {
  fullName: string;
  color: string;
  size?: number;
  radius?: number;
  className?: string;
}) {
  return (
    <div
      className={cn("flex flex-none items-center justify-center font-bold text-white", className)}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: color,
        fontSize: Math.round(size * 0.35),
      }}
    >
      {initialsOf(fullName)}
    </div>
  );
}
