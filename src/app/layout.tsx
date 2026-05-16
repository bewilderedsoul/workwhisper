// src/app/layout.tsx
import type { Metadata } from "next";
import { Syne, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  weight: ["400", "500"],
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "WorkWhisper — Anonymous Professional Community India",
    template: "%s | WorkWhisper",
  },
  description:
    "India's anonymous platform for salary transparency, workplace discussions, and professional insights. Share your comp, discuss your workplace, grow your career.",
  keywords: [
    "salary india",
    "software engineer salary india",
    "TCS salary",
    "Infosys salary",
    "anonymous professional community india",
    "workplace discussions india",
    "salary transparency india",
    "tech jobs india",
  ],
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://workwhisper.in",
    siteName: "WorkWhisper",
    title: "WorkWhisper — Anonymous Professional Community India",
    description:
      "India's anonymous platform for salary transparency and workplace discussions.",
  },
  twitter: {
    card: "summary_large_image",
    title: "WorkWhisper",
    description: "Anonymous salary & workplace discussions for Indian professionals.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} ${syne.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
