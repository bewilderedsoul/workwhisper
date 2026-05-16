// src/app/api/posts/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma/client";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    const post = await prisma.post.findUnique({
      where: { id: params.id, isDeleted: false },
      include: {
        user: { select: { id: true, username: true } },
        bowl: { select: { id: true, name: true, slug: true, icon: true } },
        _count: { select: { comments: true, votes: true } },
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Increment view count
    await prisma.post.update({
      where: { id: params.id },
      data: { viewCount: { increment: 1 } },
    });

    let userVote = null;
    if (session?.user?.id) {
      const vote = await prisma.vote.findUnique({
        where: { userId_postId: { userId: session.user.id, postId: params.id } },
      });
      userVote = vote?.value ?? null;
    }

    return NextResponse.json({ data: { ...post, userVote } });
  } catch (err) {
    console.error("Get post error:", err);
    return NextResponse.json({ error: "Failed to get post" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const post = await prisma.post.findUnique({ where: { id: params.id } });
    if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (post.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.post.update({
      where: { id: params.id },
      data: { isDeleted: true },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }
}
