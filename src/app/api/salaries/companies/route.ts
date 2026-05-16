// src/app/api/salaries/companies/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || "";

  const grouped = await prisma.post.groupBy({
    by: ["company"],
    where: {
      type: "SALARY",
      isDeleted: false,
      isFlagged: false,
      company: q
        ? { contains: q, mode: "insensitive" }
        : { not: null },
    },
    _count: { company: true },
    _avg: { totalComp: true, baseSalary: true },
    _max: { totalComp: true },
    _min: { totalComp: true },
    orderBy: { _count: { company: "desc" } },
    take: q ? 10 : 100,
  });

  return NextResponse.json({
    companies: grouped.map((g) => ({
      company: g.company,
      count: g._count.company,
      avgTotal: g._avg.totalComp ? Math.round(g._avg.totalComp) : null,
      avgBase: g._avg.baseSalary ? Math.round(g._avg.baseSalary) : null,
      max: g._max.totalComp,
      min: g._min.totalComp,
    })),
  });
}
