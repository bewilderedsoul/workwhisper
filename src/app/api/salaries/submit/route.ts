// src/app/api/salaries/submit/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma/client";

const Schema = z.object({
  company: z.string().min(1).max(80),
  role: z.string().min(1).max(80),
  level: z.string().min(1).max(40),
  experience: z.number().int().min(0).max(50),
  // Values are in "smart units" — INR in LPA, others in thousands. JPY in 10K-yen units.
  // Max 50,000 covers JPY (¥5B/yr ceiling) without rejecting plausible US/EU TCs.
  baseSalary: z.number().min(0).max(50000),
  bonus: z.number().min(0).max(50000).optional().default(0),
  stock: z.number().min(0).max(50000).optional().default(0),
  location: z.string().min(1).max(80),
  country: z.string().min(1).max(60).optional().default("India"),
  currency: z.enum(["INR", "USD", "EUR", "GBP", "SGD", "AUD", "CAD", "AED", "JPY", "BRL", "CHF", "SEK"]).optional().default("INR"),
  workArrangement: z.enum(["Remote", "Hybrid", "Onsite"]).optional(),
  gender: z.enum(["Male", "Female", "Other", "PreferNotToSay"]).optional(),
  skills: z.array(z.string()).max(15).optional().default([]),
  notes: z.string().max(2000).optional().default(""),
});

export async function POST(req: NextRequest) {
  // Require login — no anonymous dumps. The post itself stays anonymous
  // because we expose only the user's auto-generated username.
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Please sign in to submit a salary." }, { status: 401 });
  }

  // Per-user rate limit: 10 submissions per hour.
  const recent = await prisma.post.count({
    where: {
      userId,
      type: "SALARY",
      createdAt: { gt: new Date(Date.now() - 60 * 60 * 1000) },
    },
  });
  if (recent >= 10) {
    return NextResponse.json(
      { error: "Limit reached: 10 salary submissions per hour. Try again later." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;
  const totalComp = Math.round(data.baseSalary + data.bonus + data.stock);

  const bowl = await prisma.bowl.upsert({
    where: { slug: "salary-discussions" },
    update: {},
    create: {
      name: "Salary Discussions",
      slug: "salary-discussions",
      description: "Anonymous salary sharing",
      icon: "💰",
      isDefault: true,
    },
  });

  const post = await prisma.post.create({
    data: {
      title: `${data.role} at ${data.company} — ${data.location}`,
      content: data.notes || `${data.experience} YoE. Base ${data.baseSalary} + bonus ${data.bonus} + stock ${data.stock} = total ${totalComp} ${data.currency}.`,
      type: "SALARY",
      userId,
      bowlId: bowl.id,
      company: data.company,
      role: data.role,
      level: data.level,
      experience: data.experience,
      baseSalary: Math.round(data.baseSalary),
      bonus: Math.round(data.bonus),
      stock: Math.round(data.stock),
      totalComp,
      location: data.location,
      country: data.country,
      currency: data.currency,
      workArrangement: data.workArrangement,
      gender: data.gender,
      skills: data.skills,
    },
  });

  return NextResponse.json({ ok: true, id: post.id });
}
