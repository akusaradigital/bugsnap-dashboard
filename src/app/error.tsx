"use client";

import { useEffect } from "react";
import { useT } from "@/components/I18nProvider";
import { Icon } from "@/lib/iconify";

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
        <Icon icon="lucide:alert-triangle" className="h-6 w-6 shrink-0" aria-hidden="true" />
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
