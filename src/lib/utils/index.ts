// src/lib/utils/index.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function timeAgo(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

const CURRENCY_SYMBOL: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  SGD: "S$",
  AUD: "A$",
  CAD: "C$",
  AED: "AED ",
  JPY: "¥",
  BRL: "R$",
  CHF: "CHF ",
  SEK: "kr ",
};

// Values are stored in "smart units": INR in LPA (lakhs), all other currencies in thousands.
// e.g. 30 INR = ₹30L (₹30 lakh), 150 USD = $150K, 1200 USD = $1.2M, 250 INR = ₹2.5Cr.
export function formatSalary(value: number, currency: string = "INR"): string {
  const cur = (currency || "INR").toUpperCase();
  const sym = CURRENCY_SYMBOL[cur] ?? `${cur} `;
  if (cur === "INR") {
    if (value >= 100) return `${sym}${(value / 100).toFixed(1)}Cr`;
    return `${sym}${value}L`;
  }
  if (cur === "JPY") {
    // JPY values stored in 10K-yen ("man") units to keep numbers small.
    if (value >= 1000) return `${sym}${(value / 1000).toFixed(1)}M万`;
    return `${sym}${value}万`;
  }
  // Western currencies: thousands.
  if (value >= 1000) return `${sym}${(value / 1000).toFixed(2)}M`;
  return `${sym}${value}K`;
}

export function formatCount(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getInitials(username: string): string {
  return username.slice(0, 2).toUpperCase();
}

export function generateAvatarColor(username: string): string {
  const colors = [
    "from-purple-500 to-pink-500",
    "from-blue-500 to-cyan-500",
    "from-green-500 to-emerald-500",
    "from-orange-500 to-red-500",
    "from-indigo-500 to-purple-500",
    "from-teal-500 to-green-500",
    "from-rose-500 to-pink-500",
    "from-amber-500 to-orange-500",
  ];
  const index = username.charCodeAt(0) % colors.length;
  return colors[index];
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePhone(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(phone);
}
