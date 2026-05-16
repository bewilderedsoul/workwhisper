// src/app/(main)/bowl/[slug]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BowlJoinButtonClient } from "@/components/bowl/BowlJoinButton";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma/client";
import { MainLayout } from "@/components/layout/MainLayout";
import { InfiniteScrollFeed } from "@/components/feed/InfiniteScrollFeed";
import { BowlHeader } from "@/components/bowl/BowlHeader";
import { SalaryInsightsSidebar, AdPlaceholder, CommunityRulesSidebar } from "@/components/layout/Sidebar";
import { formatCount } from "@/lib/utils";
import Link from "next/link";
import { PenSquare } from "lucide-react";

interface Props { params: { slug: string }; }

async function getBowl(slug: string, userId?: string) {
  const bowl = await prisma.bowl.findUnique({
    where: { slug },
    include: { _count: { select: { posts: true, memberships: true } } },
  });
  if (!bowl) return null;

  let isMember = false;
  if (userId) {
    const m = await prisma.bowlMembership.findUnique({
      where: { userId_bowlId: { userId, bowlId: bowl.id } },
    });
    isMember = !!m;
  }
  return { ...bowl, isMember };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const bowl = await prisma.bowl.findUnique({ where: { slug: params.slug } });
  if (!bowl) return { title: "Bowl not found" };

  return {
    title: `${bowl.name} — WorkWhisper`,
    description: bowl.description || `Anonymous discussions in ${bowl.name} on WorkWhisper India.`,
    openGraph: {
      title: `${bowl.name} | WorkWhisper`,
      description: bowl.description || "",
    },
  };
}

export default async function BowlPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  const bowl = await getBowl(params.slug, session?.user?.id);
  if (!bowl) notFound();

  const sidebar = (
    <>
      {/* Bowl info */}
      <div className="whisper-card p-4">
        <div className="text-3xl mb-2">{bowl.icon}</div>
        <h2 className="font-display font-semibold text-base mb-1">{bowl.name}</h2>
        {bowl.description && (
          <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{bowl.description}</p>
        )}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <div className="font-bold text-sm">{formatCount(bowl.memberCount)}</div>
            <div className="text-[11px] text-muted-foreground">Members</div>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <div className="font-bold text-sm">{formatCount(bowl._count.posts)}</div>
            <div className="text-[11px] text-muted-foreground">Posts</div>
          </div>
        </div>
        {session ? (
          <BowlJoinButton slug={params.slug} isMember={bowl.isMember} />
        ) : (
          <Link href="/login"
            className="block w-full text-center py-2 rounded-lg text-sm font-medium bg-whisper-500 hover:bg-whisper-600 text-white transition-colors">
            Join Bowl
          </Link>
        )}
      </div>

      <Link href={`/post/new?bowl=${bowl.id}`}
        className="whisper-card flex items-center justify-center gap-2 p-3 text-sm font-medium hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
        <PenSquare className="w-4 h-4" />
        Post to this bowl
      </Link>

      <SalaryInsightsSidebar />
      <AdPlaceholder slot={`bowl-${params.slug}`} />
      <CommunityRulesSidebar />
    </>
  );

  return (
    <MainLayout sidebar={sidebar}>
      <BowlHeader bowl={bowl} />
      <div className="mt-4">
        <InfiniteScrollFeed initialBowl={params.slug} />
      </div>
    </MainLayout>
  );
}

// Client component for join button (inline for simplicity)
function BowlJoinButton({ slug, isMember }: { slug: string; isMember: boolean }) {
  // This is a server component — we render a client wrapper
  return <BowlJoinButtonClient slug={slug} initialIsMember={isMember} />;
}


