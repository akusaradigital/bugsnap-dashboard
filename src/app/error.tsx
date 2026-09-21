"use client";

import { useEffect } from "react";
import { useT } from "@/components/I18nProvider";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useT();

  useEffect(() => {
    console.error("BugSnap App Error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 dark:bg-rose-950/30 dark:border-rose-900/50 dark:text-rose-400">
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h2 className="text-base font-bold text-foreground">{t("error.title")}</h2>
      <p className="mt-1 max-w-sm text-xs text-muted">
        {error?.message || t("error.description")}
      </p>
      <div className="mt-5 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-lg bg-[#89BD49] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#6B9A35] shadow-sm shadow-[#89BD49]/25"
        >
          {t("error.tryAgain")}
        </button>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-lg border border-border bg-subtle px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-subtle/80"
        >
          {t("error.reload")}
        </button>
      </div>
    </div>
  );
}
