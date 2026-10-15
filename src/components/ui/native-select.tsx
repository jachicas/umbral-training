import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A native <select> with the browser's arrow replaced by our own, so every
 * dropdown has the same padding and the text never runs into the arrow.
 */
export function NativeSelect({
  className,
  style,
  children,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <span className="relative inline-flex items-center">
      <select
        {...props}
        className={cn(
          "h-9 appearance-none truncate rounded-[9px] border pr-8 pl-3 text-[13px] font-semibold outline-none disabled:opacity-50",
          className
        )}
        style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)", ...style }}
      >
        {children}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-2.5" style={{ color: "var(--text-3)" }} />
    </span>
  );
}
