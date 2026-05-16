// src/hooks/useFeed.ts
import { useState, useCallback } from "react";
import type { PostWithRelations, FeedSort } from "@/types";
import { PostType } from "@prisma/client";

const PAGE_SIZE = 20;

interface UseFeedOptions {
  bowl?: string;
  type?: PostType;
  sort?: FeedSort;
}

export function useFeed({ bowl, type, sort = "latest" }: UseFeedOptions = {}) {
  const [posts, setPosts] = useState<PostWithRelations[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buildUrl = useCallback(
    (currentCursor?: string) => {
      const params = new URLSearchParams();
      if (bowl) params.set("bowl", bowl);
      if (type) params.set("type", type);
      params.set("sort", sort);
      if (currentCursor) params.set("cursor", currentCursor);
      return `/api/feed?${params}`;
    },
    [bowl, type, sort]
  );

  const load = useCallback(
    async (reset = false) => {
      if (reset) {
        setLoading(true);
        setCursor(undefined);
      } else {
        if (!hasMore || loadingMore) return;
        setLoadingMore(true);
      }
      setError(null);

      try {
        const url = buildUrl(reset ? undefined : cursor);
        const res = await fetch(url);
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Failed to load");

        if (reset) {
          setPosts(data.data);
        } else {
          setPosts((prev) => [...prev, ...data.data]);
        }
        setCursor(data.nextCursor);
        setHasMore(data.hasMore);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [buildUrl, cursor, hasMore, loadingMore]
  );

  const refresh = () => load(true);
  const loadMore = () => load(false);

  const updatePostVote = (postId: string, newScore: number, newVote: number | null) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, score: newScore, userVote: newVote } : p))
    );
  };

  const prependPost = (post: PostWithRelations) => {
    setPosts((prev) => [post, ...prev]);
  };

  return {
    posts,
    loading,
    loadingMore,
    hasMore,
    error,
    refresh,
    loadMore,
    updatePostVote,
    prependPost,
  };
}
