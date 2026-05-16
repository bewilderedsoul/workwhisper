// src/app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma/client";
import { generateUsername } from "@/lib/auth/utils";
import { enforceRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const Schema = z.object({
  email: z.string().email("Enter a valid email").max(120),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password too long"),
});

async function generateUniqueUsername(): Promise<string> {
  let username = generateUsername();
  for (let i = 0; i < 10; i++) {
    const existing = await prisma.user.findUnique({ where: { username } });
    if (!existing) return username;
    username = generateUsername();
  }
  return `${generateUsername()}_${Date.now()}`;
}

export async function POST(req: NextRequest) {
  // 3 signups per IP per hour
  const rl = enforceRateLimit(req, { key: "signup", limit: 3, windowMs: 60 * 60 * 1000 });
  if (rl) return rl;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.errors[0];
    return NextResponse.json({ error: first?.message ?? "Invalid input" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.passwordHash) {
      return NextResponse.json(
        { error: "An account with this email already exists. Try signing in." },
        { status: 409 },
      );
    }
    // Existing OAuth/OTP user adding a password — allow and update.
    const passwordHash = await bcrypt.hash(parsed.data.password, 10);
    await prisma.user.update({ where: { id: existing.id }, data: { passwordHash } });
    return NextResponse.json({ ok: true, mergedExisting: true });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const username = await generateUniqueUsername();

  try {
    await prisma.user.create({
      data: { email, passwordHash, username },
    });
  } catch (e) {
    return NextResponse.json({ error: "Could not create account. Try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
