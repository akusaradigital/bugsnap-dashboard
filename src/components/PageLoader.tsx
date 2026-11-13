"use client";

interface PageLoaderProps {
  /** i18n-resolved message, e.g. t("layout.loading") or a page-specific string. */
  message: string;
  /** Full-viewport variant used by app/admin shell gates. */
  fullScreen?: boolean;
}

/**
 * Shared loading state: one blue spinner + message everywhere in the app.
 * Use `fullScreen` for shell-level gates (auth/session), default for in-page areas.
 */
export function PageLoader({ message, fullScreen = false }: PageLoaderProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${
        fullScreen ? "min-h-screen bg-background" : "min-h-[300px] py-12"
      }`}
      role="status"
      aria-label={message}
    >
      <div className="h-7 w-7 rounded-full border-2 border-[#2563EB] border-t-transparent animate-spin" aria-hidden="true" />
      <p className="text-sm text-muted">{message}</p>
    </div>
  );
}
