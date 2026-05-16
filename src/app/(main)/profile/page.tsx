// src/app/(main)/profile/page.tsx
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma/client";
import { MainLayout } from "@/components/layout/MainLayout";
import { Avatar } from "@/components/ui/Avatar";
import { PostCard } from "@/components/feed/PostCard";
import { formatCount } from "@/lib/utils";
import { Shield, Star, MessageSquare, TrendingUp, Calendar } from "lucide-react";
import { format } from "date-fns";
import type { PostWithRelations } from "@/types";

export const metadata: Metadata = { title: "My Profile" };

async function getProfileData(userId: string) {
  const [user, posts, commentCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, karma: true, createdAt: true },
    }),
    prisma.post.findMany({
      where: { userId, isDeleted: false },
      include: {
        user: { select: { id: true, username: true } },
        bowl: { select: { id: true, name: true, slug: true, icon: true } },
        _count: { select: { comments: true, votes: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.comment.count({ where: { userId, isDeleted: false } }),
  ]);
  return { user, posts, commentCount };
}

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login?callbackUrl=/profile");

  const { user, posts, commentCount } = await getProfileData(session.user.id);
  if (!user) redirect("/login");

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto">
        {/* Profile header */}
        <div className="whisper-card p-6 mb-6">
          <div className="flex items-start gap-4">
            <Avatar username={user.username} size="lg" />
            <div className="flex-1">
              <h1 className="font-display font-bold text-xl">{user.username}</h1>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                <Shield className="w-3.5 h-3.5 text-green-500" />
                Anonymous member
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                <Calendar className="w-3.5 h-3.5" />
                Joined {format(new Date(user.createdAt), "MMMM yyyy")}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-5">
            {[
              { icon: <Star className="w-4 h-4 text-saffron-500" />, value: formatCount(user.karma), label: "Karma" },
              { icon: <TrendingUp className="w-4 h-4 text-whisper-500" />, value: formatCount(posts.length), label: "Posts" },
              { icon: <MessageSquare className="w-4 h-4 text-blue-500" />, value: formatCount(commentCount), label: "Comments" },
            ].map(({ icon, value, label }) => (
              <div key={label} className="text-center p-3 bg-muted/50 rounded-xl">
                <div className="flex justify-center mb-1">{icon}</div>
                <div className="font-bold text-lg">{value}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 rounded-lg bg-muted/40 text-xs text-muted-foreground flex items-start gap-2">
            <Shield className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
            Your real identity is never stored or associated with your posts. Your username is randomly assigned.
          </div>
        </div>

        {/* Posts */}
        <div>
          <h2 className="font-display font-semibold text-lg mb-3">Your Posts</h2>
          {posts.length === 0 ? (
            <div className="whisper-card p-8 text-center text-muted-foreground">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">You haven't posted yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <PostCard key={post.id} post={post as PostWithRelations} />
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
