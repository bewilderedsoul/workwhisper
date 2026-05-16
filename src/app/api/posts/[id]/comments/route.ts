// src/app/api/posts/[id]/comments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma/client";

export const dynamic = "force-dynamic";
import { moderateContent } from "@/lib/ai/moderation";
import { pusherServer, PUSHER_EVENTS, PUSHER_CHANNELS } from "@/lib/realtime/pusher";
import { z } from "zod";

const commentSchema = z.object({
  content: z.string().min(1).max(2000),
  parentId: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const comments = await prisma.comment.findMany({
      where: {
        postId: params.id,
        parentId: null,
        isDeleted: false,
      },
      include: {
        user: { select: { id: true, username: true } },
        _count: { select: { replies: true } },
        replies: {
          where: { isDeleted: false },
          include: {
            user: { select: { id: true, username: true } },
            _count: { select: { replies: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: [{ score: "desc" }, { createdAt: "asc" }],
    });

    return NextResponse.json({ data: comments });
  } catch (err) {
    return NextResponse.json({ error: "Failed to load comments" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { content, parentId } = commentSchema.parse(body);

    const modResult = await moderateContent(content);
    if (modResult.flagged) {
      return NextResponse.json(
        { error: `Comment not allowed: ${modResult.reason}` },
        { status: 400 }
      );
    }

    const post = await prisma.post.findUnique({ where: { id: params.id } });
    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    const comment = await prisma.comment.create({
      data: {
        content,
        postId: params.id,
        userId: session.user.id,
        parentId: parentId || null,
      },
      include: {
        user: { select: { id: true, username: true } },
        _count: { select: { replies: true } },
      },
    });

    // Broadcast realtime
    try {
      await pusherServer.trigger(
        PUSHER_CHANNELS.post(params.id),
        PUSHER_EVENTS.NEW_COMMENT,
        comment
      );
    } catch (e) {
      console.error("Pusher error:", e);
    }

    return NextResponse.json({ success: true, data: comment }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to post comment" }, { status: 500 });
  }
}
