"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container - fixed bottom center, stacks vertically */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[200] flex flex-col-reverse gap-2 w-full max-w-sm px-4 pointer-events-none pb-safe">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function Toast({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: number) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 3500);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const styles: Record<ToastType, string> = {
    success: "bg-emerald-600 text-white",
    error: "bg-red-600 text-white",
    info: "bg-neutral-900 text-white",
  };

  const icons: Record<ToastType, string> = {
    success: "✓",
    error: "✕",
    info: "ℹ",
  };

  return (
    <div
      className={`pointer-events-auto flex items-center gap-2.5 rounded-lg px-4 py-3 text-sm font-medium shadow-lg animate-[slideIn_0.2s_ease-out] ${styles[toast.type]}`}
      onClick={() => onDismiss(toast.id)}
      role="alert"
    >
      <span className="shrink-0 text-base font-bold">{icons[toast.type]}</span>
      <span className="flex-1 leading-snug">{toast.message}</span>
    </div>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
