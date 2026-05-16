// src/app/(main)/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma/client";
import { MainLayout } from "@/components/layout/MainLayout";
import { HomeSalarySearch } from "@/components/salary/HomeSalarySearch";
import {
  ArrowRight, TrendingUp, DollarSign, Shield, Users,
  Building2, MapPin, Briefcase,
} from "lucide-react";
import { formatCount, formatSalary } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getStats() {
  const [salaryCount, companies, posts, users, topCompanies, recentSalaries] = await Promise.all([
    prisma.post.count({ where: { type: "SALARY", isDeleted: false } }),
    prisma.post.findMany({
      where: { type: "SALARY", isDeleted: false, company: { not: null } },
      distinct: ["company"],
      select: { company: true },
    }),
    prisma.post.count({ where: { isDeleted: false } }),
    prisma.user.count(),
    prisma.post.groupBy({
      by: ["company"],
      where: { type: "SALARY", isDeleted: false, company: { not: null } },
      _count: { company: true },
      _avg: { totalComp: true },
      orderBy: { _count: { company: "desc" } },
      take: 8,
    }),
    prisma.post.findMany({
      where: { type: "SALARY", isDeleted: false },
      select: {
        id: true,
        company: true,
        role: true,
        level: true,
        location: true,
        experience: true,
        baseSalary: true,
        totalComp: true,
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);

  return { salaryCount, companyCount: companies.length, posts, users, topCompanies, recentSalaries };
}

export default async function HomePage() {
  const stats = await getStats();

  return (
    <MainLayout>
      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-whisper-500/10 via-background to-saffron-500/10 p-6 sm:p-10 mb-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-whisper-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-saffron-500/10 rounded-full blur-3xl pointer-events-none translate-y-1/2 -translate-x-1/2" />

        <div className="relative max-w-3xl">
          <h1 className="font-display font-bold text-3xl sm:text-5xl mb-3 text-balance leading-tight">
            Know what every<br />
            <span className="gradient-text">role really pays.</span>
          </h1>
          <p className="text-muted-foreground text-sm sm:text-lg mb-6 max-w-2xl">
            Search anonymous salary reports from{" "}
            <strong className="text-foreground">{stats.companyCount}+ companies</strong>, across every level,
            location, and experience band. Submit yours in 30 seconds — fully anonymous.
          </p>

          <HomeSalarySearch />

          <div className="flex flex-wrap items-center gap-3 mt-6">
            {[
              { icon: <Shield className="w-3.5 h-3.5" />, label: "100% Anonymous" },
              { icon: <Building2 className="w-3.5 h-3.5" />, label: `${stats.companyCount}+ companies` },
              { icon: <DollarSign className="w-3.5 h-3.5" />, label: `${formatCount(stats.salaryCount)} reports` },
            ].map(({ icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-background/60 backdrop-blur-sm px-3 py-1.5 rounded-full border border-border"
              >
                {icon} {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TOP COMPANIES */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-xl flex items-center gap-2">
            <Building2 className="w-5 h-5 text-whisper-500" />
            Top companies by reports
          </h2>
          <Link
            href="/salary/companies"
            className="text-xs text-whisper-500 hover:text-whisper-600 flex items-center gap-1"
          >
            See all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.topCompanies.map((c) => (
            <Link
              key={c.company}
              href={`/salary?company=${encodeURIComponent(c.company!)}`}
              className="whisper-card-hover p-4 group"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-whisper-500/20 to-saffron-500/20 flex items-center justify-center text-whisper-500 font-bold text-sm shrink-0">
                  {c.company!.charAt(0)}
                </div>
                <span className="text-[10px] text-muted-foreground">{c._count.company} reports</span>
              </div>
              <div className="font-display font-semibold text-sm group-hover:text-whisper-500 transition truncate mb-1">
                {c.company}
              </div>
              <div className="text-xs text-muted-foreground">
                Avg{" "}
                <span className="font-bold text-green-500">
                  {c._avg.totalComp ? formatSalary(Math.round(c._avg.totalComp)) : "—"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* RECENT REPORTS */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-xl flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-saffron-500" />
            Recent salary reports
          </h2>
          <Link
            href="/salary"
            className="text-xs text-whisper-500 hover:text-whisper-600 flex items-center gap-1"
          >
            Explore all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="space-y-2">
          {stats.recentSalaries.map((s) => {
            const total = s.totalComp || s.baseSalary || 0;
            return (
              <Link
                key={s.id}
                href={`/salary?company=${encodeURIComponent(s.company || "")}`}
                className="whisper-card-hover p-3 flex items-center gap-3 group"
              >
                <div className="w-8 h-8 rounded-md bg-gradient-to-br from-whisper-500/20 to-saffron-500/20 flex items-center justify-center text-whisper-500 font-bold text-xs shrink-0">
                  {(s.company || "?").charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-display font-semibold text-sm">{s.company}</span>
                    {s.level && (
                      <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-whisper-500/10 text-whisper-600 dark:text-whisper-400">
                        {s.level}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">{s.role}</div>
                  <div className="flex items-center gap-3 mt-0.5 text-[11px] text-muted-foreground">
                    {s.location && (
                      <span className="inline-flex items-center gap-0.5">
                        <MapPin className="w-2.5 h-2.5" /> {s.location}
                      </span>
                    )}
                    {s.experience != null && (
                      <span className="inline-flex items-center gap-0.5">
                        <Briefcase className="w-2.5 h-2.5" /> {s.experience}y
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-green-500 text-sm">{formatSalary(total)}</div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-2xl border border-border bg-gradient-to-r from-whisper-500/10 via-saffron-500/10 to-pink-500/10 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <div>
          <h3 className="font-display font-bold text-xl sm:text-2xl mb-1">Help others negotiate.</h3>
          <p className="text-sm text-muted-foreground">
            Drop your numbers in 30 seconds — 100% anonymous.
          </p>
        </div>
        <Link
          href="/salary/submit"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-whisper-500 hover:bg-whisper-600 text-white transition shrink-0"
        >
          Share your salary <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </MainLayout>
  );
}
