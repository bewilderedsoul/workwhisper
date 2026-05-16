// src/app/not-found.tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center p-8">
      <div className="text-6xl mb-4">🤫</div>
      <h1 className="font-display font-bold text-3xl mb-2">404 — Page not found</h1>
      <p className="text-muted-foreground mb-6 max-w-sm">
        This page doesn't exist or has been removed. Let's get you back on track.
      </p>
      <Link
        href="/"
        className="px-5 py-2.5 rounded-xl font-semibold text-sm bg-whisper-500 hover:bg-whisper-600 text-white transition-colors"
      >
        Go Home
      </Link>
    </div>
  );
}
