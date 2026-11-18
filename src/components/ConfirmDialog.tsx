"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useT } from "@/components/I18nProvider";

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Destructive actions get a red confirm button. */
  danger?: boolean;
  /** Optional icon identifier for backward compatibility. Icons are omitted for a clean centered layout. */
  icon?: string;
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
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={() => close(false)} aria-hidden="true" />
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby={options.message ? "confirm-desc" : undefined}
            className="relative w-[min(28rem,calc(100vw-2rem))] max-w-md rounded-2xl border border-border bg-subtle shadow-2xl p-6 space-y-4"
          >
            <div className="text-center space-y-1.5 pt-1">
              <h2 id="confirm-title" className="text-base font-bold text-foreground break-words">
                {options.title}
              </h2>
              {options.message && (
                <p id="confirm-desc" className="text-xs text-muted leading-relaxed text-balance break-words">
                  {options.message}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-border/50">
              <button
                type="button"
                onClick={() => close(false)}
                className="w-full inline-flex items-center justify-center whitespace-nowrap px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs font-semibold text-foreground hover:bg-subtle transition-colors cursor-pointer select-none"
              >
                {options.cancelLabel ?? t("common.cancel")}
              </button>
              <button
                ref={confirmBtnRef}
                type="button"
                onClick={() => close(true)}
                className={`w-full inline-flex items-center justify-center whitespace-nowrap px-3.5 py-2.5 rounded-xl text-xs font-semibold text-white transition-colors cursor-pointer shadow-xs select-none ${
                  options.danger ? "bg-rose-600 hover:bg-rose-700 active:bg-rose-800" : "bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1e40af]"
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
