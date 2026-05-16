// src/types/index.ts
import { Post, User, Bowl, Comment, Vote, PostType } from "@prisma/client";

export type { PostType };

export type UserWithCounts = User & {
  _count?: {
    posts: number;
    comments: number;
  };
};

export type PostWithRelations = Post & {
  user: Pick<User, "id" | "username">;
  bowl: Pick<Bowl, "id" | "name" | "slug" | "icon">;
  _count: { comments: number; votes: number };
  userVote?: number | null;
};

export type CommentWithRelations = Comment & {
  user: Pick<User, "id" | "username">;
  replies?: CommentWithRelations[];
  _count: { replies: number };
};

export type BowlWithCounts = Bowl & {
  _count: {
    posts: number;
    memberships: number;
  };
  isMember?: boolean;
};

export type FeedSort = "latest" | "trending" | "top";

export type FeedFilters = {
  bowl?: string;
  type?: PostType;
  sort?: FeedSort;
  page?: number;
};

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor?: string;
  hasMore: boolean;
  total?: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface SalaryInsight {
  role: string;
  company?: string;
  location?: string;
  avgBase: number;
  avgTotal: number;
  minBase: number;
  maxBase: number;
  count: number;
  topSkills: string[];
}

export interface ModerationResult {
  flagged: boolean;
  reason?: string;
  categories?: string[];
  score?: number;
}
