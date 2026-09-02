"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from "react";

export type ToastType = "success" | "error" | "info" | "loading";

export interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, duration?: number) => number;
  updateToast: (id: number, message: string, type?: ToastType) => void;
  dismissToast: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => 0,
  updateToast: () => {},
  dismissToast: () => {},
});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "info", duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => {
      const next = [...prev, { id, message, type, duration }];
      return next.slice(-4); // keep max 4 stacked
    });
    return id;
  }, []);

  const updateToast = useCallback((id: number, message: string, type: ToastType = "success") => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, message, type } : t))
    );
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, updateToast, dismissToast }}>
      {children}
      {/* Toast container - Sonner stacked floating pill bottom right */}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col-reverse gap-2 pointer-events-none pb-safe max-w-[calc(100vw-3rem)]">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={dismissToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function Toast({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: number) => void }) {
  const duration = toast.duration || 3500;
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(1);
  const startTimeRef = useRef(Date.now());
  const remainingTimeRef = useRef(duration);

  useEffect(() => {
    if (toast.type === "loading") return;

    startTimeRef.current = Date.now();
    let animId: number;

    const step = () => {
      if (!isPaused) {
        const elapsed = Date.now() - startTimeRef.current;
        const currentRemaining = Math.max(0, remainingTimeRef.current - elapsed);
        const fraction = currentRemaining / duration;
        setProgress(fraction);
        if (currentRemaining <= 0) {
          onDismiss(toast.id);
          return;
        }
      }
      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [toast.id, toast.type, duration, isPaused, onDismiss]);

  const handleMouseEnter = () => {
    if (toast.type === "loading") return;
    setIsPaused(true);
    remainingTimeRef.current -= Date.now() - startTimeRef.current;
  };

  const handleMouseLeave = () => {
    if (toast.type === "loading") return;
    setIsPaused(false);
    startTimeRef.current = Date.now();
  };

  const styles: Record<ToastType, string> = {
    success: "bg-white/95 text-slate-900 border-slate-200/80 dark:bg-zinc-900/95 dark:text-white dark:border-zinc-800/80 shadow-2xl",
    error: "bg-red-600/95 text-white border-red-700 shadow-2xl",
    loading: "bg-white/95 text-slate-900 border-indigo-200 dark:bg-zinc-900/95 dark:text-white dark:border-indigo-900/60 shadow-2xl",
    info: "bg-neutral-900/95 text-white border-neutral-800 shadow-2xl",
  };

  return (
    <div
      className={`pointer-events-auto relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium border backdrop-blur-md shadow-xl transition-all duration-200 animate-in fade-in slide-in-from-bottom-3 overflow-hidden ${styles[toast.type]}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="alert"
    >
      {toast.type === "success" && (
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
          ✓
        </span>
      )}
      {toast.type === "error" && (
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20 text-white text-xs font-bold">
          ✕
        </span>
      )}
      {toast.type === "loading" && (
        <span className="flex h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent dark:border-indigo-400 dark:border-t-transparent" />
      )}
      {toast.type === "info" && (
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-800 text-neutral-300 text-xs font-bold">
          ℹ
        </span>
      )}

      <span className="leading-snug pr-2 text-xs font-semibold select-none max-w-[280px] truncate">
        {toast.message}
      </span>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDismiss(toast.id);
        }}
        className="ml-auto text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
        aria-label="Close"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {toast.type !== "loading" && (
        <div
          className={`absolute bottom-0 left-0 h-[2.5px] w-full origin-left transition-transform duration-75 ${
            toast.type === "error" ? "bg-white/40" : "bg-emerald-500"
          }`}
          style={{ transform: `scaleX(${progress})` }}
        />
      )}
    </div>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
