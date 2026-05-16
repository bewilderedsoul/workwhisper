// src/app/api/auth/otp/send/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { generateOTP, hashToken, sendOTPEmail } from "@/lib/auth/utils";
import { z } from "zod";

const schema = z.object({
  identifier: z.string().min(5),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier } = schema.parse(body);

    const normalizedIdentifier = identifier.toLowerCase().trim();

    // Rate limit: max 3 OTPs per identifier per hour
    const recentOTPs = await prisma.otpToken.count({
      where: {
        identifier: normalizedIdentifier,
        createdAt: { gt: new Date(Date.now() - 60 * 60 * 1000) },
      },
    });

    if (recentOTPs >= 3) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const otp = generateOTP();
    const hashedToken = hashToken(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.otpToken.create({
      data: {
        token: hashedToken,
        identifier: normalizedIdentifier,
        expiresAt,
      },
    });

    // Send via email (only email supported currently)
    if (normalizedIdentifier.includes("@")) {
      await sendOTPEmail(normalizedIdentifier, otp);
    } else {
      // SMS integration placeholder
      console.log(`SMS OTP for ${normalizedIdentifier}: ${otp}`);
    }

    return NextResponse.json({ success: true, message: "OTP sent successfully" });
  } catch (err) {
    console.error("OTP send error:", err);
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
