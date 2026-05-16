// src/components/feed/PostCard.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  ArrowUp, ArrowDown, MessageCircle, Share2,
  Briefcase, MapPin, TrendingUp, Clock, Eye
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { cn, timeAgo, formatCount, formatSalary } from "@/lib/utils";
import type { PostWithRelations } from "@/types";

interface PostCardProps {
  post: PostWithRelations;
  onVoteUpdate?: (postId: string, newScore: number, newVote: number | null) => void;
}

export function PostCard({ post, onVoteUpdate }: PostCardProps) {
  const { data: session } = useSession();
  const [score, setScore] = useState(post.score);
  const [userVote, setUserVote] = useState<number | null>(post.userVote ?? null);
  const [voting, setVoting] = useState(false);

  const handleVote = async (value: 1 | -1) => {
    if (!session) return;
    if (voting) return;

    const newValue = userVote === value ? 0 : value;
    setVoting(true);

    // Optimistic update
    const delta = newValue - (userVote || 0);
    setScore((s) => s + delta);
    setUserVote(newValue === 0 ? null : newValue);

    try {
      const res = await fetch(`/api/posts/${post.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: newValue }),
      });
      const data = await res.json();
      if (data.success) {
        setScore(data.data.score);
        setUserVote(data.data.userVote);
        onVoteUpdate?.(post.id, data.data.score, data.data.userVote);
      }
    } catch {
      // Revert
      setScore(post.score);
      setUserVote(post.userVote ?? null);
    } finally {
      setVoting(false);
    }
  };

  const isSalary = post.type === "SALARY";

  return (
    <article className="whisper-card-hover group">
      <div className="p-4">
        {/* Bowl + meta */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
          <Link
            href={`/bowl/${post.bowl.slug}`}
            className="flex items-center gap-1.5 font-medium text-foreground/80 hover:text-whisper-500 transition-colors"
          >
            <span>{post.bowl.icon}</span>
            <span>{post.bowl.name}</span>
          </Link>
          <span>·</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {timeAgo(post.createdAt)}
          </span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {formatCount(post.viewCount)}
          </span>
          {isSalary && (
            <>
              <span>·</span>
              <span className="salary-badge">💰 Salary</span>
            </>
          )}
        </div>

        {/* Title */}
        {post.title && (
          <Link href={`/post/${post.id}`}>
            <h2 className="font-display font-semibold text-base leading-snug mb-2 group-hover:text-whisper-500 transition-colors line-clamp-2">
              {post.title}
            </h2>
          </Link>
        )}

        {/* Salary card */}
        {isSalary && post.company && (
          <div className="mb-3 p-3 rounded-lg bg-gradient-to-r from-whisper-500/5 to-saffron-500/5 border border-whisper-500/10">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {post.company && (
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-0.5">Company</div>
                  <div className="text-sm font-semibold">{post.company}</div>
                </div>
              )}
              {post.role && (
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-0.5">Role</div>
                  <div className="text-sm font-semibold">{post.role}</div>
                </div>
              )}
              {post.baseSalary && (
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-0.5">Base</div>
                  <div className="text-sm font-bold text-green-500">{formatSalary(post.baseSalary)} LPA</div>
                </div>
              )}
              {post.totalComp && (
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-0.5">Total CTC</div>
                  <div className="text-sm font-bold text-whisper-500">{formatSalary(post.totalComp)} LPA</div>
                </div>
              )}
            </div>
            {post.location && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3" />
                {post.location}
                {post.experience != null && (
                  <>
                    <span>·</span>
                    <Briefcase className="w-3 h-3" />
                    {post.experience}yr exp
                  </>
                )}
              </div>
            )}
            {post.skills?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {post.skills.slice(0, 4).map((skill) => (
                  <span key={skill} className="px-2 py-0.5 rounded-md bg-muted text-xs font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <Link href={`/post/${post.id}`}>
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
            {post.content}
          </p>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-1 mt-4">
          {/* Vote */}
          <div className="flex items-center rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => handleVote(1)}
              disabled={!session || voting}
              className={cn("vote-btn rounded-none border-0 border-r border-border", userVote === 1 && "upvoted")}
              title="Upvote"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <span className={cn(
              "px-2 text-xs font-bold tabular-nums min-w-[2rem] text-center",
              userVote === 1 && "text-whisper-500",
              userVote === -1 && "text-destructive"
            )}>
              {formatCount(score)}
            </span>
            <button
              onClick={() => handleVote(-1)}
              disabled={!session || voting}
              className={cn("vote-btn rounded-none border-0 border-l border-border", userVote === -1 && "downvoted")}
              title="Downvote"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Comments */}
          <Link
            href={`/post/${post.id}#comments`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>{formatCount(post._count.comments)}</span>
          </Link>

          {/* Share */}
          <button
            onClick={() => navigator.clipboard?.writeText(`${window.location.origin}/post/${post.id}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ml-auto"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Share</span>
          </button>

          {/* Author */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Avatar username={post.user.username} size="xs" />
            <span className="hidden sm:inline">{post.user.username}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
