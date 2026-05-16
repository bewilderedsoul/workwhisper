// src/app/(main)/search/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";
import { PostCard } from "@/components/feed/PostCard";
import { PostCardSkeleton } from "@/components/feed/PostCardSkeleton";
import Link from "next/link";
import { Search, Users, ChevronRight, DollarSign, MapPin, Briefcase, TrendingUp, Layers } from "lucide-react";
import { formatCount, formatSalary } from "@/lib/utils";
import type { PostWithRelations } from "@/types";

interface Bowl {
  id: string; name: string; slug: string; icon: string; memberCount: number;
  _count: { posts: number };
}

interface SalarySearchResult {
  summary: {
    count: number;
    avgBase: number | null;
    avgTotal: number | null;
    companies: string[];
    roles: string[];
    locations: string[];
    levels: Array<{
      level: string;
      count: number;
      avgBase: number | null;
      avgTotal: number | null;
    }>;
  };
  posts: PostWithRelations[];
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQ = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQ);
  const [results, setResults] = useState<{ posts: PostWithRelations[]; bowls: Bowl[]; salary: SalarySearchResult | null } | null>(null);
  const [loading, setLoading] = useState(false);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setResults(null); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      doSearch(query);
      if (query) router.replace(`/search?q=${encodeURIComponent(query)}`, { scroll: false });
    }, 300);
    return () => clearTimeout(t);
  }, [query, doSearch]);

  useEffect(() => {
    if (initialQ) doSearch(initialQ);
  }, []);

  const salaryPostIds = new Set(results?.salary?.posts.map((post) => post.id) || []);
  const discussionPosts = results?.posts.filter((post) => !salaryPostIds.has(post.id)) || [];

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="font-display font-bold text-2xl mb-3">Search</h1>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search company, location, role, level..."
              autoFocus
              className="w-full pl-10 pr-4 py-3 text-sm bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <PostCardSkeleton key={i} />)}
          </div>
        )}

        {!loading && results && (
          <div className="space-y-6">
            {results.salary && (
              <div>
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Salary Matches
                </h2>
                <div className="whisper-card p-4 mb-3">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2 font-display font-semibold text-base">
                        <DollarSign className="w-4 h-4 text-green-500" />
                        {results.salary.summary.count} salary reports
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Matched across company, role, location, skills, and experience level.
                      </p>
                    </div>
                    {results.salary.summary.avgBase && (
                      <div className="text-right shrink-0">
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Avg Base</div>
                        <div className="font-bold text-green-500">{formatSalary(results.salary.summary.avgBase)} LPA</div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {results.salary.summary.avgTotal && (
                      <div className="rounded-lg border border-border p-3">
                        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                          <TrendingUp className="w-3 h-3" /> Avg CTC
                        </div>
                        <div className="font-bold text-whisper-500">{formatSalary(results.salary.summary.avgTotal)} LPA</div>
                      </div>
                    )}
                    {results.salary.summary.locations.length > 0 && (
                      <div className="rounded-lg border border-border p-3">
                        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                          <MapPin className="w-3 h-3" /> Locations
                        </div>
                        <div className="text-xs font-medium line-clamp-2">{results.salary.summary.locations.join(", ")}</div>
                      </div>
                    )}
                  </div>

                  {results.salary.summary.levels.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                        <Layers className="w-3 h-3" /> Experience levels
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {results.salary.summary.levels.map((level) => (
                          <div key={level.level} className="rounded-lg bg-muted px-3 py-2">
                            <div className="text-xs font-semibold">{level.level}</div>
                            <div className="text-[11px] text-muted-foreground">
                              {level.count} reports
                              {level.avgBase ? ` - ${formatSalary(level.avgBase)} LPA base` : ""}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1.5">
                    {results.salary.summary.companies.map((company) => (
                      <Link key={company} href={`/company/${encodeURIComponent(company.toLowerCase().replace(/\s+/g, "-"))}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-muted px-2.5 py-1 text-xs font-medium hover:text-whisper-500 transition-colors">
                        <Briefcase className="w-3 h-3" /> {company}
                      </Link>
                    ))}
                    {results.salary.summary.roles.map((role) => (
                      <Link key={role} href={`/salary/${encodeURIComponent(role.toLowerCase().replace(/\s+/g, "-"))}`}
                        className="rounded-lg bg-muted px-2.5 py-1 text-xs font-medium hover:text-whisper-500 transition-colors">
                        {role}
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  {results.salary.posts.slice(0, 5).map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              </div>
            )}

            {results.bowls.length > 0 && (
              <div>
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Bowls
                </h2>
                <div className="space-y-2">
                  {results.bowls.map((bowl) => (
                    <Link key={bowl.id} href={`/bowl/${bowl.slug}`}
                      className="whisper-card-hover flex items-center gap-3 p-3 group">
                      <span className="text-xl">{bowl.icon}</span>
                      <div className="flex-1">
                        <div className="text-sm font-medium group-hover:text-whisper-500 transition-colors">{bowl.name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <Users className="w-3 h-3" />{formatCount(bowl.memberCount)} members
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {discussionPosts.length > 0 && (
              <div>
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Discussions ({discussionPosts.length})
                </h2>
                <div className="space-y-3">
                  {discussionPosts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              </div>
            )}

            {!results.salary && discussionPosts.length === 0 && results.bowls.length === 0 && (
              <div className="text-center py-12">
                <Search className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                <p className="font-semibold">No results for "{query}"</p>
                <p className="text-sm text-muted-foreground mt-1">Try company + city + role, for example "Google Bangalore senior"</p>
              </div>
            )}
          </div>
        )}

        {!loading && !results && query.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Search className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Search salary by company, location, role, or level</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
