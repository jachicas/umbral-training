"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

const ATHLETES_PATH = "/athletes";

/**
 * The header's search. It searches athletes through `?q=` on /athletes:
 * there it filters the list as you type; anywhere else, Enter takes you there.
 * ⌘K (Ctrl+K) focuses it from any page.
 */
export function HeaderSearch({ className }: { className?: string }) {
  const pathname = usePathname();
  // Leaving /athletes starts it empty again; coming back with `?q=` picks it up.
  return <SearchField key={pathname === ATHLETES_PATH ? "athletes" : pathname} className={className} />;
}

function SearchField({ className }: { className?: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const onAthletes = pathname === ATHLETES_PATH;
  const urlQuery = onAthletes ? searchParams.get("q") ?? "" : "";
  const [value, setValue] = useState(urlQuery);
  const [seenUrlQuery, setSeenUrlQuery] = useState(urlQuery);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cleared from the page ("Quitar filtros") or by going back: the field follows the URL.
  if (urlQuery !== seenUrlQuery) {
    setSeenUrlQuery(urlQuery);
    if (urlQuery.trim() !== value.trim()) setValue(urlQuery);
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Keeps the other params (`?archived=1`) and skips the server: the list filters on the client.
  function syncQuery(next: string) {
    const params = new URLSearchParams(window.location.search);
    if (next.trim()) params.set("q", next);
    else params.delete("q");
    const query = params.toString();
    window.history.replaceState(null, "", query ? `${ATHLETES_PATH}?${query}` : ATHLETES_PATH);
  }

  function change(next: string) {
    setValue(next);
    if (onAthletes) syncQuery(next);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      change("");
      inputRef.current?.blur();
    }
    if (e.key === "Enter" && !onAthletes && value.trim()) {
      router.push(`${ATHLETES_PATH}?q=${encodeURIComponent(value.trim())}`);
    }
  }

  return (
    <SearchShell className={className}>
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => change(e.target.value)}
        onKeyDown={onKeyDown}
        aria-label="Buscar atletas"
        placeholder="Buscar atletas…"
        className="w-full min-w-0 bg-transparent text-[14px] outline-none placeholder:text-[var(--text-3)] [&::-webkit-search-cancel-button]:hidden"
        style={{ color: "var(--text)" }}
      />
    </SearchShell>
  );
}

/** Shown until the URL is read (the field depends on `?q=`), so the header doesn't jump. */
export function HeaderSearchFallback({ className }: { className?: string }) {
  return (
    <SearchShell className={className}>
      <input
        disabled
        aria-label="Buscar atletas"
        placeholder="Buscar atletas…"
        className="w-full min-w-0 bg-transparent text-[14px] outline-none placeholder:text-[var(--text-3)]"
      />
    </SearchShell>
  );
}

function SearchShell({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <label
      className={cn(
        "glass flex h-11 min-w-0 max-w-[540px] flex-1 cursor-text items-center gap-2.5 rounded-full px-4",
        className
      )}
    >
      <Search size={17} className="flex-none" style={{ color: "var(--text-3)" }} />
      {children}
      <kbd
        className="flex-none rounded-md border px-1.5 py-0.5 font-sans text-[11px] font-semibold max-md:hidden"
        style={{ color: "var(--text-2)", borderColor: "var(--border-2)", background: "var(--surface-2)" }}
      >
        ⌘K
      </kbd>
    </label>
  );
}
