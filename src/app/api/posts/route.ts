// src/app/api/posts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma/client";
import { moderateContent } from "@/lib/ai/moderation";
import { pusherServer, PUSHER_EVENTS, PUSHER_CHANNELS } from "@/lib/realtime/pusher";
import { z } from "zod";
import { PostType } from "@prisma/client";

const createPostSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  content: z.string().min(10).max(5000),
  type: z.enum(["NORMAL", "SALARY", "QUESTION", "REVIEW"]).default("NORMAL"),
  bowlId: z.string(),
  // Salary fields
  company: z.string().max(100).optional(),
  role: z.string().max(100).optional(),
  experience: z.number().int().min(0).max(40).optional(),
  baseSalary: z.number().int().min(1).max(10000).optional(),
  totalComp: z.number().int().min(1).max(10000).optional(),
  location: z.string().max(100).optional(),
  skills: z.array(z.string()).max(10).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const data = createPostSchema.parse(body);

    // Moderate content
    const modResult = await moderateContent(
      `${data.title || ""} ${data.content}`
    );
    if (modResult.flagged) {
      return NextResponse.json(
        { error: `Content not allowed: ${modResult.reason}` },
        { status: 400 }
      );
    }

    // Verify bowl exists
    const bowl = await prisma.bowl.findUnique({ where: { id: data.bowlId } });
    if (!bowl) {
      return NextResponse.json({ error: "Bowl not found" }, { status: 404 });
    }

    const post = await prisma.post.create({
      data: {
        title: data.title,
        content: data.content,
        type: data.type as PostType,
        userId: session.user.id,
        bowlId: data.bowlId,
        company: data.company,
        role: data.role,
        experience: data.experience,
        baseSalary: data.baseSalary,
        totalComp: data.totalComp,
        location: data.location,
        skills: data.skills || [],
      },
      include: {
        user: { select: { id: true, username: true } },
        bowl: { select: { id: true, name: true, slug: true, icon: true } },
        _count: { select: { comments: true, votes: true } },
      },
    });

    // Broadcast to Pusher
    try {
      await pusherServer.trigger(
        PUSHER_CHANNELS.FEED,
        PUSHER_EVENTS.NEW_POST,
        post
      );
      await pusherServer.trigger(
        PUSHER_CHANNELS.bowl(bowl.slug),
        PUSHER_EVENTS.NEW_POST,
        post
      );
    } catch (e) {
      console.error("Pusher error:", e);
    }

    return NextResponse.json({ success: true, data: post }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    console.error("Create post error:", err);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
