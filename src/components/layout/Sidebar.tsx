// src/components/layout/Sidebar.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { TrendingUp, Users, DollarSign, ExternalLink, Sparkles, ChevronRight } from "lucide-react";
import { formatCount, formatSalary } from "@/lib/utils";

interface Bowl {
  id: string; name: string; slug: string; icon: string; memberCount: number;
  _count: { posts: number };
}

interface SalaryInsight {
  summary: string;
  stats: { avgBase: number; avgTotal: number; count: number; topSkills: string[] } | null;
}

export function TrendingBowlsSidebar() {
  const [bowls, setBowls] = useState<Bowl[]>([]);

  useEffect(() => {
    fetch("/api/bowls")
      .then((r) => r.json())
      .then((d) => setBowls((d.data || []).slice(0, 6)));
  }, []);

  return (
    <div className="whisper-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4 text-whisper-500" />
        <h3 className="font-display font-semibold text-sm">Top Bowls</h3>
      </div>
      <div className="space-y-1">
        {bowls.length === 0
          ? Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 bg-muted rounded-lg shimmer" />
          ))
          : bowls.map((bowl) => (
            <Link key={bowl.id} href={`/bowl/${bowl.slug}`}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-muted transition-colors group">
              <span className="text-base">{bowl.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate group-hover:text-whisper-500 transition-colors">
                  {bowl.name}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {formatCount(bowl.memberCount)} members
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
            </Link>
          ))}
      </div>
      <Link href="/bowls"
        className="flex items-center justify-center gap-1.5 mt-3 text-xs text-whisper-500 hover:text-whisper-400 transition-colors font-medium">
        View all bowls <ChevronRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}

export function SalaryInsightsSidebar() {
  const [insight, setInsight] = useState<SalaryInsight | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/ai/insights?type=salary")
      .then((r) => r.json())
      .then((d) => setInsight(d.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="whisper-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <DollarSign className="w-4 h-4 text-green-500" />
        <h3 className="font-display font-semibold text-sm">Salary Insights</h3>
        <span className="ml-auto">
          <Sparkles className="w-3.5 h-3.5 text-whisper-500" />
        </span>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-3 bg-muted rounded shimmer" />)}
        </div>
      ) : insight ? (
        <div className="space-y-3">
          {insight.stats && (
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-lg bg-muted/50 text-center">
                <div className="text-xs text-muted-foreground">Avg Base</div>
                <div className="text-sm font-bold text-green-500">
                  {formatSalary(insight.stats.avgBase)} LPA
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-muted/50 text-center">
                <div className="text-xs text-muted-foreground">Avg Total</div>
                <div className="text-sm font-bold text-whisper-500">
                  {formatSalary(insight.stats.avgTotal)} LPA
                </div>
              </div>
            </div>
          )}
          <p className="text-xs text-muted-foreground leading-relaxed">{insight.summary}</p>
          {insight.stats?.topSkills && insight.stats.topSkills.length > 0 && (
            <div>
              <div className="text-[11px] text-muted-foreground mb-1.5 font-medium uppercase tracking-wider">
                Top Skills
              </div>
              <div className="flex flex-wrap gap-1">
                {insight.stats.topSkills.map((s) => (
                  <span key={s} className="px-2 py-0.5 bg-muted rounded text-xs">{s}</span>
                ))}
              </div>
            </div>
          )}
          <Link href="/salary"
            className="flex items-center gap-1.5 text-xs text-whisper-500 hover:text-whisper-400 transition-colors font-medium">
            View salary data <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">No salary data available yet.</p>
      )}
    </div>
  );
}

export function AdPlaceholder({ slot }: { slot: string }) {
  return (
    <div className="whisper-card p-4 border-dashed">
      <div className="text-center space-y-1">
        <div className="text-xs text-muted-foreground/40 uppercase tracking-widest font-medium">
          Advertisement
        </div>
        <div className="h-24 bg-muted/30 rounded-lg flex items-center justify-center">
          <span className="text-xs text-muted-foreground/30">Ad slot: {slot}</span>
        </div>
        <div className="text-[10px] text-muted-foreground/30">
          WorkWhisper is ad-supported to stay free
        </div>
      </div>
    </div>
  );
}

export function CommunityRulesSidebar() {
  const rules = [
    "Stay anonymous — no real names, IDs, or contacts",
    "Be honest but constructive",
    "Salary data must be your own",
    "No company bashing without substance",
    "Respect everyone's experience",
  ];

  return (
    <div className="whisper-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-4 h-4 text-saffron-500" />
        <h3 className="font-display font-semibold text-sm">Community Rules</h3>
      </div>
      <ol className="space-y-2">
        {rules.map((rule, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
            <span className="font-bold text-saffron-500 shrink-0 mt-0.5">{i + 1}.</span>
            {rule}
          </li>
        ))}
      </ol>
    </div>
  );
}

export function DefaultSidebar() {
  return (
    <>
      <TrendingBowlsSidebar />
      <SalaryInsightsSidebar />
      <AdPlaceholder slot="sidebar-1" />
      <CommunityRulesSidebar />
    </>
  );
}
