// src/lib/auth/options.ts
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma/client";
import { hashToken, generateUsername } from "./utils";

async function generateUniqueUsername(): Promise<string> {
  let username = generateUsername();
  let attempts = 0;
  while (attempts < 10) {
    const existing = await prisma.user.findUnique({ where: { username } });
    if (!existing) return username;
    username = generateUsername();
    attempts++;
  }
  return `${generateUsername()}_${Date.now()}`;
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "OTP",
      credentials: {
        identifier: { label: "Email", type: "email" },
        otp: { label: "OTP", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.otp) return null;

        const hashedToken = hashToken(credentials.otp);

        const otpRecord = await prisma.otpToken.findFirst({
          where: {
            identifier: credentials.identifier.toLowerCase(),
            token: hashedToken,
            used: false,
            expiresAt: { gt: new Date() },
          },
          include: { user: true },
        });

        if (!otpRecord) return null;

        // Mark OTP as used
        await prisma.otpToken.update({
          where: { id: otpRecord.id },
          data: { used: true },
        });

        let user = otpRecord.user;

        if (!user) {
          const identifier = credentials.identifier.toLowerCase();
          const isEmail = identifier.includes("@");
          const username = await generateUniqueUsername();

          user = await prisma.user.upsert({
            where: isEmail
              ? { email: identifier }
              : { phone: identifier },
            update: {},
            create: {
              email: isEmail ? identifier : undefined,
              phone: !isEmail ? identifier : undefined,
              username,
            },
          });
        }

        if (user.isBanned) return null;

        return {
          id: user.id,
          name: user.username,
          email: user.email || undefined,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.username = user.name as string;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.userId as string;
        session.user.username = token.username as string;
        session.user.name = token.username as string;
      }
      return session;
    },
  },
};
