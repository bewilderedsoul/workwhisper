// src/components/salary/SalarySubmitForm.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Shield, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { formatSalary, cn } from "@/lib/utils";

const LEVELS = ["Fresher", "Junior", "Mid", "Senior", "Lead", "Staff", "Principal", "Manager", "Director"];
const WORK = ["Remote", "Hybrid", "Onsite"];

// Country → default currency. Free-text city.
const COUNTRY_PRESETS: { country: string; currency: string; sampleCities: string }[] = [
  { country: "India", currency: "INR", sampleCities: "Bangalore, Hyderabad, Pune, Mumbai, Gurgaon, Chennai, Noida" },
  { country: "United States", currency: "USD", sampleCities: "San Francisco, New York, Seattle, Austin, Boston" },
  { country: "United Kingdom", currency: "GBP", sampleCities: "London, Manchester, Edinburgh" },
  { country: "Ireland", currency: "EUR", sampleCities: "Dublin, Cork" },
  { country: "Germany", currency: "EUR", sampleCities: "Berlin, Munich, Hamburg, Frankfurt" },
  { country: "Netherlands", currency: "EUR", sampleCities: "Amsterdam, Rotterdam" },
  { country: "France", currency: "EUR", sampleCities: "Paris, Lyon" },
  { country: "Switzerland", currency: "CHF", sampleCities: "Zurich, Geneva, Basel" },
  { country: "Sweden", currency: "SEK", sampleCities: "Stockholm, Gothenburg, Malmö" },
  { country: "Spain", currency: "EUR", sampleCities: "Madrid, Barcelona" },
  { country: "Italy", currency: "EUR", sampleCities: "Milan, Rome" },
  { country: "Singapore", currency: "SGD", sampleCities: "Singapore" },
  { country: "Australia", currency: "AUD", sampleCities: "Sydney, Melbourne, Brisbane" },
  { country: "Canada", currency: "CAD", sampleCities: "Toronto, Vancouver, Montreal, Ottawa" },
  { country: "Japan", currency: "JPY", sampleCities: "Tokyo, Osaka" },
  { country: "United Arab Emirates", currency: "AED", sampleCities: "Dubai, Abu Dhabi" },
  { country: "Brazil", currency: "BRL", sampleCities: "São Paulo, Rio de Janeiro" },
  { country: "Mexico", currency: "USD", sampleCities: "Mexico City, Guadalajara" },
  { country: "Argentina", currency: "USD", sampleCities: "Buenos Aires" },
  { country: "Colombia", currency: "USD", sampleCities: "Bogotá, Medellín" },
  { country: "Israel", currency: "USD", sampleCities: "Tel Aviv, Herzliya" },
  { country: "Hong Kong", currency: "USD", sampleCities: "Hong Kong" },
  { country: "South Korea", currency: "USD", sampleCities: "Seoul" },
  { country: "China", currency: "USD", sampleCities: "Beijing, Shanghai, Shenzhen" },
  { country: "Indonesia", currency: "USD", sampleCities: "Jakarta" },
  { country: "Vietnam", currency: "USD", sampleCities: "Ho Chi Minh City, Hanoi" },
  { country: "Philippines", currency: "USD", sampleCities: "Manila, Cebu" },
  { country: "Thailand", currency: "USD", sampleCities: "Bangkok" },
  { country: "Poland", currency: "EUR", sampleCities: "Warsaw, Krakow" },
  { country: "Portugal", currency: "EUR", sampleCities: "Lisbon, Porto" },
  { country: "Egypt", currency: "USD", sampleCities: "Cairo" },
  { country: "Pakistan", currency: "USD", sampleCities: "Karachi, Lahore" },
];

const CURRENCY_HINT: Record<string, string> = {
  INR: "Enter in LPA (lakhs/year). e.g. 30 = ₹30L",
  USD: "Enter in thousands per year. e.g. 150 = $150K",
  EUR: "Enter in thousands per year. e.g. 90 = €90K",
  GBP: "Enter in thousands per year. e.g. 95 = £95K",
  SGD: "Enter in thousands per year. e.g. 140 = S$140K",
  AUD: "Enter in thousands per year. e.g. 180 = A$180K",
  CAD: "Enter in thousands per year. e.g. 160 = C$160K",
  AED: "Enter in thousands per year. e.g. 400 = AED 400K",
  JPY: "Enter in 万 (10K-yen units). e.g. 1500 = ¥15M",
  BRL: "Enter in thousands per year. e.g. 280 = R$280K",
  CHF: "Enter in thousands per year. e.g. 160 = CHF 160K",
  SEK: "Enter in thousands per year. e.g. 800 = 800K kr",
};

export function SalarySubmitForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({
    company: searchParams?.get("company") || "",
    role: searchParams?.get("role") || "",
    level: searchParams?.get("level") || "Mid",
    experience: 3,
    baseSalary: 0,
    bonus: 0,
    stock: 0,
    country: "India",
    currency: "INR",
    location: "Bangalore",
    workArrangement: "Hybrid",
    skills: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const total = (form.baseSalary || 0) + (form.bonus || 0) + (form.stock || 0);
  const currentPreset = COUNTRY_PRESETS.find((p) => p.country === form.country);

  const setField = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const onCountryChange = (country: string) => {
    const preset = COUNTRY_PRESETS.find((p) => p.country === country);
    setForm((f) => ({
      ...f,
      country,
      currency: preset?.currency ?? f.currency,
      location: preset?.sampleCities.split(",")[0]?.trim() ?? f.location,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.company || !form.role || !form.baseSalary) {
      setError("Company, role and base salary are required.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/salaries/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          baseSalary: Number(form.baseSalary),
          bonus: Number(form.bonus) || 0,
          stock: Number(form.stock) || 0,
          experience: Number(form.experience),
          skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 15),
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(typeof j.error === "string" ? j.error : "Submission failed. Please try again.");
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push("/salary"), 1500);
    } catch {
      setError("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center">
        <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500" />
        <h1 className="font-display font-bold text-2xl mb-2">Thanks for sharing!</h1>
        <p className="text-muted-foreground text-sm">
          Your anonymous salary report is now live. Redirecting...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-whisper-500/10 text-whisper-600 dark:text-whisper-400 mb-3">
          <Shield className="w-3 h-3" />
          100% Anonymous
        </div>
        <h1 className="font-display font-bold text-3xl mb-1">Share your salary</h1>
        <p className="text-muted-foreground text-sm">
          Add your compensation from any company, anywhere in the world.
          No personal info is stored — purely the numbers.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Company" required>
            <input
              type="text"
              value={form.company}
              onChange={(e) => setField("company", e.target.value)}
              placeholder="e.g. Google"
              className="input"
              required
            />
          </Field>

          <Field label="Role / Job title" required>
            <input
              type="text"
              value={form.role}
              onChange={(e) => setField("role", e.target.value)}
              placeholder="e.g. Software Engineer L4"
              className="input"
              required
            />
          </Field>

          <Field label="Level">
            <select
              value={form.level}
              onChange={(e) => setField("level", e.target.value)}
              className="input"
            >
              {LEVELS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </Field>

          <Field label="Years of experience">
            <input
              type="number"
              min={0}
              max={40}
              value={form.experience}
              onChange={(e) => setField("experience", Number(e.target.value))}
              className="input"
            />
          </Field>

          <Field label="Country" required>
            <select
              value={form.country}
              onChange={(e) => onCountryChange(e.target.value)}
              className="input"
            >
              {COUNTRY_PRESETS.map((p) => (
                <option key={p.country} value={p.country}>{p.country}</option>
              ))}
            </select>
          </Field>

          <Field label="City / Office" required hint={currentPreset ? `Examples: ${currentPreset.sampleCities}` : undefined}>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setField("location", e.target.value)}
              placeholder="e.g. Bangalore"
              className="input"
              required
            />
          </Field>

          <Field label="Currency">
            <select
              value={form.currency}
              onChange={(e) => setField("currency", e.target.value)}
              className="input"
            >
              {["INR", "USD", "EUR", "GBP", "SGD", "AUD", "CAD", "AED", "JPY", "BRL", "CHF", "SEK"].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>

          <Field label="Work arrangement">
            <div className="flex gap-2">
              {WORK.map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setField("workArrangement", w)}
                  className={cn(
                    "flex-1 py-2 text-xs rounded-lg border transition",
                    form.workArrangement === w
                      ? "bg-whisper-500 border-whisper-500 text-white"
                      : "border-border hover:border-whisper-500/40"
                  )}
                >
                  {w}
                </button>
              ))}
            </div>
          </Field>
        </div>

        <div className="whisper-card p-4 bg-gradient-to-br from-whisper-500/5 to-saffron-500/5">
          <div className="flex items-center justify-between mb-2">
            <div className="font-display font-semibold text-sm flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-whisper-500" />
              Compensation ({form.currency})
            </div>
            <div className="text-xs text-muted-foreground">
              Total CTC: <span className="font-bold text-green-500">{formatSalary(total, form.currency)}</span>
            </div>
          </div>
          <div className="text-[11px] text-muted-foreground mb-3">
            {CURRENCY_HINT[form.currency] ?? "Enter in your local currency."}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Base">
              <input
                type="number"
                min={0}
                value={form.baseSalary || ""}
                onChange={(e) => setField("baseSalary", Number(e.target.value))}
                placeholder="0"
                className="input text-lg font-bold"
                required
              />
            </Field>
            <Field label="Bonus / Variable">
              <input
                type="number"
                min={0}
                value={form.bonus || ""}
                onChange={(e) => setField("bonus", Number(e.target.value))}
                placeholder="0"
                className="input"
              />
            </Field>
            <Field label="Stock (annual)">
              <input
                type="number"
                min={0}
                value={form.stock || ""}
                onChange={(e) => setField("stock", Number(e.target.value))}
                placeholder="0"
                className="input"
              />
            </Field>
          </div>
        </div>

        <Field label="Skills (comma-separated)" hint="e.g. Java, Spring Boot, AWS">
          <input
            type="text"
            value={form.skills}
            onChange={(e) => setField("skills", e.target.value)}
            placeholder="React, TypeScript, GraphQL"
            className="input"
          />
        </Field>

        <Field label="Notes (optional)" hint="Anything else? Negotiation tips, interview vibe, perks...">
          <textarea
            value={form.notes}
            onChange={(e) => setField("notes", e.target.value)}
            rows={3}
            className="input resize-none"
            placeholder="Optional context..."
          />
        </Field>

        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg p-3">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl font-semibold text-sm bg-whisper-500 hover:bg-whisper-600 disabled:opacity-50 text-white transition"
          >
            {submitting ? "Submitting..." : "Submit anonymously"}
          </button>
        </div>
      </form>

      <style jsx>{`
        :global(.input) {
          width: 100%;
          padding: 0.55rem 0.75rem;
          background: hsl(var(--background));
          border: 1px solid hsl(var(--border));
          border-radius: 0.5rem;
          font-size: 0.875rem;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        :global(.input:focus) {
          outline: none;
          border-color: hsl(var(--ring));
          box-shadow: 0 0 0 3px hsl(var(--ring) / 0.2);
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="text-xs font-medium text-foreground/80 mb-1.5">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </div>
      {children}
      {hint && <div className="text-[11px] text-muted-foreground mt-1">{hint}</div>}
    </label>
  );
}
