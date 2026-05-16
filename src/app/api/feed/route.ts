// src/app/api/feed/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma/client";
import { PostType } from "@prisma/client";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);

    const bowl = searchParams.get("bowl");
    const type = searchParams.get("type") as PostType | null;
    const sort = searchParams.get("sort") || "latest";
    const cursor = searchParams.get("cursor");

    const where = {
      isDeleted: false,
      isFlagged: false,
      ...(bowl && { bowl: { slug: bowl } }),
      ...(type && { type }),
    };

    let orderBy: object;
    if (sort === "trending") {
      orderBy = [{ score: "desc" }, { createdAt: "desc" }];
    } else if (sort === "top") {
      orderBy = { score: "desc" };
    } else {
      orderBy = { createdAt: "desc" };
    }

    const posts = await prisma.post.findMany({
      where,
      orderBy,
      take: PAGE_SIZE + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
      include: {
        user: { select: { id: true, username: true } },
        bowl: { select: { id: true, name: true, slug: true, icon: true } },
        _count: { select: { comments: true, votes: true } },
      },
    });

    // Attach user's vote if logged in
    let postsWithVotes = posts;
    if (session?.user?.id) {
      const postIds = posts.map((p) => p.id);
      const votes = await prisma.vote.findMany({
        where: { userId: session.user.id, postId: { in: postIds } },
      });
      const voteMap = new Map(votes.map((v) => [v.postId, v.value]));
      postsWithVotes = posts.map((p) => ({
        ...p,
        userVote: voteMap.get(p.id) ?? null,
      }));
    }

    const hasMore = postsWithVotes.length > PAGE_SIZE;
    const data = hasMore ? postsWithVotes.slice(0, PAGE_SIZE) : postsWithVotes;
    const nextCursor = hasMore ? data[data.length - 1]?.id : undefined;

    return NextResponse.json({ data, nextCursor, hasMore });
  } catch (err) {
    console.error("Feed error:", err);
    return NextResponse.json({ error: "Failed to load feed" }, { status: 500 });
  }
}
