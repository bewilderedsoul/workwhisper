// src/components/post/CommentSection.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { MessageCircle, ArrowUp, Reply, ChevronDown, ChevronUp } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { cn, timeAgo, formatCount } from "@/lib/utils";
import { getPusherClient, PUSHER_EVENTS, PUSHER_CHANNELS } from "@/lib/realtime/pusher";
import type { CommentWithRelations } from "@/types";
import { useToast } from "@/components/ui/Toaster";

interface CommentSectionProps {
  postId: string;
}

export function CommentSection({ postId }: CommentSectionProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const [comments, setComments] = useState<CommentWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/posts/${postId}/comments`);
      const data = await res.json();
      setComments(data.data || []);
    } catch {
      toast("Failed to load comments", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  // Realtime new comments
  useEffect(() => {
    try {
      const pusher = getPusherClient();
      if (!pusher) return;
      const channel = pusher.subscribe(PUSHER_CHANNELS.post(postId));
      channel.bind(PUSHER_EVENTS.NEW_COMMENT, (comment: CommentWithRelations) => {
        if (!comment.parentId) {
          setComments((prev) => [comment, ...prev]);
        } else {
          setComments((prev) =>
            prev.map((c) =>
              c.id === comment.parentId
                ? { ...c, replies: [...(c.replies || []), comment] }
                : c
            )
          );
        }
      });
      return () => {
        channel.unbind_all();
        pusher.unsubscribe(PUSHER_CHANNELS.post(postId));
      };
    } catch { }
  }, [postId]);

  const handleSubmit = async (
    e: React.FormEvent,
    content: string,
    parentId?: string,
    onSuccess?: () => void
  ) => {
    e.preventDefault();
    if (!session) { router.push("/login"); return; }
    if (!content.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim(), parentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to comment");
      onSuccess?.();
      if (!parentId) setNewComment("");
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div id="comments" className="space-y-4">
      <h2 className="font-display font-semibold text-lg flex items-center gap-2">
        <MessageCircle className="w-5 h-5 text-whisper-500" />
        {comments.length} {comments.length === 1 ? "Comment" : "Comments"}
      </h2>

      {/* New comment form */}
      {session ? (
        <form
          onSubmit={(e) => handleSubmit(e, newComment)}
          className="whisper-card p-4 space-y-3"
        >
          <div className="flex items-start gap-3">
            <Avatar username={session.user.username} size="sm" />
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your thoughts anonymously..."
              rows={3}
              maxLength={2000}
              className="flex-1 px-3 py-2 text-sm bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            {newComment && (
              <button
                type="button"
                onClick={() => setNewComment("")}
                className="px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={submitting || !newComment.trim()}
              className="px-4 py-1.5 rounded-lg text-sm font-medium bg-whisper-500 hover:bg-whisper-600 text-white transition-colors disabled:opacity-50"
            >
              {submitting ? "Posting..." : "Comment"}
            </button>
          </div>
        </form>
      ) : (
        <div className="whisper-card p-4 text-center text-sm text-muted-foreground">
          <button
            onClick={() => router.push("/login")}
            className="text-whisper-500 hover:underline font-medium"
          >
            Sign in
          </button>{" "}
          to join the discussion anonymously
        </div>
      )}

      {/* Comments list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="whisper-card p-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-muted shimmer" />
                <div className="h-3 w-24 bg-muted rounded shimmer" />
              </div>
              <div className="h-3 w-full bg-muted rounded shimmer ml-11" />
              <div className="h-3 w-3/4 bg-muted rounded shimmer ml-11" />
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No comments yet. Be the first!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              postId={postId}
              onReply={handleSubmit}
              submitting={submitting}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface CommentCardProps {
  comment: CommentWithRelations;
  postId: string;
  onReply: (e: React.FormEvent, content: string, parentId?: string, onSuccess?: () => void) => void;
  submitting: boolean;
  depth?: number;
}

function CommentCard({ comment, postId, onReply, submitting, depth = 0 }: CommentCardProps) {
  const { data: session } = useSession();
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [repliesExpanded, setRepliesExpanded] = useState(true);

  return (
    <div className={cn("whisper-card p-4", depth > 0 && "ml-8 border-l-2 border-whisper-500/10")}>
      <div className="flex items-start gap-3">
        <Avatar username={comment.user.username} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold">{comment.user.username}</span>
            <span className="text-xs text-muted-foreground">{timeAgo(comment.createdAt)}</span>
          </div>
          <p className="text-sm leading-relaxed">{comment.content}</p>

          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <button className="hover:text-whisper-500 transition-colors p-0.5 rounded">
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <span className="tabular-nums font-medium">{formatCount(comment.score)}</span>
            </div>

            {session && (
              <button
                onClick={() => setReplyOpen(!replyOpen)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Reply className="w-3.5 h-3.5" />
                Reply
              </button>
            )}

            {comment.replies && comment.replies.length > 0 && (
              <button
                onClick={() => setRepliesExpanded(!repliesExpanded)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors ml-auto"
              >
                {repliesExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                {comment.replies.length} {comment.replies.length === 1 ? "reply" : "replies"}
              </button>
            )}
          </div>

          {/* Reply form */}
          {replyOpen && (
            <form
              onSubmit={(e) =>
                onReply(e, replyText, comment.id, () => {
                  setReplyText("");
                  setReplyOpen(false);
                })
              }
              className="mt-3 space-y-2"
            >
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Reply to ${comment.user.username}...`}
                rows={2}
                maxLength={2000}
                autoFocus
                className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setReplyOpen(false); setReplyText(""); }}
                  className="px-3 py-1 rounded-lg text-xs text-muted-foreground hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !replyText.trim()}
                  className="px-3 py-1 rounded-lg text-xs font-medium bg-whisper-500 hover:bg-whisper-600 text-white transition-colors disabled:opacity-50"
                >
                  Reply
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Nested replies */}
      {repliesExpanded && comment.replies && comment.replies.length > 0 && depth < 3 && (
        <div className="mt-3 space-y-3">
          {comment.replies.map((reply) => (
            <CommentCard
              key={reply.id}
              comment={reply}
              postId={postId}
              onReply={onReply}
              submitting={submitting}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
