// src/components/feed/PostCardSkeleton.tsx
export function PostCardSkeleton() {
  return (
    <div className="whisper-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="h-3 w-32 bg-muted rounded shimmer" />
        <div className="h-3 w-16 bg-muted rounded shimmer" />
      </div>
      <div className="h-5 w-3/4 bg-muted rounded shimmer" />
      <div className="space-y-2">
        <div className="h-3 w-full bg-muted rounded shimmer" />
        <div className="h-3 w-5/6 bg-muted rounded shimmer" />
        <div className="h-3 w-4/6 bg-muted rounded shimmer" />
      </div>
      <div className="flex items-center gap-2 pt-1">
        <div className="h-7 w-20 bg-muted rounded-lg shimmer" />
        <div className="h-7 w-16 bg-muted rounded-lg shimmer" />
        <div className="h-7 w-8 bg-muted rounded-full shimmer ml-auto" />
      </div>
    </div>
  );
}
