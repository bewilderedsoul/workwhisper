// src/app/(main)/company/[slug]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma/client";
import { MainLayout } from "@/components/layout/MainLayout";
import { PostCard } from "@/components/feed/PostCard";
import { generateSalaryInsightSummary } from "@/lib/ai/moderation";
import { formatSalary, formatCount } from "@/lib/utils";
import { BarChart2, Users, MapPin, TrendingUp, Sparkles } from "lucide-react";
import type { PostWithRelations } from "@/types";

interface Props { params: { slug: string }; }

function slugToCompany(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

async function getCompanyData(slug: string) {
  const company = slugToCompany(slug);

  const posts = await prisma.post.findMany({
    where: {
      company: { equals: company, mode: "insensitive" },
      isDeleted: false, isFlagged: false,
    },
    include: {
      user: { select: { id: true, username: true } },
      bowl: { select: { id: true, name: true, slug: true, icon: true } },
      _count: { select: { comments: true, votes: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  if (posts.length === 0) return null;

  const salaryPosts = posts.filter((p) => p.type === "SALARY" && p.baseSalary);
  const avgBase = salaryPosts.length
    ? Math.round(salaryPosts.reduce((acc, p) => acc + (p.baseSalary || 0), 0) / salaryPosts.length)
    : null;
  const avgTotal = salaryPosts.length
    ? Math.round(salaryPosts.reduce((acc, p) => acc + (p.totalComp || p.baseSalary || 0), 0) / salaryPosts.length)
    : null;
  const locations = Array.from(new Set(salaryPosts.map((p) => p.location).filter(Boolean)));
  const roles = Array.from(new Set(salaryPosts.map((p) => p.role).filter(Boolean)));

  return { company, posts, salaryPosts, avgBase, avgTotal, locations, roles };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const company = slugToCompany(params.slug);
  return {
    title: `${company} Salaries & Reviews India — WorkWhisper`,
    description: `Anonymous salary data, employee reviews, and workplace discussions for ${company} India. See real compensation from current and former employees.`,
    openGraph: {
      title: `${company} Salaries & Reviews | WorkWhisper India`,
      description: `Real anonymous salary data for ${company} employees in India.`,
    },
  };
}

export default async function CompanyPage({ params }: Props) {
  const data = await getCompanyData(params.slug);
  if (!data) notFound();

  const { company, posts, salaryPosts, avgBase, avgTotal, locations, roles } = data;

  let aiSummary = "";
  if (salaryPosts.length >= 3) {
    try {
      aiSummary = await generateSalaryInsightSummary(salaryPosts);
    } catch { }
  }

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center text-2xl font-bold shrink-0">
              {company.charAt(0)}
            </div>
            <div>
              <h1 className="font-display font-bold text-2xl sm:text-3xl">{company}</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Anonymous employee insights from WorkWhisper India
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: <BarChart2 className="w-4 h-4 text-whisper-500" />, value: formatCount(salaryPosts.length), label: "Salary reports" },
              { icon: <Users className="w-4 h-4 text-blue-500" />, value: formatCount(posts.length), label: "Total posts" },
              avgBase && { icon: <TrendingUp className="w-4 h-4 text-green-500" />, value: `${formatSalary(avgBase)} LPA`, label: "Avg base" },
              avgTotal && { icon: <TrendingUp className="w-4 h-4 text-saffron-500" />, value: `${formatSalary(avgTotal)} LPA`, label: "Avg CTC" },
            ].filter(Boolean).map((stat: any) => (
              <div key={stat.label} className="whisper-card p-3 text-center">
                <div className="flex justify-center mb-1">{stat.icon}</div>
                <div className="font-bold text-base">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Insights */}
        {aiSummary && (
          <div className="whisper-card p-4 mb-6 border-whisper-500/20 bg-whisper-500/5">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-whisper-500" />
              <h2 className="font-display font-semibold text-sm">AI Salary Insights</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{aiSummary}</p>
          </div>
        )}

        {/* Salary breakdown */}
        {salaryPosts.length > 0 && (
          <div className="mb-6">
            <h2 className="font-display font-semibold text-lg mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              Salary Reports ({salaryPosts.length})
            </h2>

            {roles.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {roles.slice(0, 8).map((role) => (
                  <Link
                    key={role}
                    href={`/salary/${encodeURIComponent(role!.toLowerCase().replace(/\s+/g, "-"))}`}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-muted hover:bg-muted/80 transition-colors"
                  >
                    {role}
                  </Link>
                ))}
              </div>
            )}

            {locations.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground mb-4">
                <MapPin className="w-3.5 h-3.5" />
                {locations.slice(0, 5).join(" · ")}
              </div>
            )}

            <div className="space-y-3">
              {salaryPosts.slice(0, 10).map((post) => (
                <PostCard key={post.id} post={post as PostWithRelations} />
              ))}
            </div>
          </div>
        )}

        {/* All discussions */}
        {posts.filter((p) => p.type !== "SALARY").length > 0 && (
          <div>
            <h2 className="font-display font-semibold text-lg mb-3">
              Discussions ({posts.filter((p) => p.type !== "SALARY").length})
            </h2>
            <div className="space-y-3">
              {posts
                .filter((p) => p.type !== "SALARY")
                .slice(0, 10)
                .map((post) => (
                  <PostCard key={post.id} post={post as PostWithRelations} />
                ))}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
