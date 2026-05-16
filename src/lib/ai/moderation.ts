// src/lib/ai/moderation.ts
import OpenAI from "openai";
import { ModerationResult } from "@/types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function moderateContent(text: string): Promise<ModerationResult> {
  try {
    // Use OpenAI moderation endpoint
    const response = await openai.moderations.create({ input: text });
    const result = response.results[0];

    if (result.flagged) {
      const flaggedCategories = Object.entries(result.categories)
        .filter(([, flagged]) => flagged)
        .map(([cat]) => cat);

      return {
        flagged: true,
        reason: `Content flagged: ${flaggedCategories.join(", ")}`,
        categories: flaggedCategories,
        score: Math.max(...Object.values(result.category_scores)),
      };
    }

    // Additional custom checks for PII (phone numbers, Aadhar, etc.)
    const piiPatterns = [
      { pattern: /\b\d{10}\b/g, label: "phone number" },
      { pattern: /\b\d{4}\s?\d{4}\s?\d{4}\b/g, label: "Aadhar number" },
      { pattern: /\bpan[:\s]?[A-Z]{5}\d{4}[A-Z]\b/gi, label: "PAN number" },
    ];

    for (const { pattern, label } of piiPatterns) {
      if (pattern.test(text)) {
        return {
          flagged: true,
          reason: `Post contains sensitive information: ${label}`,
          categories: ["pii"],
          score: 0.9,
        };
      }
    }

    return { flagged: false };
  } catch (err) {
    console.error("Moderation error:", err);
    return { flagged: false }; // Fail open
  }
}

export async function generateSalaryInsightSummary(
  posts: Array<{ company?: string | null; role?: string | null; baseSalary?: number | null; totalComp?: number | null; experience?: number | null; location?: string | null }>
): Promise<string> {
  const dataStr = posts
    .map(
      (p) =>
        `${p.role || "SWE"} at ${p.company || "unknown"}, ${p.experience || "?"}yr exp, ₹${p.baseSalary || "?"}L base, ₹${p.totalComp || "?"}L total, ${p.location || "India"}`
    )
    .join("\n");

  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    max_tokens: 300,
    messages: [
      {
        role: "system",
        content:
          "You are a compensation analyst for the Indian tech industry. Provide clear, actionable salary insights from anonymous data. Be concise and specific. Use ₹ and LPA.",
      },
      {
        role: "user",
        content: `Summarize these anonymous salary reports in 3-4 sentences with key insights:\n\n${dataStr}`,
      },
    ],
  });

  return completion.choices[0]?.message?.content || "Insufficient data for insights.";
}

export async function generateTrendingSummary(
  posts: Array<{ title?: string | null; content: string; score: number }>
): Promise<string> {
  const topPosts = posts
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((p) => `[Score:${p.score}] ${p.title || p.content.slice(0, 100)}`)
    .join("\n");

  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    max_tokens: 200,
    messages: [
      {
        role: "system",
        content:
          "Summarize trending discussions in the Indian professional community. Be neutral and concise.",
      },
      {
        role: "user",
        content: `Summarize what's trending this week in 2-3 sentences:\n\n${topPosts}`,
      },
    ],
  });

  return completion.choices[0]?.message?.content || "No trending topics found.";
}
