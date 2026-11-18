"use client";

interface ConnectDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: () => void;
  loading: boolean;
  driveStatus: "connected" | "reconnect_required" | "not_connected";
  driveError: string | null;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

export function ConnectDriveModal({
  isOpen,
  onClose,
  onConnect,
  loading,
  driveStatus,
  driveError,
  t,
}: ConnectDriveModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="connect-drive-title">
      <button className="absolute inset-0 bg-black/50 backdrop-blur-xs" aria-label={t("common.close")} onClick={() => !loading && onClose()} />
      <div className="relative w-[min(28rem,calc(100vw-2rem))] max-w-md rounded-2xl border border-border bg-subtle p-6 shadow-2xl space-y-5">
        <div className="text-center space-y-1.5 pt-1">
          <h2 id="connect-drive-title" className="text-base font-bold text-foreground break-words">{t("settings.connectDriveQ")}</h2>
          <p className="text-xs text-muted leading-relaxed text-balance break-words">{t("settings.connectDriveDesc")}</p>
        </div>
        {driveError && <p className="text-xs text-rose-600 dark:text-rose-400 text-center">{driveError}</p>}
        <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-border/50">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-full inline-flex items-center justify-center whitespace-nowrap px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs font-semibold text-foreground hover:bg-subtle disabled:opacity-50 transition-colors cursor-pointer select-none"
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={onConnect}
            disabled={loading}
            className="w-full inline-flex items-center justify-center whitespace-nowrap px-3.5 py-2.5 rounded-xl bg-[#89BD49] hover:bg-[#6B9A35] active:bg-[#5B852B] text-white text-xs font-semibold shadow-xs disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer select-none"
          >
            {loading ? t("settings.connecting") : driveStatus === "reconnect_required" ? t("settings.reconnectGoogle") : t("settings.continueToGoogle")}
          </button>
        </div>
      </div>
    </div>
  );
}
