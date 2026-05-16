// src/app/api/posts/[id]/vote/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma/client";
import { pusherServer, PUSHER_EVENTS, PUSHER_CHANNELS } from "@/lib/realtime/pusher";
import { z } from "zod";

const voteSchema = z.object({
  value: z.union([z.literal(1), z.literal(-1), z.literal(0)]),
});

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
    const { value } = voteSchema.parse(body);

    const post = await prisma.post.findUnique({ where: { id: params.id } });
    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    const existingVote = await prisma.vote.findUnique({
      where: { userId_postId: { userId: session.user.id, postId: params.id } },
    });

    let scoreDelta = 0;

    if (value === 0) {
      // Remove vote
      if (existingVote) {
        await prisma.vote.delete({
          where: { userId_postId: { userId: session.user.id, postId: params.id } },
        });
        scoreDelta = -existingVote.value;
      }
    } else if (existingVote) {
      // Change vote
      scoreDelta = value - existingVote.value;
      await prisma.vote.update({
        where: { userId_postId: { userId: session.user.id, postId: params.id } },
        data: { value },
      });
    } else {
      // New vote
      scoreDelta = value;
      await prisma.vote.create({
        data: { userId: session.user.id, postId: params.id, value },
      });
    }

    const updatedPost = await prisma.post.update({
      where: { id: params.id },
      data: { score: { increment: scoreDelta } },
      select: { id: true, score: true },
    });

    // Update author karma
    if (scoreDelta !== 0) {
      await prisma.user.update({
        where: { id: post.userId },
        data: { karma: { increment: scoreDelta } },
      });
    }

    // Broadcast vote update
    try {
      await pusherServer.trigger(
        PUSHER_CHANNELS.post(params.id),
        PUSHER_EVENTS.VOTE_UPDATE,
        { postId: params.id, score: updatedPost.score, userVote: value === 0 ? null : value }
      );
    } catch (e) {
      console.error("Pusher error:", e);
    }

    return NextResponse.json({
      success: true,
      data: { score: updatedPost.score, userVote: value === 0 ? null : value },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid vote value" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to vote" }, { status: 500 });
  }
}
