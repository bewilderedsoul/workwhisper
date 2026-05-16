// src/components/salary/SalarySearch.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search, X, SlidersHorizontal, TrendingUp, MapPin, Briefcase,
  Building2, ArrowUpDown, Sparkles, ChevronDown, ChevronUp,
  BarChart3, Plus, Globe, Coins,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatSalary, cn } from "@/lib/utils";

type SalaryPost = {
  id: string;
  company: string | null;
  role: string | null;
  level: string | null;
  experience: number | null;
  baseSalary: number | null;
  totalComp: number | null;
  bonus: number | null;
  stock: number | null;
  location: string | null;
  country: string | null;
  currency: string | null;
  workArrangement: string | null;
  skills: string[];
  createdAt: string;
  title: string | null;
};

type Stats = {
  count: number;
  median: number | null;
  p25: number | null;
  p75: number | null;
  p90: number | null;
  min: number | null;
  max: number | null;
  avgBase: number | null;
  currency?: string | null;
};

type Facets = {
  levels: { level: string; count: number }[];
  locations: { location: string; count: number }[];
  companies: { company: string; count: number }[];
  countries?: { country: string; count: number }[];
  currencies?: { currency: string; count: number }[];
};

type ApiResponse = {
  stats: Stats;
  byCurrency?: Record<string, Stats & { currency: string }>;
  posts: SalaryPost[];
  total: number;
  facets: Facets;
};

const ALL_LEVELS = ["Fresher", "Junior", "Mid", "Senior", "Lead", "Staff", "Principal", "Manager", "Director"];

function buildQS(state: {
  q: string;
  companies: string[];
  levels: string[];
  locations: string[];
  countries: string[];
  currencies: string[];
  expMin: number;
  expMax: number;
  sort: string;
}) {
  const p = new URLSearchParams();
  if (state.q) p.set("q", state.q);
  state.companies.forEach((c) => p.append("company", c));
  state.levels.forEach((l) => p.append("level", l));
  state.locations.forEach((l) => p.append("location", l));
  state.countries.forEach((c) => p.append("country", c));
  state.currencies.forEach((c) => p.append("currency", c));
  if (state.expMin > 0) p.set("expMin", String(state.expMin));
  if (state.expMax < 30) p.set("expMax", String(state.expMax));
  if (state.sort && state.sort !== "newest") p.set("sort", state.sort);
  return p.toString();
}

export function SalarySearch({ initialData }: { initialData: ApiResponse }) {
  const searchParams = useSearchParams();
  const [data, setData] = useState<ApiResponse>(initialData);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState(() => searchParams?.get("q") || "");
  const [companies, setCompanies] = useState<string[]>(() => searchParams?.getAll("company") || []);
  const [levels, setLevels] = useState<string[]>(() => searchParams?.getAll("level") || []);
  const [locations, setLocations] = useState<string[]>(() => searchParams?.getAll("location") || []);
  const [countries, setCountries] = useState<string[]>(() => searchParams?.getAll("country") || []);
  const [currencies, setCurrencies] = useState<string[]>(() => searchParams?.getAll("currency") || []);
  const [expRange, setExpRange] = useState<[number, number]>(() => [
    Number(searchParams?.get("expMin") || 0),
    Number(searchParams?.get("expMax") || 30),
  ]);
  const [sort, setSort] = useState(() => searchParams?.get("sort") || "newest");
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [showAllCompanies, setShowAllCompanies] = useState(false);
  const [showAllLocations, setShowAllLocations] = useState(false);
  const [showAllCountries, setShowAllCountries] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const qs = useMemo(
    () => buildQS({ q, companies, levels, locations, countries, currencies, expMin: expRange[0], expMax: expRange[1], sort }),
    [q, companies, levels, locations, countries, currencies, expRange, sort]
  );

  useEffect(() => {
    const ctl = new AbortController();
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/salaries?${qs}`, { signal: ctl.signal });
        const json = (await res.json()) as ApiResponse;
        setData(json);
      } catch {
        // ignore aborts
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(t);
      ctl.abort();
    };
  }, [qs]);

  const toggle = (list: string[], set: (l: string[]) => void, v: string) => {
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  };

  const clearAll = () => {
    setQ("");
    setCompanies([]);
    setLevels([]);
    setLocations([]);
    setCountries([]);
    setCurrencies([]);
    setExpRange([0, 30]);
    setSort("newest");
  };

  const activeFilterCount =
    companies.length + levels.length + locations.length + countries.length + currencies.length +
    (expRange[0] > 0 || expRange[1] < 30 ? 1 : 0) + (q ? 1 : 0);

  const companyList = showAllCompanies ? data.facets.companies : data.facets.companies.slice(0, 8);
  const locationList = showAllLocations ? data.facets.locations : data.facets.locations.slice(0, 8);
  const countryList = showAllCountries ? (data.facets.countries ?? []) : (data.facets.countries ?? []).slice(0, 8);

  const dominantCurrency = data.stats.currency || null;
  const mixedCurrencies = !dominantCurrency && data.byCurrency && Object.keys(data.byCurrency).length > 1;

  return (
    <div className="space-y-6">
      {/* Hero search */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-whisper-500/10 via-background to-saffron-500/10 p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-72 h-72 bg-whisper-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-saffron-500/10 rounded-full blur-3xl pointer-events-none translate-y-1/2 -translate-x-1/2" />

        <div className="relative">
          <h1 className="font-display font-bold text-3xl sm:text-4xl mb-2 text-balance">
            What does <span className="gradient-text">your role</span> pay anywhere on Earth?
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base mb-5 max-w-xl">
            {data.stats.count > 0 ? (
              <>
                Search <strong>{data.stats.count.toLocaleString()}+</strong> anonymous salary reports
                across companies, levels, locations and countries worldwide.
              </>
            ) : (
              "Search anonymous salary reports across companies, levels, locations and countries worldwide."
            )}
          </p>

          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search company, role, skill, city or country..."
              className="w-full pl-12 pr-12 py-4 text-base bg-background border-2 border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-whisper-500/40 focus:border-whisper-500/40 transition shadow-sm"
            />
            {q && (
              <button
                onClick={() => setQ("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-muted"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-4">
            <span className="text-xs text-muted-foreground">Try:</span>
            {["Google London", "Stripe Dublin", "Meta E5", "Bangalore", "Singapore", "Senior", "Dubai"].map((s) => (
              <button
                key={s}
                onClick={() => setQ(s)}
                className="text-xs px-3 py-1 rounded-full bg-background/60 border border-border hover:border-whisper-500/40 hover:bg-whisper-500/10 transition"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats bar — currency-aware */}
      {mixedCurrencies ? (
        <MixedCurrencyStats byCurrency={data.byCurrency!} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Reports" value={data.stats.count.toLocaleString()} icon={<BarChart3 className="w-4 h-4" />} accent="from-whisper-500/20 to-whisper-500/5" />
          <StatCard label="Median CTC" value={data.stats.median ? formatSalary(data.stats.median, dominantCurrency || "INR") : "—"} icon={<TrendingUp className="w-4 h-4" />} accent="from-green-500/20 to-green-500/5" />
          <StatCard label="P75 CTC" value={data.stats.p75 ? formatSalary(data.stats.p75, dominantCurrency || "INR") : "—"} icon={<TrendingUp className="w-4 h-4" />} accent="from-saffron-500/20 to-saffron-500/5" />
          <StatCard label="Top CTC" value={data.stats.max ? formatSalary(data.stats.max, dominantCurrency || "INR") : "—"} icon={<Sparkles className="w-4 h-4" />} accent="from-pink-500/20 to-pink-500/5" />
        </div>
      )}

      {/* Percentile bar */}
      {!mixedCurrencies && data.stats.count > 1 && data.stats.p25 && data.stats.p75 && data.stats.median && (
        <PercentileBar
          p25={data.stats.p25}
          median={data.stats.median}
          p75={data.stats.p75}
          p90={data.stats.p90 || 0}
          max={data.stats.max || 0}
          currency={dominantCurrency || "INR"}
        />
      )}

      {/* Active filter chips + actions */}
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {countries.map((c) => <Chip key={`co-${c}`} label={`🌍 ${c}`} onRemove={() => toggle(countries, setCountries, c)} />)}
          {companies.map((c) => <Chip key={`c-${c}`} label={c} onRemove={() => toggle(companies, setCompanies, c)} />)}
          {levels.map((l) => <Chip key={`l-${l}`} label={l} onRemove={() => toggle(levels, setLevels, l)} />)}
          {locations.map((l) => <Chip key={`loc-${l}`} label={l} onRemove={() => toggle(locations, setLocations, l)} />)}
          {currencies.map((c) => <Chip key={`cu-${c}`} label={c} onRemove={() => toggle(currencies, setCurrencies, c)} />)}
          {(expRange[0] > 0 || expRange[1] < 30) && (
            <Chip label={`${expRange[0]}–${expRange[1]} YoE`} onRemove={() => setExpRange([0, 30])} />
          )}
          {activeFilterCount > 0 && (
            <button onClick={clearAll} className="text-xs text-muted-foreground underline hover:text-foreground ml-1">
              Clear all
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 text-sm bg-background border border-border rounded-lg cursor-pointer hover:border-whisper-500/40 focus:outline-none focus:ring-2 focus:ring-whisper-500/40"
            >
              <option value="newest">Newest</option>
              <option value="highest">Highest CTC</option>
              <option value="lowest">Lowest CTC</option>
              <option value="mostExp">Most experience</option>
            </select>
            <ArrowUpDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          </div>
          <button
            onClick={() => setFiltersOpen((v) => !v)}
            className="lg:hidden flex items-center gap-2 px-3 py-2 text-sm bg-background border border-border rounded-lg hover:border-whisper-500/40 transition"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters{activeFilterCount > 0 && ` (${activeFilterCount})`}
          </button>
          <Link
            href="/salary/submit"
            className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-whisper-500 hover:bg-whisper-600 text-white rounded-lg transition"
          >
            <Plus className="w-4 h-4" />
            Add yours
          </Link>
        </div>
      </div>

      {/* Filter grid + Results */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        <AnimatePresence>
          {(filtersOpen || (typeof window !== "undefined" && window.innerWidth >= 1024)) && (
            <motion.aside
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-5 lg:sticky lg:top-20 lg:self-start"
            >
              <FilterGroup title="Country" icon={<Globe className="w-4 h-4" />}>
                <div className="space-y-1.5">
                  {countryList.map((c) => (
                    <CheckRow
                      key={c.country}
                      label={c.country}
                      count={c.count}
                      checked={countries.includes(c.country)}
                      onChange={() => toggle(countries, setCountries, c.country)}
                    />
                  ))}
                  {(data.facets.countries?.length ?? 0) > 8 && (
                    <button
                      onClick={() => setShowAllCountries((v) => !v)}
                      className="text-xs text-whisper-500 hover:text-whisper-600 mt-2 flex items-center gap-1"
                    >
                      {showAllCountries ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      {showAllCountries ? "Show fewer" : `Show ${(data.facets.countries?.length ?? 0) - 8} more`}
                    </button>
                  )}
                </div>
              </FilterGroup>

              <FilterGroup title="Company" icon={<Building2 className="w-4 h-4" />}>
                <div className="space-y-1.5">
                  {companyList.map((c) => (
                    <CheckRow
                      key={c.company}
                      label={c.company}
                      count={c.count}
                      checked={companies.includes(c.company)}
                      onChange={() => toggle(companies, setCompanies, c.company)}
                    />
                  ))}
                  {data.facets.companies.length > 8 && (
                    <button
                      onClick={() => setShowAllCompanies((v) => !v)}
                      className="text-xs text-whisper-500 hover:text-whisper-600 mt-2 flex items-center gap-1"
                    >
                      {showAllCompanies ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      {showAllCompanies ? "Show fewer" : `Show ${data.facets.companies.length - 8} more`}
                    </button>
                  )}
                </div>
              </FilterGroup>

              <FilterGroup title="Level" icon={<Briefcase className="w-4 h-4" />}>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_LEVELS.map((lv) => {
                    const facet = data.facets.levels.find((f) => f.level === lv);
                    const count = facet?.count ?? 0;
                    const active = levels.includes(lv);
                    return (
                      <button
                        key={lv}
                        disabled={!count && !active}
                        onClick={() => toggle(levels, setLevels, lv)}
                        className={cn(
                          "px-2.5 py-1 text-xs rounded-full border transition",
                          active
                            ? "bg-whisper-500 border-whisper-500 text-white"
                            : count
                            ? "bg-background border-border hover:border-whisper-500/50"
                            : "bg-muted/30 border-border/40 text-muted-foreground/40 cursor-not-allowed"
                        )}
                      >
                        {lv}
                        {count > 0 && <span className={cn("ml-1 text-[10px]", active ? "text-white/70" : "text-muted-foreground")}>{count}</span>}
                      </button>
                    );
                  })}
                </div>
              </FilterGroup>

              <FilterGroup title="City / Office" icon={<MapPin className="w-4 h-4" />}>
                <div className="space-y-1.5">
                  {locationList.map((l) => (
                    <CheckRow
                      key={l.location}
                      label={l.location}
                      count={l.count}
                      checked={locations.includes(l.location)}
                      onChange={() => toggle(locations, setLocations, l.location)}
                    />
                  ))}
                  {data.facets.locations.length > 8 && (
                    <button
                      onClick={() => setShowAllLocations((v) => !v)}
                      className="text-xs text-whisper-500 hover:text-whisper-600 mt-2 flex items-center gap-1"
                    >
                      {showAllLocations ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      {showAllLocations ? "Show fewer" : `Show ${data.facets.locations.length - 8} more`}
                    </button>
                  )}
                </div>
              </FilterGroup>

              {data.facets.currencies && data.facets.currencies.length > 1 && (
                <FilterGroup title="Currency" icon={<Coins className="w-4 h-4" />}>
                  <div className="flex flex-wrap gap-1.5">
                    {data.facets.currencies.map((c) => {
                      const active = currencies.includes(c.currency);
                      return (
                        <button
                          key={c.currency}
                          onClick={() => toggle(currencies, setCurrencies, c.currency)}
                          className={cn(
                            "px-2.5 py-1 text-xs rounded-full border transition",
                            active
                              ? "bg-whisper-500 border-whisper-500 text-white"
                              : "bg-background border-border hover:border-whisper-500/50"
                          )}
                        >
                          {c.currency}
                          <span className={cn("ml-1 text-[10px]", active ? "text-white/70" : "text-muted-foreground")}>{c.count}</span>
                        </button>
                      );
                    })}
                  </div>
                </FilterGroup>
              )}

              <FilterGroup title="Years of experience" icon={<TrendingUp className="w-4 h-4" />}>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <input
                      type="number"
                      value={expRange[0]}
                      min={0}
                      max={expRange[1]}
                      onChange={(e) => setExpRange([Math.max(0, Number(e.target.value) || 0), expRange[1]])}
                      className="w-16 px-2 py-1 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-whisper-500/40"
                    />
                    <span className="text-muted-foreground">to</span>
                    <input
                      type="number"
                      value={expRange[1]}
                      min={expRange[0]}
                      max={30}
                      onChange={(e) => setExpRange([expRange[0], Math.min(30, Number(e.target.value) || 30)])}
                      className="w-16 px-2 py-1 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-whisper-500/40"
                    />
                    <span className="text-muted-foreground text-xs">years</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {([
                      { label: "0–2", v: [0, 2] },
                      { label: "2–5", v: [2, 5] },
                      { label: "5–9", v: [5, 9] },
                      { label: "9–14", v: [9, 14] },
                      { label: "14+", v: [14, 30] },
                    ] as { label: string; v: [number, number] }[]).map((p) => (
                      <button
                        key={p.label}
                        onClick={() => setExpRange(p.v)}
                        className={cn(
                          "px-2 py-0.5 text-[11px] rounded-full border transition",
                          expRange[0] === p.v[0] && expRange[1] === p.v[1]
                            ? "bg-whisper-500 border-whisper-500 text-white"
                            : "bg-background border-border hover:border-whisper-500/40"
                        )}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </FilterGroup>
            </motion.aside>
          )}
        </AnimatePresence>

        <div className="space-y-3 min-w-0">
          {loading && (
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-whisper-500 border-t-transparent rounded-full animate-spin" />
              Updating...
            </div>
          )}

          {data.posts.length === 0 ? (
            <div className="whisper-card p-10 text-center bg-gradient-to-br from-whisper-500/5 via-background to-saffron-500/5">
              <div className="text-5xl mb-3">🐠</div>
              <p className="font-display font-bold text-xl mb-1">
                {q ? `No salary data for "${q}" yet` : "No results match these filters"}
              </p>
              <p className="text-sm text-muted-foreground mb-5 max-w-md mx-auto">
                {q
                  ? `Be the first to share what ${q} pays — your anonymous contribution helps everyone negotiate better.`
                  : "Try removing some filters, or be the first to contribute salary data for a new company."}
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <Link
                  href={q ? `/salary/submit?company=${encodeURIComponent(q)}` : "/salary/submit"}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-semibold text-sm bg-whisper-500 hover:bg-whisper-600 text-white transition"
                >
                  <Plus className="w-4 h-4" />
                  {q ? `Add salary for "${q}"` : "Add salary"}
                </Link>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearAll}
                    className="px-5 py-2.5 text-sm rounded-xl border border-border hover:bg-muted transition"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            </div>
          ) : (
            data.posts.map((p) => (
              <SalaryCard
                key={p.id}
                post={p}
                expanded={expanded === p.id}
                onToggle={() => setExpanded(expanded === p.id ? null : p.id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function MixedCurrencyStats({ byCurrency }: { byCurrency: Record<string, Stats & { currency: string }> }) {
  const entries = Object.values(byCurrency).sort((a, b) => b.count - a.count);
  return (
    <div className="whisper-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="font-display font-semibold text-sm flex items-center gap-2">
          <Globe className="w-4 h-4 text-whisper-500" />
          Stats by currency
        </div>
        <span className="text-xs text-muted-foreground">
          Filter by country or currency to see one combined picture
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {entries.map((s) => (
          <div key={s.currency} className="bg-muted/30 rounded-lg p-3 border border-border/60">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold">{s.currency}</span>
              <span className="text-[10px] text-muted-foreground">{s.count} reports</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-center">
              <div>
                <div className="text-[10px] uppercase text-muted-foreground">P25</div>
                <div className="text-xs font-bold">{s.p25 ? formatSalary(s.p25, s.currency) : "—"}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-muted-foreground">Median</div>
                <div className="text-sm font-bold text-green-500">{s.median ? formatSalary(s.median, s.currency) : "—"}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-muted-foreground">P75</div>
                <div className="text-xs font-bold">{s.p75 ? formatSalary(s.p75, s.currency) : "—"}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className={cn("relative overflow-hidden whisper-card p-4")}>
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-50 pointer-events-none", accent)} />
      <div className="relative">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
          {icon}
          {label}
        </div>
        <div className="font-display font-bold text-xl sm:text-2xl">{value}</div>
      </div>
    </div>
  );
}

function PercentileBar({
  p25,
  median,
  p75,
  p90,
  max,
  currency,
}: {
  p25: number;
  median: number;
  p75: number;
  p90: number;
  max: number;
  currency: string;
}) {
  const ceiling = Math.max(max, p90, p75, median, p25) || 1;
  const pct = (v: number) => Math.min(100, Math.max(0, (v / ceiling) * 100));

  return (
    <div className="whisper-card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="font-display font-semibold text-sm">CTC distribution</div>
        <div className="text-xs text-muted-foreground">{currency}</div>
      </div>
      <div className="relative h-2.5 rounded-full bg-muted overflow-hidden">
        <div
          className="absolute top-0 bottom-0 bg-gradient-to-r from-whisper-500 via-saffron-500 to-pink-500"
          style={{ left: `${pct(p25)}%`, width: `${pct(p75) - pct(p25)}%` }}
        />
        {[
          { v: p25, label: "P25" },
          { v: median, label: "Median" },
          { v: p75, label: "P75" },
          ...(p90 ? [{ v: p90, label: "P90" }] : []),
        ].map((m) => (
          <div
            key={m.label}
            className="absolute -top-1 -bottom-1 w-0.5 bg-foreground"
            style={{ left: `${pct(m.v)}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between mt-3 text-xs">
        {[
          { v: p25, label: "P25" },
          { v: median, label: "Median" },
          { v: p75, label: "P75" },
          ...(p90 ? [{ v: p90, label: "P90" }] : []),
        ].map((m) => (
          <div key={m.label} className="text-center">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{m.label}</div>
            <div className="font-bold text-foreground">{formatSalary(m.v, currency)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FilterGroup({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="whisper-card p-4">
      <div className="flex items-center gap-2 mb-3 text-sm font-display font-semibold">
        <span className="text-whisper-500">{icon}</span>
        {title}
      </div>
      {children}
    </div>
  );
}

function CheckRow({
  label,
  count,
  checked,
  onChange,
}: {
  label: string;
  count: number;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className={cn(
      "flex items-center justify-between cursor-pointer group p-1.5 -mx-1.5 rounded-md transition",
      checked ? "bg-whisper-500/10" : "hover:bg-muted/50"
    )}>
      <div className="flex items-center gap-2 min-w-0">
        <span className={cn(
          "w-3.5 h-3.5 rounded border flex items-center justify-center transition shrink-0",
          checked ? "bg-whisper-500 border-whisper-500" : "border-border group-hover:border-whisper-500/50"
        )}>
          {checked && (
            <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 text-white">
              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>
        <span className="text-sm truncate">{label}</span>
        <input type="checkbox" className="sr-only" checked={checked} onChange={onChange} />
      </div>
      <span className="text-xs text-muted-foreground shrink-0 ml-2">{count}</span>
    </label>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full bg-whisper-500/10 border border-whisper-500/30 text-whisper-700 dark:text-whisper-300">
      {label}
      <button onClick={onRemove} className="hover:bg-whisper-500/20 rounded-full p-0.5" aria-label="Remove">
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

function SalaryCard({
  post,
  expanded,
  onToggle,
}: {
  post: SalaryPost;
  expanded: boolean;
  onToggle: () => void;
}) {
  const total = post.totalComp || post.baseSalary || 0;
  const cur = post.currency || "INR";
  return (
    <motion.div layout className="whisper-card-hover overflow-hidden">
      <button onClick={onToggle} className="w-full text-left p-4 flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-display font-semibold text-sm">{post.company || "Unknown"}</span>
            {post.level && (
              <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-whisper-500/10 text-whisper-600 dark:text-whisper-400">
                {post.level}
              </span>
            )}
            {post.country && (
              <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-saffron-500/10 text-saffron-600 dark:text-saffron-400">
                🌍 {post.country}
              </span>
            )}
            {post.workArrangement && (
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                · {post.workArrangement}
              </span>
            )}
          </div>
          <div className="text-sm text-foreground/80 truncate">{post.role || "Role unspecified"}</div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
            {post.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {post.location}
              </span>
            )}
            {post.experience != null && (
              <span className="inline-flex items-center gap-1">
                <Briefcase className="w-3 h-3" />
                {post.experience} {post.experience === 1 ? "yr" : "yrs"}
              </span>
            )}
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Total CTC</div>
          <div className="font-bold text-lg text-green-500">{formatSalary(total, cur)}</div>
          {post.baseSalary && total !== post.baseSalary && (
            <div className="text-[10px] text-muted-foreground">Base {formatSalary(post.baseSalary, cur)}</div>
          )}
        </div>
        <ChevronDown className={cn("w-4 h-4 text-muted-foreground/40 transition-transform shrink-0", expanded && "rotate-180")} />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border"
          >
            <div className="p-4 space-y-3 bg-muted/30">
              <div className="grid grid-cols-3 gap-2">
                <Bd label="Base" value={post.baseSalary ? formatSalary(post.baseSalary, cur) : "—"} />
                <Bd label="Bonus" value={post.bonus ? formatSalary(post.bonus, cur) : "—"} />
                <Bd label="Stock" value={post.stock ? formatSalary(post.stock, cur) : "—"} />
              </div>
              {post.skills?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {post.skills.map((s) => (
                    <span key={s} className="text-[11px] px-2 py-0.5 rounded-full bg-background border border-border">
                      {s}
                    </span>
                  ))}
                </div>
              )}
              <Link
                href={`/post/${post.id}`}
                className="inline-block text-xs text-whisper-500 hover:text-whisper-600 underline"
              >
                View full discussion →
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Bd({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-background rounded-lg p-2.5 border border-border/60">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-semibold text-sm mt-0.5">{value}</div>
    </div>
  );
}
