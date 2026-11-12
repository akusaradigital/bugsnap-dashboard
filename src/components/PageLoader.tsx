"use client";

interface PageLoaderProps {
  /** i18n-resolved message, e.g. t("layout.loading") or a page-specific string. */
  message: string;
}

/**
 * Shared full-area loading state: plain spinner + message, centered. One
 * version instead of every page inventing its own pill/card wrapper, so
 * "loading" looks the same everywhere in the app.
 */
export function PageLoader({ message }: PageLoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 min-h-[300px] py-12" role="status" aria-label={message}>
      <div className="h-7 w-7 rounded-full border-2 border-[#2563EB] border-t-transparent animate-spin" aria-hidden="true" />
      <p className="text-sm text-muted">{message}</p>
    </div>
  );
}
