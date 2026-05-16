// src/app/api/salaries/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma/client";

export const dynamic = "force-dynamic";

function percentile(sorted: number[], p: number): number | null {
  if (sorted.length === 0) return null;
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  const frac = idx - lo;
  return Math.round(sorted[lo] * (1 - frac) + sorted[hi] * frac);
}

type Row = {
  baseSalary: number | null;
  totalComp: number | null;
  currency: string | null;
};

function buildStats(rows: Row[]) {
  const totals = rows
    .map((s) => s.totalComp || s.baseSalary || 0)
    .filter((n) => n > 0)
    .sort((a, b) => a - b);
  const bases = rows
    .map((s) => s.baseSalary || 0)
    .filter((n) => n > 0)
    .sort((a, b) => a - b);

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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || "";
  const companies = searchParams.getAll("company").flatMap((c) => c.split(",")).filter(Boolean);
  const levels = searchParams.getAll("level").flatMap((c) => c.split(",")).filter(Boolean);
  const locations = searchParams.getAll("location").flatMap((c) => c.split(",")).filter(Boolean);
  const countries = searchParams.getAll("country").flatMap((c) => c.split(",")).filter(Boolean);
  const currencies = searchParams.getAll("currency").flatMap((c) => c.split(",")).filter(Boolean);
  const roles = searchParams.getAll("role").flatMap((c) => c.split(",")).filter(Boolean);
  const expMin = Number(searchParams.get("expMin") || "");
  const expMax = Number(searchParams.get("expMax") || "");
  const sort = searchParams.get("sort") || "newest";
  const limit = Math.min(Number(searchParams.get("limit") || "50"), 200);
  const offset = Math.max(Number(searchParams.get("offset") || "0"), 0);

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
  if (roles.length) {
    and.push({ OR: roles.map((r) => ({ role: { contains: r, mode: "insensitive" as const } })) });
  }
  if (!Number.isNaN(expMin) && searchParams.get("expMin") !== null) {
    and.push({ experience: { gte: expMin } });
  }
  if (!Number.isNaN(expMax) && searchParams.get("expMax") !== null) {
    and.push({ experience: { lte: expMax } });
  }

  if (and.length) where.AND = and;

  const orderBy: Prisma.PostOrderByWithRelationInput =
    sort === "highest"
      ? { totalComp: "desc" }
      : sort === "lowest"
      ? { totalComp: "asc" }
      : sort === "mostExp"
      ? { experience: "desc" }
      : { createdAt: "desc" };

  const [posts, total, allMatching] = await Promise.all([
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
      orderBy,
      take: limit,
      skip: offset,
    }),
    prisma.post.count({ where }),
    prisma.post.findMany({
      where,
      select: { baseSalary: true, totalComp: true, level: true, location: true, country: true, currency: true, experience: true, company: true },
    }),
  ]);

  // Global stats only meaningful if all results share a currency.
  const allCurrencies = new Set(allMatching.map((s) => s.currency || "").filter(Boolean));
  const dominantCurrency = allCurrencies.size === 1 ? Array.from(allCurrencies)[0] : null;
  const stats = dominantCurrency
    ? { ...buildStats(allMatching), currency: dominantCurrency }
    : { ...buildStats(allMatching), currency: null }; // count still useful, monetary values mixed-units

  // Per-currency stats — always returned so the UI can pick the right scale.
  const byCurrency: Record<string, ReturnType<typeof buildStats> & { currency: string }> = {};
  for (const cur of Array.from(allCurrencies)) {
    const subset = allMatching.filter((s) => s.currency === cur);
    byCurrency[cur] = { ...buildStats(subset), currency: cur };
  }

  // Facets
  const byLevel = new Map<string, number>();
  const byLocation = new Map<string, number>();
  const byCompany = new Map<string, number>();
  const byCountry = new Map<string, number>();
  const byCurrencyCount = new Map<string, number>();

  for (const s of allMatching) {
    if (s.level) byLevel.set(s.level, (byLevel.get(s.level) || 0) + 1);
    if (s.location) byLocation.set(s.location, (byLocation.get(s.location) || 0) + 1);
    if (s.company) byCompany.set(s.company, (byCompany.get(s.company) || 0) + 1);
    if (s.country) byCountry.set(s.country, (byCountry.get(s.country) || 0) + 1);
    if (s.currency) byCurrencyCount.set(s.currency, (byCurrencyCount.get(s.currency) || 0) + 1);
  }

  return NextResponse.json({
    stats,
    byCurrency,
    posts,
    total,
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
  });
}
