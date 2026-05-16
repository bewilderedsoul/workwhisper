// src/app/(main)/salary/page.tsx
import type { Metadata } from "next";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma/client";
import { MainLayout } from "@/components/layout/MainLayout";
import { SalarySearch } from "@/components/salary/SalarySearch";

export const metadata: Metadata = {
  title: "Search Salaries Worldwide — WorkWhisper",
  description:
    "Search anonymous salary data by company, role, level, experience, country and location. Real compensation reports from tech professionals worldwide.",
};

export const dynamic = "force-dynamic";

function percentile(sorted: number[], p: number): number | null {
  if (sorted.length === 0) return null;
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return Math.round(sorted[lo] * (1 - (idx - lo)) + sorted[hi] * (idx - lo));
}

function asArray(v: string | string[] | undefined): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v.flatMap((x) => x.split(",")).filter(Boolean) : v.split(",").filter(Boolean);
}

type Row = { baseSalary: number | null; totalComp: number | null; currency: string | null };
function buildStats(rows: Row[]) {
  const totals = rows.map((s) => s.totalComp || s.baseSalary || 0).filter((n) => n > 0).sort((a, b) => a - b);
  const bases = rows.map((s) => s.baseSalary || 0).filter((n) => n > 0).sort((a, b) => a - b);
  return {
    count: rows.length,
    median: percentile(totals, 0.5),
    p25: percentile(totals, 0.25),
    p75: percentile(totals, 0.75),
    p90: percentile(totals, 0.9),
    min: totals[0] ?? null,
    max: totals[totals.length - 1] ?? null,
    avgBase: bases.length ? Math.round(bases.reduce((a, b) => a + b, 0) / bases.length) : null,
  };
}

async function getInitial(searchParams: Record<string, string | string[] | undefined>) {
  const q = (typeof searchParams.q === "string" ? searchParams.q : "")?.trim();
  const companies = asArray(searchParams.company);
  const levels = asArray(searchParams.level);
  const locations = asArray(searchParams.location);
  const countries = asArray(searchParams.country);
  const currencies = asArray(searchParams.currency);
  const expMin = searchParams.expMin ? Number(searchParams.expMin) : null;
  const expMax = searchParams.expMax ? Number(searchParams.expMax) : null;

  const where: Prisma.PostWhereInput = {
    type: "SALARY",
    isDeleted: false,
    isFlagged: false,
  };
  const and: Prisma.PostWhereInput[] = [];

  if (q) {
    and.push({
      OR: [
        { company: { contains: q, mode: "insensitive" } },
        { role: { contains: q, mode: "insensitive" } },
        { location: { contains: q, mode: "insensitive" } },
        { country: { contains: q, mode: "insensitive" } },
        { level: { contains: q, mode: "insensitive" } },
        { skills: { has: q } },
      ],
    });
  }
  if (companies.length) and.push({ company: { in: companies, mode: "insensitive" } });
  if (levels.length) and.push({ level: { in: levels } });
  if (locations.length) and.push({ location: { in: locations, mode: "insensitive" } });
  if (countries.length) and.push({ country: { in: countries, mode: "insensitive" } });
  if (currencies.length) and.push({ currency: { in: currencies.map((c) => c.toUpperCase()) } });
  if (expMin != null && !Number.isNaN(expMin)) and.push({ experience: { gte: expMin } });
  if (expMax != null && !Number.isNaN(expMax)) and.push({ experience: { lte: expMax } });
  if (and.length) where.AND = and;

  const [posts, all] = await Promise.all([
    prisma.post.findMany({
      where,
      select: {
        id: true,
        company: true,
        role: true,
        level: true,
        experience: true,
        baseSalary: true,
        totalComp: true,
        bonus: true,
        stock: true,
        location: true,
        country: true,
        currency: true,
        workArrangement: true,
        gender: true,
        skills: true,
        createdAt: true,
        title: true,
        content: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.post.findMany({
      where,
      select: { baseSalary: true, totalComp: true, level: true, location: true, country: true, currency: true, experience: true, company: true },
    }),
  ]);

  const allCurrencies = new Set(all.map((s) => s.currency || "").filter(Boolean));
  const dominantCurrency = allCurrencies.size === 1 ? Array.from(allCurrencies)[0] : null;

  const byCurrency: Record<string, ReturnType<typeof buildStats> & { currency: string }> = {};
  for (const cur of Array.from(allCurrencies)) {
    const subset = all.filter((s) => s.currency === cur);
    byCurrency[cur] = { ...buildStats(subset), currency: cur };
  }

  const byLevel = new Map<string, number>();
  const byLocation = new Map<string, number>();
  const byCompany = new Map<string, number>();
  const byCountry = new Map<string, number>();
  const byCurrencyCount = new Map<string, number>();
  for (const s of all) {
    if (s.level) byLevel.set(s.level, (byLevel.get(s.level) || 0) + 1);
    if (s.location) byLocation.set(s.location, (byLocation.get(s.location) || 0) + 1);
    if (s.company) byCompany.set(s.company, (byCompany.get(s.company) || 0) + 1);
    if (s.country) byCountry.set(s.country, (byCountry.get(s.country) || 0) + 1);
    if (s.currency) byCurrencyCount.set(s.currency, (byCurrencyCount.get(s.currency) || 0) + 1);
  }

  return {
    posts: posts.map((p) => ({ ...p, createdAt: p.createdAt.toISOString() })),
    total: all.length,
    stats: { ...buildStats(all), currency: dominantCurrency },
    byCurrency,
    facets: {
      levels: Array.from(byLevel.entries()).map(([level, count]) => ({ level, count })),
      locations: Array.from(byLocation.entries())
        .map(([location, count]) => ({ location, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 30),
      companies: Array.from(byCompany.entries())
        .map(([company, count]) => ({ company, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 40),
      countries: Array.from(byCountry.entries())
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 40),
      currencies: Array.from(byCurrencyCount.entries())
        .map(([currency, count]) => ({ currency, count }))
        .sort((a, b) => b.count - a.count),
    },
  };
}

export default async function SalaryPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const initial = await getInitial(searchParams);

  return (
    <MainLayout>
      <SalarySearch initialData={initial} />
    </MainLayout>
  );
}
