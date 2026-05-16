// src/app/api/ai/insights/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { generateSalaryInsightSummary, generateTrendingSummary } from "@/lib/ai/moderation";
import { PostType } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "trending";
    const role = searchParams.get("role");
    const company = searchParams.get("company");

    if (type === "salary") {
      const salaryPosts = await prisma.post.findMany({
        where: {
          type: PostType.SALARY,
          isDeleted: false,
          isFlagged: false,
          ...(role && { role: { contains: role, mode: "insensitive" } }),
          ...(company && { company: { contains: company, mode: "insensitive" } }),
        },
        select: {
          company: true,
          role: true,
          baseSalary: true,
          totalComp: true,
          experience: true,
          location: true,
          skills: true,
        },
        take: 50,
        orderBy: { createdAt: "desc" },
      });

      if (salaryPosts.length === 0) {
        return NextResponse.json({ data: { summary: "No salary data available yet.", stats: null } });
      }

      const salaries = salaryPosts.filter((p) => p.baseSalary);
      const avgBase = Math.round(
        salaries.reduce((acc, p) => acc + (p.baseSalary || 0), 0) / salaries.length
      );
      const avgTotal = Math.round(
        salaries.reduce((acc, p) => acc + (p.totalComp || p.baseSalary || 0), 0) / salaries.length
      );
      const minBase = Math.min(...salaries.map((p) => p.baseSalary || 0));
      const maxBase = Math.max(...salaries.map((p) => p.baseSalary || 0));

      // Count skill frequency
      const skillCount: Record<string, number> = {};
      salaryPosts.forEach((p) => p.skills.forEach((s) => { skillCount[s] = (skillCount[s] || 0) + 1; }));
      const topSkills = Object.entries(skillCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([s]) => s);

      const summary = await generateSalaryInsightSummary(salaryPosts);

      return NextResponse.json({
        data: {
          summary,
          stats: { avgBase, avgTotal, minBase, maxBase, count: salaries.length, topSkills },
        },
      });
    }

    // Trending summary
    const recentPosts = await prisma.post.findMany({
      where: {
        isDeleted: false,
        isFlagged: false,
        createdAt: { gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      select: { title: true, content: true, score: true },
      orderBy: { score: "desc" },
      take: 20,
    });

    const summary = await generateTrendingSummary(recentPosts);
    return NextResponse.json({ data: { summary } });
  } catch (err) {
    console.error("AI insights error:", err);
    return NextResponse.json({ error: "Failed to generate insights" }, { status: 500 });
  }
}
