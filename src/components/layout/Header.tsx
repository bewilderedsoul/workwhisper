// src/components/layout/Header.tsx
"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import {
  Sun, Moon, Bell, PenSquare, LogOut, User, TrendingUp,
  Menu, X, Search, ChevronDown, DollarSign, Building2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";

export function Header() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="text-xl">🐠</span>
          <span className="font-display font-bold text-lg gradient-text hidden sm:block">
            WorkWhisper
          </span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-1 ml-2">
          <Link
            href="/salary"
            className="px-2.5 py-1.5 rounded-md text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-muted transition flex items-center gap-1.5"
          >
            <DollarSign className="w-3.5 h-3.5" />
            Salaries
          </Link>
          <Link
            href="/salary/companies"
            className="px-2.5 py-1.5 rounded-md text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-muted transition flex items-center gap-1.5"
          >
            <Building2 className="w-3.5 h-3.5" />
            Companies
          </Link>
          <Link
            href="/feed"
            className="px-2.5 py-1.5 rounded-md text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-muted transition flex items-center gap-1.5"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Feed
          </Link>
        </nav>

        {/* Search bar */}
        <div className="flex-1 max-w-sm hidden lg:block">
          <Link href="/salary" className="relative block group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <div className="w-full pl-9 pr-4 py-2 text-sm bg-muted/50 border border-border rounded-lg
                         text-muted-foreground/60 cursor-pointer group-hover:border-ring/50 transition-all">
              Search salaries, companies, levels...
            </div>
          </Link>
        </div>

        <nav className="flex items-center gap-1 ml-auto">
          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Toggle theme"
            suppressHydrationWarning
          >
            {mounted ? (
              theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />
            ) : (
              <span className="block w-4 h-4" />
            )}
          </button>

          {session ? (
            <>
              {/* Write post button */}
              <Link
                href="/post/new"
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
                           bg-whisper-500 hover:bg-whisper-600 text-white transition-colors"
              >
                <PenSquare className="w-4 h-4" />
                <span>Post</span>
              </Link>

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-muted transition-colors"
                >
                  <Avatar username={session.user.username} size="sm" />
                  <span className="hidden sm:block text-sm font-medium max-w-24 truncate">
                    {session.user.username}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                </button>

                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-1 w-48 bg-popover border border-border rounded-xl shadow-lg z-20 overflow-hidden animate-in">
                      <Link
                        href="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                      >
                        <User className="w-4 h-4 text-muted-foreground" />
                        Profile
                      </Link>
                      <Link
                        href="/feed"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                      >
                        <TrendingUp className="w-4 h-4 text-muted-foreground" />
                        My Feed
                      </Link>
                      <hr className="border-border my-1" />
                      <button
                        onClick={() => { signOut({ callbackUrl: "/" }); setUserMenuOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-muted transition-colors text-left text-destructive hover:text-destructive"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <Link
              href="/login"
              className="px-4 py-1.5 rounded-lg text-sm font-medium bg-whisper-500 hover:bg-whisper-600 text-white transition-colors"
            >
              Sign in
            </Link>
          )}

          {/* Mobile menu */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </nav>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background px-4 py-3 space-y-2">
          <Link
            href="/salary"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted transition"
          >
            <DollarSign className="w-4 h-4" /> Search salaries
          </Link>
          <Link
            href="/salary/companies"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted transition"
          >
            <Building2 className="w-4 h-4" /> Browse companies
          </Link>
          <Link
            href="/feed"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted transition"
          >
            <TrendingUp className="w-4 h-4" /> Feed
          </Link>
          <Link
            href="/salary/submit"
            onClick={() => setMobileOpen(false)}
            className="flex items-center justify-center gap-2 w-full py-2 rounded-lg text-sm font-medium bg-whisper-500 hover:bg-whisper-600 text-white transition"
          >
            <PenSquare className="w-4 h-4" />
            Share your salary
          </Link>
        </div>
      )}
    </header>
  );
}
