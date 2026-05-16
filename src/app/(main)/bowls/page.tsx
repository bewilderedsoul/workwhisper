// src/app/(main)/bowls/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma/client";
import { MainLayout } from "@/components/layout/MainLayout";
import { formatCount } from "@/lib/utils";
import { Users, MessageSquare, ChevronRight, Plus } from "lucide-react";

export const metadata: Metadata = {
  title: "Bowls — Communities",
  description: "Browse all anonymous professional communities on WorkWhisper India.",
};

async function getBowls() {
  return prisma.bowl.findMany({
    include: { _count: { select: { posts: true, memberships: true } } },
    orderBy: [{ isDefault: "desc" }, { memberCount: "desc" }],
  });
}

export default async function BowlsPage() {
  const bowls = await getBowls();
  const defaultBowls = bowls.filter((b) => b.isDefault);
  const otherBowls = bowls.filter((b) => !b.isDefault);

  const BowlCard = ({ bowl }: { bowl: typeof bowls[0] }) => (
    <Link href={`/bowl/${bowl.slug}`}
      className="whisper-card-hover flex items-center gap-4 p-4 group">
      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-2xl shrink-0">
        {bowl.icon}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-display font-semibold text-sm group-hover:text-whisper-500 transition-colors truncate">
          {bowl.name}
        </h3>
        {bowl.description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{bowl.description}</p>
        )}
        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {formatCount(bowl.memberCount)} members
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />
            {formatCount(bowl._count.posts)} posts
          </span>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0" />
    </Link>
  );

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display font-bold text-2xl">Bowls</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {bowls.length} communities for Indian professionals
            </p>
          </div>
          <Link href="/bowls/new"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-whisper-500 hover:bg-whisper-600 text-white transition-colors">
            <Plus className="w-4 h-4" /> Create Bowl
          </Link>
        </div>

        {defaultBowls.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Featured Communities
            </h2>
            <div className="space-y-2">
              {defaultBowls.map((bowl) => <BowlCard key={bowl.id} bowl={bowl} />)}
            </div>
          </div>
        )}

        {otherBowls.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              All Communities
            </h2>
            <div className="space-y-2">
              {otherBowls.map((bowl) => <BowlCard key={bowl.id} bowl={bowl} />)}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
