// src/app/api/bowls/[slug]/join/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma/client";

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bowl = await prisma.bowl.findUnique({ where: { slug: params.slug } });
  if (!bowl) return NextResponse.json({ error: "Bowl not found" }, { status: 404 });

  const existing = await prisma.bowlMembership.findUnique({
    where: { userId_bowlId: { userId: session.user.id, bowlId: bowl.id } },
  });

  if (existing) {
    // Leave bowl
    await prisma.bowlMembership.delete({
      where: { userId_bowlId: { userId: session.user.id, bowlId: bowl.id } },
    });
    await prisma.bowl.update({
      where: { id: bowl.id },
      data: { memberCount: { decrement: 1 } },
    });
    return NextResponse.json({ success: true, isMember: false });
  } else {
    // Join bowl
    await prisma.bowlMembership.create({
      data: { userId: session.user.id, bowlId: bowl.id },
    });
    await prisma.bowl.update({
      where: { id: bowl.id },
      data: { memberCount: { increment: 1 } },
    });
    return NextResponse.json({ success: true, isMember: true });
  }
}
