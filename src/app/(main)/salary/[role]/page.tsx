// src/app/(main)/salary/[role]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma/client";
import { MainLayout } from "@/components/layout/MainLayout";
import { PostCard } from "@/components/feed/PostCard";
import { generateSalaryInsightSummary } from "@/lib/ai/moderation";
import { formatSalary, formatCount } from "@/lib/utils";
import { DollarSign, TrendingUp, MapPin, Briefcase, Sparkles } from "lucide-react";
import type { PostWithRelations } from "@/types";

interface Props { params: { role: string }; }

function slugToRole(slug: string): string {
  return decodeURIComponent(slug).replace(/-/g, " ");
}

async function getRoleData(slug: string) {
  const role = slugToRole(slug);

  const posts = await prisma.post.findMany({
    where: {
      type: "SALARY",
      role: { contains: role, mode: "insensitive" },
      isDeleted: false, isFlagged: false,
    },
    include: {
      user: { select: { id: true, username: true } },
      bowl: { select: { id: true, name: true, slug: true, icon: true } },
      _count: { select: { comments: true, votes: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  if (posts.length === 0) return null;

  const withSalary = posts.filter((p) => p.baseSalary);
  const avgBase = withSalary.length
    ? Math.round(withSalary.reduce((acc, p) => acc + (p.baseSalary || 0), 0) / withSalary.length)
    : null;
  const avgTotal = withSalary.length
    ? Math.round(withSalary.reduce((acc, p) => acc + (p.totalComp || p.baseSalary || 0), 0) / withSalary.length)
    : null;
  const minBase = withSalary.length ? Math.min(...withSalary.map((p) => p.baseSalary!)) : null;
  const maxBase = withSalary.length ? Math.max(...withSalary.map((p) => p.baseSalary!)) : null;
  const companies = Array.from(new Set(posts.map((p) => p.company).filter(Boolean)));
  const locations = Array.from(new Set(posts.map((p) => p.location).filter(Boolean)));
  const allSkills = posts.flatMap((p) => p.skills);
  const skillCount: Record<string, number> = {};
  allSkills.forEach((s) => { skillCount[s] = (skillCount[s] || 0) + 1; });
  const topSkills = Object.entries(skillCount).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([s]) => s);

  return { role, posts, withSalary, avgBase, avgTotal, minBase, maxBase, companies, locations, topSkills };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const role = slugToRole(params.role);
  return {
    title: `${role} Salary in India — WorkWhisper`,
    description: `Real anonymous ${role} salary data from Indian tech companies. See base salary, total CTC, and compensation breakdowns from verified professionals.`,
    openGraph: {
      title: `${role} Salary India | WorkWhisper`,
      description: `Anonymous ${role} salary data from Indian professionals.`,
    },
  };
}

export default async function SalaryRolePage({ params }: Props) {
  const data = await getRoleData(params.role);
  if (!data) notFound();

  const { role, posts, withSalary, avgBase, avgTotal, minBase, maxBase, companies, locations, topSkills } = data;

  let aiSummary = "";
  if (withSalary.length >= 3) {
    try { aiSummary = await generateSalaryInsightSummary(withSalary); } catch { }
  }

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="font-display font-bold text-2xl sm:text-3xl mb-1 capitalize">
            {role} Salary in India
          </h1>
          <p className="text-muted-foreground text-sm">
            {withSalary.length} anonymous salary reports from Indian professionals
          </p>
        </div>

        {/* Salary stats */}
        {avgBase && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: "Avg Base", value: `${formatSalary(avgBase)} LPA`, color: "text-green-500", icon: <DollarSign className="w-4 h-4 text-green-500" /> },
              { label: "Avg CTC", value: `${formatSalary(avgTotal!)} LPA`, color: "text-whisper-500", icon: <TrendingUp className="w-4 h-4 text-whisper-500" /> },
              { label: "Min Base", value: `${formatSalary(minBase!)} LPA`, color: "text-muted-foreground", icon: <TrendingUp className="w-4 h-4 text-muted-foreground" /> },
              { label: "Max Base", value: `${formatSalary(maxBase!)} LPA`, color: "text-saffron-500", icon: <TrendingUp className="w-4 h-4 text-saffron-500" /> },
            ].map(({ label, value, color, icon }) => (
              <div key={label} className="whisper-card p-4 text-center">
                <div className="flex justify-center mb-1">{icon}</div>
                <div className={`font-bold text-lg ${color}`}>{value}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Meta info */}
        <div className="whisper-card p-4 mb-6 space-y-3">
          {topSkills.length > 0 && (
            <div>
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Common Skills</div>
              <div className="flex flex-wrap gap-1.5">
                {topSkills.map((s) => <span key={s} className="px-2.5 py-1 bg-muted rounded-lg text-xs font-medium">{s}</span>)}
              </div>
            </div>
          )}
          {locations.length > 0 && (
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{locations.slice(0, 6).join(" · ")}</span>
            </div>
          )}
          {companies.length > 0 && (
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <Briefcase className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{companies.slice(0, 6).join(" · ")}</span>
            </div>
          )}
        </div>

        {/* AI summary */}
        {aiSummary && (
          <div className="whisper-card p-4 mb-6 border-whisper-500/20 bg-whisper-500/5">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-whisper-500" />
              <h2 className="font-display font-semibold text-sm">AI Compensation Analysis</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{aiSummary}</p>
          </div>
        )}

        {/* Posts */}
        <h2 className="font-display font-semibold text-lg mb-3">All Reports ({posts.length})</h2>
        <div className="space-y-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post as PostWithRelations} />
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
