// src/components/post/PostDetailClient.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ArrowUp, ArrowDown, Share2, Trash2, Flag,
  Briefcase, MapPin, Clock, Eye, MessageCircle
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { cn, timeAgo, formatCount, formatSalary } from "@/lib/utils";
import { useToast } from "@/components/ui/Toaster";
import type { PostWithRelations } from "@/types";

interface PostDetailClientProps {
  post: PostWithRelations & { userVote: number | null };
  currentUserId?: string;
}

export function PostDetailClient({ post, currentUserId }: PostDetailClientProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const [score, setScore] = useState(post.score);
  const [userVote, setUserVote] = useState<number | null>(post.userVote);
  const [voting, setVoting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isSalary = post.type === "SALARY";
  const isOwner = currentUserId && post.user.id === currentUserId;

  const handleVote = async (value: 1 | -1) => {
    if (!session) { router.push("/login"); return; }
    if (voting) return;

    const newValue = userVote === value ? 0 : value;
    setVoting(true);
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
      if (data.success) { setScore(data.data.score); setUserVote(data.data.userVote); }
    } catch { setScore(post.score); setUserVote(post.userVote); }
    finally { setVoting(false); }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this post? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast("Post deleted", "success");
      router.push(`/bowl/${post.bowl.slug}`);
    } catch {
      toast("Failed to delete post", "error");
    } finally {
      setDeleting(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: post.title || "WorkWhisper post", url: window.location.href });
    } else {
      navigator.clipboard?.writeText(window.location.href);
      toast("Link copied!", "success");
    }
  };

  return (
    <article className="whisper-card p-5 sm:p-6">
      {/* Bowl badge */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
        <Link href={`/bowl/${post.bowl.slug}`}
          className="flex items-center gap-1.5 font-medium text-foreground/80 hover:text-whisper-500 transition-colors">
          <span>{post.bowl.icon}</span>
          <span>{post.bowl.name}</span>
        </Link>
        <span>·</span>
        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(post.createdAt)}</span>
        <span>·</span>
        <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{formatCount(post.viewCount)} views</span>
        {isSalary && (
          <><span>·</span><span className="salary-badge">💰 Salary</span></>
        )}
      </div>

      {/* Title */}
      {post.title && (
        <h1 className="font-display font-bold text-xl sm:text-2xl mb-4 text-balance leading-tight">
          {post.title}
        </h1>
      )}

      {/* Salary card */}
      {isSalary && post.company && (
        <div className="mb-5 p-4 rounded-xl bg-gradient-to-r from-whisper-500/5 to-saffron-500/5 border border-whisper-500/10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Company", value: post.company },
              { label: "Role", value: post.role },
              { label: "Base Salary", value: post.baseSalary ? `${formatSalary(post.baseSalary)} LPA` : null, color: "text-green-500" },
              { label: "Total CTC", value: post.totalComp ? `${formatSalary(post.totalComp)} LPA` : null, color: "text-whisper-500" },
            ].filter(({ value }) => value).map(({ label, value, color }) => (
              <div key={label}>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">{label}</div>
                <div className={cn("font-bold text-sm sm:text-base", color)}>{value}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-muted-foreground">
            {post.location && (
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{post.location}</span>
            )}
            {post.experience != null && (
              <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{post.experience}yr exp</span>
            )}
          </div>

          {post.skills?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {post.skills.map((skill) => (
                <span key={skill} className="px-2.5 py-1 rounded-lg bg-muted text-xs font-medium">{skill}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
      </div>

      {/* Author */}
      <div className="flex items-center gap-2 mt-5 pt-4 border-t border-border text-sm">
        <Avatar username={post.user.username} size="sm" />
        <span className="font-medium">{post.user.username}</span>
        <span className="text-muted-foreground text-xs">· Anonymous member</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-4">
        {/* Votes */}
        <div className="flex items-center rounded-lg border border-border overflow-hidden">
          <button onClick={() => handleVote(1)} disabled={!session || voting}
            className={cn("vote-btn rounded-none border-0 border-r border-border px-3", userVote === 1 && "upvoted")}>
            <ArrowUp className="w-4 h-4" />
          </button>
          <span className={cn(
            "px-3 text-sm font-bold tabular-nums min-w-[3rem] text-center",
            userVote === 1 && "text-whisper-500",
            userVote === -1 && "text-destructive"
          )}>
            {formatCount(score)}
          </span>
          <button onClick={() => handleVote(-1)} disabled={!session || voting}
            className={cn("vote-btn rounded-none border-0 border-l border-border px-3", userVote === -1 && "downvoted")}>
            <ArrowDown className="w-4 h-4" />
          </button>
        </div>

        <a href="#comments"
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <MessageCircle className="w-4 h-4" />
          <span>{formatCount(post._count.comments)}</span>
        </a>

        <button onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <Share2 className="w-4 h-4" />
          <span className="hidden sm:inline">Share</span>
        </button>

        <div className="ml-auto flex items-center gap-1">
          <button className="p-2 rounded-lg text-muted-foreground hover:text-saffron-500 hover:bg-muted transition-colors">
            <Flag className="w-4 h-4" />
          </button>

          {isOwner && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
