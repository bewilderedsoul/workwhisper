// src/app/api/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma/client";

export const dynamic = "force-dynamic";

const STOP_WORDS = new Set([
  "salary",
  "salaries",
  "pay",
  "ctc",
  "comp",
  "compensation",
  "package",
  "in",
  "at",
  "for",
  "of",
  "with",
  "years",
  "year",
  "yrs",
  "yr",
  "yoe",
  "lpa",
  "india",
]);

const LEVELS: Record<string, { label: string; min: number; max?: number }> = {
  fresher: { label: "Fresher", min: 0, max: 1 },
  intern: { label: "Intern", min: 0, max: 1 },
  entry: { label: "Entry level", min: 0, max: 2 },
  junior: { label: "Junior", min: 0, max: 2 },
  mid: { label: "Mid level", min: 3, max: 5 },
  senior: { label: "Senior", min: 6, max: 9 },
  lead: { label: "Lead", min: 8 },
  principal: { label: "Principal", min: 10 },
  staff: { label: "Staff", min: 8 },
  manager: { label: "Manager", min: 6 },
};

function isExperienceToken(q: string, token: string) {
  return /^\d+$/.test(token) && new RegExp(`\\b${token}\\s*(years?|yrs?|yr|yoe)\\b`, "i").test(q);
}

function tokenize(q: string) {
  return q
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/)
    .map((token) => token.trim())
    .filter((token) => (token.length > 1 || isExperienceToken(q, token)) && !STOP_WORDS.has(token));
}

function experienceWhere(level: { min: number; max?: number }): Prisma.IntNullableFilter {
  return {
    gte: level.min,
    ...(level.max != null ? { lte: level.max } : {}),
  };
}

function tokenWhere(token: string, q: string): Prisma.PostWhereInput {
  const level = LEVELS[token];
  const yearValue = Number(token);
  const isYearToken = isExperienceToken(q, token);

  return {
    OR: [
      { title: { contains: token, mode: "insensitive" } },
      { content: { contains: token, mode: "insensitive" } },
      { company: { contains: token, mode: "insensitive" } },
      { role: { contains: token, mode: "insensitive" } },
      { location: { contains: token, mode: "insensitive" } },
      { skills: { has: token } },
      ...(level ? [{ experience: experienceWhere(level) }] : []),
      ...(isYearToken && Number.isInteger(yearValue) && yearValue >= 0 && yearValue <= 50
        ? [{ experience: { equals: yearValue } }]
        : []),
    ],
  };
}

function getLevelLabel(experience: number | null) {
  if (experience == null) return "Unspecified";
  if (experience <= 1) return "Fresher";
  if (experience <= 2) return "Junior";
  if (experience <= 5) return "Mid level";
  if (experience <= 9) return "Senior";
  return "Lead+";
}

function average(values: number[]) {
  if (values.length === 0) return null;
  return Math.round(values.reduce((acc, value) => acc + value, 0) / values.length);
}

type SalarySummaryPost = {
  company: string | null;
  role: string | null;
  location: string | null;
  experience: number | null;
  baseSalary: number | null;
  totalComp: number | null;
};

function buildSalarySummary(posts: SalarySummaryPost[]) {
  const salaries = posts.filter((post) => post.baseSalary);
  const companies = Array.from(new Set(posts.map((post) => post.company).filter(Boolean))) as string[];
  const roles = Array.from(new Set(posts.map((post) => post.role).filter(Boolean))) as string[];
  const locations = Array.from(new Set(posts.map((post) => post.location).filter(Boolean))) as string[];
  const byLevel = new Map<string, SalarySummaryPost[]>();

  salaries.forEach((post) => {
    const label = getLevelLabel(post.experience);
    byLevel.set(label, [...(byLevel.get(label) || []), post]);
  });

  return {
    count: posts.length,
    avgBase: average(salaries.map((post) => post.baseSalary!)),
    avgTotal: average(salaries.map((post) => post.totalComp || post.baseSalary!)),
    companies: companies.slice(0, 8),
    roles: roles.slice(0, 8),
    locations: locations.slice(0, 8),
    levels: Array.from(byLevel.entries()).map(([level, levelPosts]) => ({
      level,
      count: levelPosts.length,
      avgBase: average(levelPosts.map((post) => post.baseSalary!)),
      avgTotal: average(levelPosts.map((post) => post.totalComp || post.baseSalary!)),
    })),
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const type = searchParams.get("type") || "all"; // all | posts | bowls | salary

  if (!q || q.length < 2) {
    return NextResponse.json({ data: { posts: [], bowls: [], salary: null } });
  }

  const tokens = tokenize(q);
  const searchablePostWhere: Prisma.PostWhereInput = {
    isDeleted: false,
    isFlagged: false,
    ...(tokens.length
      ? { AND: tokens.map((token) => tokenWhere(token, q)) }
      : {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { content: { contains: q, mode: "insensitive" } },
            { company: { contains: q, mode: "insensitive" } },
            { role: { contains: q, mode: "insensitive" } },
            { location: { contains: q, mode: "insensitive" } },
          ],
        }),
  };

  const [posts, salaryPosts, bowls] = await Promise.all([
    type !== "bowls" && type !== "salary"
      ? prisma.post.findMany({
          where: searchablePostWhere,
          include: {
            user: { select: { id: true, username: true } },
            bowl: { select: { id: true, name: true, slug: true, icon: true } },
            _count: { select: { comments: true, votes: true } },
          },
          orderBy: { score: "desc" },
          take: 10,
        })
      : [],
    type !== "bowls"
      ? prisma.post.findMany({
          where: {
            ...searchablePostWhere,
            type: "SALARY",
          },
          include: {
            user: { select: { id: true, username: true } },
            bowl: { select: { id: true, name: true, slug: true, icon: true } },
            _count: { select: { comments: true, votes: true } },
          },
          orderBy: [{ score: "desc" }, { createdAt: "desc" }],
          take: 25,
        })
      : [],
    type !== "posts" && type !== "salary"
      ? prisma.bowl.findMany({
          where: {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
            ],
          },
          include: { _count: { select: { posts: true, memberships: true } } },
          take: 5,
        })
      : [],
  ]);

  return NextResponse.json({
    data: {
      posts,
      bowls,
      salary: salaryPosts.length
        ? {
            summary: buildSalarySummary(salaryPosts),
            posts: salaryPosts,
          }
        : null,
    },
  });
}
