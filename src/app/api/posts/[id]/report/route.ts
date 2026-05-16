// src/app/api/posts/[id]/report/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma/client";
import { z } from "zod";

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

  try {
    const body = await req.json();
    const { reason, detail } = reportSchema.parse(body);

    await prisma.post.update({
      where: { id: params.id },
      data: {
        isFlagged: true,
        flagReason: detail ? `${reason}: ${detail}` : reason,
      },
    });

    return NextResponse.json({ success: true, message: "Post reported. Our team will review it." });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid report" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to report" }, { status: 500 });
  }
}
