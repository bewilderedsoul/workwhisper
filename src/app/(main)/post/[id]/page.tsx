// src/app/(main)/post/[id]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma/client";
import { MainLayout } from "@/components/layout/MainLayout";
import { PostDetailClient } from "@/components/post/PostDetailClient";
import { CommentSection } from "@/components/post/CommentSection";
import { DefaultSidebar } from "@/components/layout/Sidebar";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { truncate } from "@/lib/utils";

interface Props { params: { id: string }; }

async function getPost(id: string, userId?: string) {
  const post = await prisma.post.findUnique({
    where: { id, isDeleted: false },
    include: {
      user: { select: { id: true, username: true } },
      bowl: { select: { id: true, name: true, slug: true, icon: true } },
      _count: { select: { comments: true, votes: true } },
    },
  });
  if (!post) return null;

  let userVote = null;
  if (userId) {
    const vote = await prisma.vote.findUnique({
      where: { userId_postId: { userId, postId: id } },
    });
    userVote = vote?.value ?? null;
  }

  // Increment view count
  await prisma.post.update({ where: { id }, data: { viewCount: { increment: 1 } } });

  return { ...post, userVote };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await prisma.post.findUnique({
    where: { id: params.id, isDeleted: false },
    select: { title: true, content: true, type: true, company: true, role: true },
  });
  if (!post) return { title: "Post not found" };

  const title = post.title || (post.type === "SALARY" && post.company
    ? `${post.role || "Salary"} at ${post.company}`
    : truncate(post.content, 60));

  return {
    title: `${title} — WorkWhisper`,
    description: truncate(post.content, 155),
    openGraph: { title, description: truncate(post.content, 155) },
  };
}

export default async function PostPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  const post = await getPost(params.id, session?.user?.id);
  if (!post) notFound();

  return (
    <MainLayout sidebar={<DefaultSidebar />}>
      <div className="max-w-2xl">
        <Link
          href={`/bowl/${post.bowl.slug}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to {post.bowl.icon} {post.bowl.name}
        </Link>

        <PostDetailClient post={post} currentUserId={session?.user?.id} />

        <div className="mt-6">
          <CommentSection postId={post.id} />
        </div>
      </div>
    </MainLayout>
  );
}
