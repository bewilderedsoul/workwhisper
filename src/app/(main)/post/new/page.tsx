// src/app/(main)/post/new/page.tsx
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { redirect } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";
import { CreatePostForm } from "@/components/post/CreatePostForm";
import { CommunityRulesSidebar } from "@/components/layout/Sidebar";
import { Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "Create Post",
  description: "Share anonymously on WorkWhisper",
};

export default async function NewPostPage({
  searchParams,
}: {
  searchParams: { bowl?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login?callbackUrl=/post/new");

  const sidebar = (
    <>
      <div className="whisper-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-green-500" />
          <h3 className="font-display font-semibold text-sm">Posting Tips</h3>
        </div>
        <ul className="space-y-2 text-xs text-muted-foreground">
          {[
            "You are always anonymous — even admins can't see who you are",
            "Share salary data for YOUR own role only",
            "Salary in LPA (Lakh Per Annum) format",
            "Don't include phone numbers or Aadhar",
            "Constructive criticism only",
          ].map((tip) => (
            <li key={tip} className="flex items-start gap-2">
              <span className="text-whisper-500 shrink-0">·</span>
              {tip}
            </li>
          ))}
        </ul>
      </div>
      <CommunityRulesSidebar />
    </>
  );

  return (
    <MainLayout sidebar={sidebar}>
      <div className="max-w-2xl">
        <div className="mb-6">
          <h1 className="font-display font-bold text-2xl">Create a post</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Share anonymously as <span className="font-medium text-foreground">{session.user.username}</span>
          </p>
        </div>
        <div className="whisper-card p-5 sm:p-6">
          <CreatePostForm defaultBowlId={searchParams.bowl} />
        </div>
      </div>
    </MainLayout>
  );
}
