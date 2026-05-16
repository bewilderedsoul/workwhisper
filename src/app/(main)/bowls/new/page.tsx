// src/app/(main)/bowls/new/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/components/ui/Toaster";
import { ChevronLeft, Hash } from "lucide-react";
import Link from "next/link";

const EMOJI_OPTIONS = ["🏢","💻","💰","🚀","⚙️","📊","🎯","🔵","🟣","🟢","🔴","⚖️","🏆","💡","🌐","🔑","📱","🎓"];

export default function NewBowlPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("🏢");
  const [submitting, setSubmitting] = useState(false);

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) { router.push("/login"); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/bowls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || undefined, icon }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create bowl");
      toast(`Bowl "${name}" created!`, "success");
      router.push(`/bowl/${data.data.slug}`);
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-lg mx-auto">
        <Link href="/bowls" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ChevronLeft className="w-4 h-4" /> Back to Bowls
        </Link>

        <div className="mb-6">
          <h1 className="font-display font-bold text-2xl">Create a Bowl</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Start a new anonymous community for Indian professionals
          </p>
        </div>

        <div className="whisper-card p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Icon picker */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-2">Icon</label>
              <div className="flex flex-wrap gap-2">
                {EMOJI_OPTIONS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setIcon(e)}
                    className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                      icon === e
                        ? "bg-whisper-500/20 ring-2 ring-whisper-500"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Bowl Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Startup Founders India"
                maxLength={100}
                required
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {name && (
                <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
                  <Hash className="w-3 h-3" />
                  <span className="font-mono">{slug}</span>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Description <span className="opacity-50">(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this bowl about? Who is it for?"
                rows={3}
                maxLength={500}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>

            {/* Preview */}
            {name && (
              <div className="p-3 rounded-lg bg-muted/50 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-xl">{icon}</div>
                <div>
                  <div className="text-sm font-semibold">{name}</div>
                  {description && <div className="text-xs text-muted-foreground">{description}</div>}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="w-full py-2.5 rounded-lg font-semibold text-sm bg-whisper-500 hover:bg-whisper-600 text-white transition-colors disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create Bowl"}
            </button>
          </form>
        </div>
      </div>
    </MainLayout>
  );
}
