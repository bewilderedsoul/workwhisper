// src/components/feed/InfiniteScrollFeed.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useInView } from "react-intersection-observer";
import { PostCard } from "./PostCard";
import { PostCardSkeleton } from "./PostCardSkeleton";
import { FeedFilters } from "./FeedFilters";
import { getPusherClient, PUSHER_EVENTS, PUSHER_CHANNELS } from "@/lib/realtime/pusher";
import type { PostWithRelations, FeedSort } from "@/types";
import { PostType } from "@prisma/client";
import { Sparkles, RefreshCw } from "lucide-react";

interface InfiniteScrollFeedProps {
  initialBowl?: string;
  initialType?: PostType;
}

export function InfiniteScrollFeed({ initialBowl, initialType }: InfiniteScrollFeedProps) {
  const [posts, setPosts] = useState<PostWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(true);
  const [sort, setSort] = useState<FeedSort>("latest");
  const [type, setType] = useState<PostType | undefined>(initialType);
  const [newPostsAvailable, setNewPostsAvailable] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const { ref: bottomRef, inView } = useInView({ threshold: 0.1 });

  const fetchPosts = useCallback(async (reset = false) => {
    if (reset) {
      setLoading(true);
      setCursor(undefined);
    } else {
      setLoadingMore(true);
    }
    setError(null);

    try {
      const params = new URLSearchParams();
      if (initialBowl) params.set("bowl", initialBowl);
      if (type) params.set("type", type);
      params.set("sort", sort);
      if (!reset && cursor) params.set("cursor", cursor);

      const res = await fetch(`/api/feed?${params}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to load feed");

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
  }, [initialBowl, type, sort, cursor]);

  // Initial load & refetch on filter change
  useEffect(() => {
    fetchPosts(true);
  }, [sort, type, initialBowl]);

  // Infinite scroll trigger
  useEffect(() => {
    if (inView && hasMore && !loadingMore && !loading) {
      fetchPosts(false);
    }
  }, [inView, hasMore, loadingMore, loading]);

  // Pusher realtime
  useEffect(() => {
    try {
      const pusher = getPusherClient();
      if (!pusher) return;
      const channelName = initialBowl
        ? PUSHER_CHANNELS.bowl(initialBowl)
        : PUSHER_CHANNELS.FEED;

      const channel = pusher.subscribe(channelName);
      channel.bind(PUSHER_EVENTS.NEW_POST, () => {
        setNewPostsAvailable((n) => n + 1);
      });
      channel.bind(PUSHER_EVENTS.VOTE_UPDATE, (data: { postId: string; score: number }) => {
        setPosts((prev) =>
          prev.map((p) => (p.id === data.postId ? { ...p, score: data.score } : p))
        );
      });

      return () => {
        channel.unbind_all();
        pusher.unsubscribe(channelName);
      };
    } catch {
      // Pusher not configured
    }
  }, [initialBowl]);

  const handleVoteUpdate = (postId: string, newScore: number, newVote: number | null) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, score: newScore, userVote: newVote } : p))
    );
  };

  return (
    <div className="space-y-4">
      <FeedFilters
        sort={sort}
        type={type}
        onSortChange={(s) => { setSort(s); }}
        onTypeChange={(t) => { setType(t); }}
      />

      {/* New posts notification */}
      {newPostsAvailable > 0 && (
        <button
          onClick={() => { fetchPosts(true); setNewPostsAvailable(0); }}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-whisper-500/30 bg-whisper-500/5 text-whisper-500 text-sm font-medium hover:bg-whisper-500/10 transition-colors animate-in"
        >
          <Sparkles className="w-4 h-4" />
          {newPostsAvailable} new {newPostsAvailable === 1 ? "post" : "posts"} — click to refresh
        </button>
      )}

      {error && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-3">{error}</p>
          <button
            onClick={() => fetchPosts(true)}
            className="flex items-center gap-2 mx-auto px-4 py-2 rounded-lg bg-muted text-sm hover:bg-muted/80 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </button>
        </div>
      )}

      {loading ? (
        Array.from({ length: 5 }).map((_, i) => (
          <PostCardSkeleton key={i} />
        ))
      ) : posts.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">🤫</div>
          <p className="font-display font-semibold text-lg mb-1">No posts yet</p>
          <p className="text-muted-foreground text-sm">Be the first to start the conversation.</p>
        </div>
      ) : (
        <>
          {posts.map((post, i) => (
            <div key={post.id} className={`animate-in stagger-${Math.min(i + 1, 4)}`}>
              <PostCard post={post} onVoteUpdate={handleVoteUpdate} />
            </div>
          ))}
          {loadingMore && Array.from({ length: 2 }).map((_, i) => <PostCardSkeleton key={`more-${i}`} />)}
          {!hasMore && posts.length > 0 && (
            <div className="text-center py-6 text-sm text-muted-foreground">
              You've reached the end 🎉
            </div>
          )}
          <div ref={bottomRef} className="h-4" />
        </>
      )}
    </div>
  );
}
