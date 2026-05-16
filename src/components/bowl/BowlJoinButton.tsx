// src/components/bowl/BowlJoinButton.tsx
"use client";

import { useState } from "react";
import { UserPlus, UserMinus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/Toaster";

interface BowlJoinButtonClientProps {
  slug: string;
  initialIsMember: boolean;
  className?: string;
}

export function BowlJoinButtonClient({ slug, initialIsMember, className }: BowlJoinButtonClientProps) {
  const [isMember, setIsMember] = useState(initialIsMember);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleToggle = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/bowls/${slug}/join`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setIsMember(data.isMember);
      toast(data.isMember ? "Joined bowl!" : "Left bowl", "success");
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={cn(
        "w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors",
        isMember
          ? "border border-border text-muted-foreground hover:border-destructive/50 hover:text-destructive hover:bg-destructive/5"
          : "bg-whisper-500 hover:bg-whisper-600 text-white",
        className
      )}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isMember ? (
        <><UserMinus className="w-4 h-4" /> Leave Bowl</>
      ) : (
        <><UserPlus className="w-4 h-4" /> Join Bowl</>
      )}
    </button>
  );
}
