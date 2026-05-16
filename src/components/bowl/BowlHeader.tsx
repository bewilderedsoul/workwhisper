// src/components/bowl/BowlHeader.tsx
import { Users, MessageSquare } from "lucide-react";
import { formatCount } from "@/lib/utils";

interface Bowl {
  id: string; name: string; icon: string | null; description?: string | null;
  memberCount: number; _count: { posts: number };
}

export function BowlHeader({ bowl }: { bowl: Bowl }) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center text-3xl shrink-0">
        {bowl.icon || "WW"}
      </div>
      <div>
        <h1 className="font-display font-bold text-xl">{bowl.name}</h1>
        {bowl.description && (
          <p className="text-sm text-muted-foreground mt-0.5">{bowl.description}</p>
        )}
        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            {formatCount(bowl.memberCount)} members
          </span>
          <span className="flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" />
            {formatCount(bowl._count.posts)} posts
          </span>
        </div>
      </div>
    </div>
  );
}
