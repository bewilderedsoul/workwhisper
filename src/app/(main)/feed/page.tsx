// src/app/(main)/feed/page.tsx
import type { Metadata } from "next";
import { MainLayout } from "@/components/layout/MainLayout";
import { DefaultSidebar } from "@/components/layout/Sidebar";
import { InfiniteScrollFeed } from "@/components/feed/InfiniteScrollFeed";

export const metadata: Metadata = {
  title: "Feed",
  description: "Latest discussions, salary shares, and workplace stories from Indian professionals.",
};

export default function FeedPage() {
  return (
    <MainLayout sidebar={<DefaultSidebar />}>
      <div className="mb-4">
        <h1 className="font-display font-bold text-xl">Feed</h1>
      </div>
      <InfiniteScrollFeed />
    </MainLayout>
  );
}
