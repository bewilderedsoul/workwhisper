// src/app/api/bowls/[slug]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma/client";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    const bowl = await prisma.bowl.findUnique({
      where: { slug: params.slug },
      include: {
        _count: { select: { posts: true, memberships: true } },
      },
    });

    if (!bowl) return NextResponse.json({ error: "Bowl not found" }, { status: 404 });

    let isMember = false;
    if (session?.user?.id) {
      const membership = await prisma.bowlMembership.findUnique({
        where: { userId_bowlId: { userId: session.user.id, bowlId: bowl.id } },
      });
      isMember = !!membership;
    }

    return NextResponse.json({ data: { ...bowl, isMember } });
  } catch (err) {
    return NextResponse.json({ error: "Failed to get bowl" }, { status: 500 });
  }
}
