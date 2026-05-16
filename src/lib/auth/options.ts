// src/lib/auth/options.ts
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
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

const googleEnabled = !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    // --- Google OAuth (enabled only when env vars present) ---
    ...(googleEnabled
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        ]
      : []),

    // --- Email + Password (for sign-in only; signup goes through /api/auth/signup) ---
    CredentialsProvider({
      id: "password",
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const email = credentials.email.toLowerCase().trim();

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash) return null;

        const ok = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!ok) return null;
        if (user.isBanned) return null;

        return {
          id: user.id,
          name: user.username,
          email: user.email || undefined,
        };
      },
    }),

    // --- OTP fallback (email magic code) ---
    CredentialsProvider({
      id: "otp",
      name: "Email OTP",
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
            where: isEmail ? { email: identifier } : { phone: identifier },
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
    // For Google sign-in: upsert the User row + generate an anonymous username on first login.
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google") return true;
      if (!user.email) return false;
      const email = user.email.toLowerCase();

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        if (existing.isBanned) return false;
        // Refresh image silently if Google provided one and we don't have one yet.
        if (!existing.image && (profile as any)?.picture) {
          await prisma.user.update({
            where: { id: existing.id },
            data: { image: (profile as any).picture as string },
          });
        }
        user.id = existing.id;
        user.name = existing.username;
        return true;
      }

      const username = await generateUniqueUsername();
      const created = await prisma.user.create({
        data: {
          email,
          username,
          image: (profile as any)?.picture ?? undefined,
        },
      });
      user.id = created.id;
      user.name = created.username;
      return true;
    },
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
