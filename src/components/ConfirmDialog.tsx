"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "@/lib/iconify";
import { useT } from "@/components/I18nProvider";

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Destructive actions get a red confirm button. */
  danger?: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

/**
 * Promise-based confirmation modal. Use `const confirm = useConfirm();` then
 * `if (!(await confirm({ title, danger: true }))) return;`.
 * Replaces window.confirm() so every destructive action looks the same.
 */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const { t } = useT();
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolverRef = useRef<((ok: boolean) => void) | null>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  const confirm = useCallback<ConfirmFn>((opts) => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setOptions(opts);
    });
  }, []);

  function close(ok: boolean) {
    resolverRef.current?.(ok);
    resolverRef.current = null;
    setOptions(null);
  }

  // Escape cancels; focus starts on the safe button for destructive prompts.
  useEffect(() => {
    if (!options) return;
    confirmBtnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {options && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => close(false)} aria-hidden="true" />
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby={options.message ? "confirm-desc" : undefined}
            className="relative w-full max-w-sm rounded-2xl border border-border bg-subtle shadow-2xl p-5 space-y-3"
          >
            <div className="flex items-start gap-3">
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                  options.danger
                    ? "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400"
                    : "bg-blue-50 text-[#2563EB] dark:bg-blue-950/30 dark:text-[#3B82F6]"
                }`}
              >
                <Icon icon="lucide:circle-alert" className="w-4.5 h-4.5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h2 id="confirm-title" className="text-sm font-bold text-foreground">
                  {options.title}
                </h2>
                {options.message && (
                  <p id="confirm-desc" className="mt-1 text-xs text-muted leading-relaxed">
                    {options.message}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => close(false)}
                className="px-3 py-2 rounded-lg border border-border bg-background text-xs font-semibold text-foreground hover:bg-subtle transition-colors cursor-pointer"
              >
                {options.cancelLabel ?? t("common.cancel")}
              </button>
              <button
                ref={confirmBtnRef}
                type="button"
                onClick={() => close(true)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold text-white transition-colors cursor-pointer ${
                  options.danger ? "bg-rose-600 hover:bg-rose-700" : "bg-[#2563EB] hover:bg-[#1D4ED8]"
                }`}
              >
                {options.confirmLabel ?? (options.danger ? t("common.delete") : t("common.confirm"))}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used inside <ConfirmProvider>");
  return ctx;
}
