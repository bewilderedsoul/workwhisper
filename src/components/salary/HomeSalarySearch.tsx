// src/components/salary/HomeSalarySearch.tsx
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Search, ArrowRight, Plus, Building2 } from "lucide-react";

type Suggestion = { company: string; count: number };

export function HomeSalarySearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!q.trim()) {
      setSuggestions([]);
      return;
    }
    const ctl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/salaries/companies?q=${encodeURIComponent(q)}`, { signal: ctl.signal });
        const json = await res.json();
        setSuggestions(json.companies?.slice(0, 6) || []);
      } catch {}
    }, 150);
    return () => {
      clearTimeout(t);
      ctl.abort();
    };
  }, [q]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const url = q ? `/salary?q=${encodeURIComponent(q.trim())}` : "/salary";
    router.push(url);
  };

  const goWith = (key: "q" | "level" | "location" | "company", value: string) => {
    router.push(`/salary?${key}=${encodeURIComponent(value)}`);
  };

  const showSuggestions = open && focused && q.trim().length > 0;
  const exactMatch = suggestions.some(
    (s) => s.company.toLowerCase() === q.trim().toLowerCase()
  );

  return (
    <div ref={boxRef} className="relative">
      <form onSubmit={submit} className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setFocused(true);
            setOpen(true);
          }}
          onBlur={() => setFocused(false)}
          placeholder="Search any company, role, level or location..."
          className="w-full pl-12 pr-32 py-4 text-base bg-background border-2 border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-whisper-500/40 focus:border-whisper-500/40 transition shadow-sm"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 px-4 py-2 rounded-xl bg-whisper-500 hover:bg-whisper-600 text-white text-sm font-semibold transition"
        >
          Search <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </form>

      {showSuggestions && (
        <div className="absolute z-30 top-full mt-2 w-full bg-popover border border-border rounded-xl shadow-xl overflow-hidden">
          {suggestions.length > 0 ? (
            <>
              <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold border-b border-border">
                Companies with data
              </div>
              {suggestions.map((s) => (
                <button
                  key={s.company}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    goWith("company", s.company);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-muted text-left text-sm transition"
                >
                  <span className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-whisper-500" />
                    {s.company}
                  </span>
                  <span className="text-xs text-muted-foreground">{s.count} reports</span>
                </button>
              ))}
            </>
          ) : null}
          {!exactMatch && q.trim().length > 1 && (
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                router.push(`/salary/submit?company=${encodeURIComponent(q.trim())}`);
              }}
              className="w-full flex items-center gap-2 px-3 py-3 bg-gradient-to-r from-whisper-500/10 to-saffron-500/10 hover:from-whisper-500/20 hover:to-saffron-500/20 text-left text-sm font-semibold transition border-t border-border"
            >
              <Plus className="w-4 h-4 text-whisper-500" />
              Add salary for "{q.trim()}"
              <span className="ml-auto text-xs text-muted-foreground font-normal">Be the first</span>
            </button>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mt-3">
        <span className="text-xs text-muted-foreground">Popular:</span>
        {[
          { label: "Google", key: "company" as const, value: "Google" },
          { label: "NVIDIA", key: "company" as const, value: "NVIDIA" },
          { label: "Senior", key: "level" as const, value: "Senior" },
          { label: "Bangalore", key: "location" as const, value: "Bangalore" },
          { label: "Freshers", key: "level" as const, value: "Fresher" },
        ].map((t) => (
          <button
            key={t.label}
            onClick={() => goWith(t.key, t.value)}
            className="text-xs px-3 py-1 rounded-full bg-background/60 backdrop-blur-sm border border-border hover:border-whisper-500/40 hover:bg-whisper-500/10 transition"
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
