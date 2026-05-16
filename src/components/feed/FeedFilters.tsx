// src/components/feed/FeedFilters.tsx
"use client";

import { cn } from "@/lib/utils";
import { TrendingUp, Clock, Star, DollarSign, MessageSquare } from "lucide-react";
import type { FeedSort } from "@/types";
import { PostType } from "@prisma/client";

interface FeedFiltersProps {
  sort: FeedSort;
  type?: PostType;
  onSortChange: (sort: FeedSort) => void;
  onTypeChange: (type: PostType | undefined) => void;
}

const sortOptions: { value: FeedSort; label: string; icon: React.ReactNode }[] = [
  { value: "latest", label: "Latest", icon: <Clock className="w-3.5 h-3.5" /> },
  { value: "trending", label: "Trending", icon: <TrendingUp className="w-3.5 h-3.5" /> },
  { value: "top", label: "Top", icon: <Star className="w-3.5 h-3.5" /> },
];

const typeOptions: { value: PostType | undefined; label: string; icon: React.ReactNode }[] = [
  { value: undefined, label: "All", icon: null },
  { value: PostType.SALARY, label: "Salary", icon: <DollarSign className="w-3.5 h-3.5" /> },
  { value: PostType.QUESTION, label: "Questions", icon: <MessageSquare className="w-3.5 h-3.5" /> },
];

export function FeedFilters({ sort, type, onSortChange, onTypeChange }: FeedFiltersProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      {/* Sort tabs */}
      <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
        {sortOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onSortChange(opt.value)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
              sort === opt.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {opt.icon}
            {opt.label}
          </button>
        ))}
      </div>

      {/* Type filters */}
      <div className="flex items-center gap-1.5">
        {typeOptions.map((opt) => (
          <button
            key={opt.value ?? "all"}
            onClick={() => onTypeChange(opt.value)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
              type === opt.value
                ? "border-whisper-500/50 bg-whisper-500/10 text-whisper-500"
                : "border-border text-muted-foreground hover:text-foreground hover:border-border/80"
            )}
          >
            {opt.icon}
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
