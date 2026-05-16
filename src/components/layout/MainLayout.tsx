// src/components/layout/MainLayout.tsx
import { Header } from "./Header";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  className?: string;
}

export function MainLayout({ children, sidebar, className }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className={cn("max-w-6xl mx-auto px-4 py-6", className)}>
        {sidebar ? (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
            <div>{children}</div>
            <aside className="hidden lg:block space-y-4">{sidebar}</aside>
          </div>
        ) : (
          children
        )}
      </main>
    </div>
  );
}
