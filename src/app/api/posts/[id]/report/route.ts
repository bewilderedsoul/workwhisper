// src/app/api/posts/[id]/report/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma/client";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const REPORT_THRESHOLD = 3;

const reportSchema = z.object({
  reason: z.enum(["spam", "harassment", "pii", "misinformation", "other"]),
  detail: z.string().max(500).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid report" }, { status: 400 });
  }
  const { reason, detail } = parsed.data;

  try {
    const post = await prisma.post.findUnique({ where: { id: params.id }, select: { id: true } });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Try to record this user's report. If they already reported, the unique index
    // throws P2002 — we treat that as success-but-no-op (don't double-count).
    try {
      await prisma.report.create({
        data: { postId: post.id, userId, reason, detail },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        return NextResponse.json({
          success: true,
          message: "You've already reported this post.",
        });
      }
      throw e;
    }

    // Count unique reports and flag only when we cross the threshold.
    const count = await prisma.report.count({ where: { postId: post.id } });
    if (count >= REPORT_THRESHOLD) {
      await prisma.post.update({
        where: { id: post.id },
        data: {
          reportCount: count,
          isFlagged: true,
          flagReason: detail ? `${reason}: ${detail}` : reason,
        },
      });
    } else {
      await prisma.post.update({
        where: { id: post.id },
        data: { reportCount: count },
      });
    }

    return NextResponse.json({
      success: true,
      message: count >= REPORT_THRESHOLD
        ? "Post hidden pending review."
        : `Report received (${count}/${REPORT_THRESHOLD}). Thanks for flagging.`,
    });
  } catch {
    return NextResponse.json({ error: "Failed to report" }, { status: 500 });
  }
}
