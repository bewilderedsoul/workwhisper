// src/components/ui/Toaster.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

// Global event emitter for toasts (works across component tree without context)
type ToastListener = (toast: Toast) => void;
const listeners: ToastListener[] = [];

function emitToast(toast: Toast) {
  listeners.forEach((l) => l(toast));
}

export function useToast() {
  const toast = useCallback(
    (message: string, type: ToastType = "info") => {
      emitToast({
        id: Math.random().toString(36).slice(2),
        message,
        type,
      });
    },
    []
  );
  return { toast };
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const listener: ToastListener = (toast) => {
      setToasts((prev) => [...prev, toast]);
      setTimeout(
        () => setToasts((prev) => prev.filter((t) => t.id !== toast.id)),
        4000
      );
    };
    listeners.push(listener);
    return () => {
      const idx = listeners.indexOf(listener);
      if (idx > -1) listeners.splice(idx, 1);
    };
  }, []);

  const remove = (id: string) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />,
    info: <Info className="w-4 h-4 text-blue-500 shrink-0" />,
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "flex items-start gap-3 p-4 rounded-xl border shadow-xl animate-in pointer-events-auto",
            "bg-popover border-border"
          )}
        >
          {icons[t.type]}
          <p className="text-sm flex-1 leading-snug">{t.message}</p>
          <button
            onClick={() => remove(t.id)}
            className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
