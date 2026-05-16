// src/app/api/bowls/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma/client";

export const dynamic = "force-dynamic";
import { z } from "zod";
import { slugify } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("q");

    const bowls = await prisma.bowl.findMany({
      where: search ? { name: { contains: search, mode: "insensitive" } } : undefined,
      include: {
        _count: { select: { posts: true, memberships: true } },
      },
      orderBy: [{ isDefault: "desc" }, { memberCount: "desc" }],
      take: 50,
    });

    // Attach membership status
    let bowlsWithMembership = bowls.map((b) => ({ ...b, isMember: false }));
    if (session?.user?.id) {
      const memberships = await prisma.bowlMembership.findMany({
        where: { userId: session.user.id },
        select: { bowlId: true },
      });
      const memberSet = new Set(memberships.map((m) => m.bowlId));
      bowlsWithMembership = bowls.map((b) => ({
        ...b,
        isMember: memberSet.has(b.id),
      }));
    }

    return NextResponse.json({ data: bowlsWithMembership });
  } catch (err) {
    return NextResponse.json({ error: "Failed to load bowls" }, { status: 500 });
  }
}

const createBowlSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  icon: z.string().max(4).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const data = createBowlSchema.parse(body);
    const slug = slugify(data.name);

    const existing = await prisma.bowl.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: "A bowl with this name already exists" }, { status: 409 });
    }

    const bowl = await prisma.bowl.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        icon: data.icon || "🏢",
        memberships: {
          create: { userId: session.user.id },
        },
        memberCount: 1,
      },
    });

    return NextResponse.json({ success: true, data: bowl }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create bowl" }, { status: 500 });
  }
}
