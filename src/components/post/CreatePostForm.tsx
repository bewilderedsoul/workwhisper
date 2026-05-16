// src/components/post/CreatePostForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { DollarSign, FileText, HelpCircle, Star, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/Toaster";

type PostType = "NORMAL" | "SALARY" | "QUESTION" | "REVIEW";
interface Bowl { id: string; name: string; slug: string; icon: string; }

const POST_TYPES = [
  { value: "NORMAL", label: "Post", icon: <FileText className="w-4 h-4" /> },
  { value: "SALARY", label: "Salary", icon: <DollarSign className="w-4 h-4" /> },
  { value: "QUESTION", label: "Question", icon: <HelpCircle className="w-4 h-4" /> },
  { value: "REVIEW", label: "Review", icon: <Star className="w-4 h-4" /> },
];

const INDIAN_CITIES = [
  "Bangalore","Mumbai","Delhi","Hyderabad","Pune","Chennai",
  "Noida","Gurgaon","Kolkata","Ahmedabad","Jaipur","Remote"
];

export function CreatePostForm({ defaultBowlId }: { defaultBowlId?: string }) {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const [postType, setPostType] = useState<PostType>("NORMAL");
  const [bowlId, setBowlId] = useState(defaultBowlId || "");
  const [bowls, setBowls] = useState<Bowl[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [experience, setExperience] = useState("");
  const [baseSalary, setBaseSalary] = useState("");
  const [totalComp, setTotalComp] = useState("");
  const [location, setLocation] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");

  useEffect(() => {
    fetch("/api/bowls")
      .then((r) => r.json())
      .then((d) => {
        setBowls(d.data || []);
        if (!bowlId && d.data?.length > 0) setBowlId(d.data[0].id);
      });
  }, []);

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !skills.includes(s) && skills.length < 8) {
      setSkills([...skills, s]);
      setSkillInput("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) { router.push("/login"); return; }
    if (!bowlId) { toast("Please select a bowl", "error"); return; }
    if (!content.trim()) { toast("Please write something", "error"); return; }
    if (postType === "SALARY" && !baseSalary) {
      toast("Base salary is required for salary posts", "error"); return;
    }

    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        type: postType, bowlId,
        title: title.trim() || undefined,
        content: content.trim(),
      };
      if (postType === "SALARY") {
        Object.assign(body, {
          company: company.trim(),
          role: role.trim() || undefined,
          experience: experience ? parseInt(experience) : undefined,
          baseSalary: parseInt(baseSalary),
          totalComp: totalComp ? parseInt(totalComp) : undefined,
          location: location || undefined,
          skills,
        });
      }

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to post");

      toast("Posted anonymously!", "success");
      router.push(`/post/${data.data.id}`);
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex gap-2">
        {POST_TYPES.map((pt) => (
          <button key={pt.value} type="button" onClick={() => setPostType(pt.value as PostType)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all flex-1 justify-center",
              postType === pt.value
                ? "border-whisper-500/50 bg-whisper-500/10 text-whisper-500"
                : "border-border text-muted-foreground hover:text-foreground"
            )}>
            {pt.icon}<span className="hidden sm:inline">{pt.label}</span>
          </button>
        ))}
      </div>

      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Post to Bowl</label>
        <select value={bowlId} onChange={(e) => setBowlId(e.target.value)} required
          className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="">Select a bowl...</option>
          {bowls.map((b) => <option key={b.id} value={b.id}>{b.icon} {b.name}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1.5">
          Title <span className="opacity-50">(optional)</span>
        </label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder={postType === "SALARY" ? "e.g. My Flipkart PM comp after 5 years" : "What's on your mind?"}
          maxLength={300}
          className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring" />
      </div>

      {postType === "SALARY" && (
        <div className="p-4 rounded-xl bg-gradient-to-br from-whisper-500/5 to-saffron-500/5 border border-whisper-500/15 space-y-4">
          <h3 className="text-sm font-semibold text-whisper-500">Compensation Details</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Company *", value: company, onChange: setCompany, placeholder: "e.g. Google" },
              { label: "Role", value: role, onChange: setRole, placeholder: "e.g. SDE-2" },
            ].map(({ label, value, onChange, placeholder }) => (
              <div key={label}>
                <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
                <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Base (LPA) *</label>
              <input type="number" value={baseSalary} onChange={(e) => setBaseSalary(e.target.value)}
                placeholder="e.g. 24" min={1} max={10000}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Total CTC (LPA)</label>
              <input type="number" value={totalComp} onChange={(e) => setTotalComp(e.target.value)}
                placeholder="e.g. 38" min={1} max={10000}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Experience (yrs)</label>
              <input type="number" value={experience} onChange={(e) => setExperience(e.target.value)}
                placeholder="e.g. 3" min={0} max={40}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Location</label>
              <select value={location} onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Select city...</option>
                {INDIAN_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Skills</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {skills.map((s) => (
                <span key={s} className="flex items-center gap-1 px-2 py-0.5 bg-muted rounded-md text-xs font-medium">
                  {s}
                  <button type="button" onClick={() => setSkills(skills.filter((sk) => sk !== s))}>
                    <X className="w-3 h-3 opacity-60 hover:opacity-100" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" value={skillInput} onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                placeholder="Add skill (Enter to add)"
                className="flex-1 px-3 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring" />
              <button type="button" onClick={addSkill}
                className="px-3 py-1.5 rounded-lg bg-muted text-sm hover:bg-muted/80 transition-colors flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1.5">
          {postType === "SALARY" ? "Your story / context *" : "Content *"}
        </label>
        <textarea value={content} onChange={(e) => setContent(e.target.value)}
          placeholder={postType === "SALARY"
            ? "Share your experience, how you negotiated, tips for others..."
            : "Share your thoughts anonymously. Be honest, be respectful."}
          rows={5} maxLength={5000} required
          className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
        <div className="text-right text-xs text-muted-foreground mt-1">{content.length}/5000</div>
      </div>

      <div className="flex items-start gap-2.5 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
        <span className="text-base leading-tight">🤫</span>
        <p>Published anonymously as <strong className="text-foreground">{session?.user?.username || "your username"}</strong>. Never include Aadhar, PAN, or phone numbers.</p>
      </div>

      <button type="submit" disabled={submitting || !content.trim()}
        className="w-full py-2.5 rounded-lg font-semibold text-sm bg-whisper-500 hover:bg-whisper-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
        {submitting ? "Posting..." : "Post Anonymously 🤫"}
      </button>
    </form>
  );
}
