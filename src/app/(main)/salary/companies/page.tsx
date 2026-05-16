// src/app/(main)/salary/companies/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma/client";
import { MainLayout } from "@/components/layout/MainLayout";
import { formatSalary } from "@/lib/utils";
import { Building2, ArrowRight, TrendingUp } from "lucide-react";

export const metadata: Metadata = {
  title: "Companies — Salary Data | WorkWhisper",
};

export const dynamic = "force-dynamic";

async function getCompanies() {
  return prisma.post.groupBy({
    by: ["company"],
    where: { type: "SALARY", isDeleted: false, isFlagged: false, company: { not: null } },
    _count: { company: true },
    _avg: { totalComp: true, baseSalary: true },
    _max: { totalComp: true },
    _min: { totalComp: true },
    orderBy: { _count: { company: "desc" } },
    take: 100,
  });
}

export default async function CompaniesPage() {
  const companies = await getCompanies();

  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="font-display font-bold text-3xl mb-1 flex items-center gap-2">
          <Building2 className="w-7 h-7 text-whisper-500" />
          Browse by Company
        </h1>
        <p className="text-sm text-muted-foreground">
          {companies.length} companies with anonymous salary data — tap to filter the fishbowl.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {companies.map((c) => {
          const avg = c._avg.totalComp ? Math.round(c._avg.totalComp) : null;
          const max = c._max.totalComp || null;
          return (
            <Link
              key={c.company}
              href={`/salary?company=${encodeURIComponent(c.company!)}`}
              className="whisper-card-hover p-4 flex items-center gap-3 group"
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-whisper-500/20 to-saffron-500/20 flex items-center justify-center text-whisper-500 font-bold text-sm shrink-0">
                {c.company!.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-display font-semibold text-sm group-hover:text-whisper-500 transition truncate">
                  {c.company}
                </div>
                <div className="text-xs text-muted-foreground">
                  {c._count.company} reports
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Avg</div>
                <div className="font-bold text-sm text-green-500">{avg ? formatSalary(avg) : "—"}</div>
                {max && (
                  <div className="text-[10px] text-muted-foreground flex items-center gap-0.5 justify-end">
                    <TrendingUp className="w-2.5 h-2.5" />
                    {formatSalary(max)}
                  </div>
                )}
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition" />
            </Link>
          );
        })}
      </div>
    </MainLayout>
  );
}
