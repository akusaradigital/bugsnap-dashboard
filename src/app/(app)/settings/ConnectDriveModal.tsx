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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button className="absolute inset-0 bg-black/40" aria-label="Close" onClick={() => !loading && onClose()} />
      <div className="relative w-full max-w-sm rounded-xl border border-border bg-background p-6 shadow-xl">
        <h2 className="text-lg font-bold text-foreground">{t("settings.connectDriveQ")}</h2>
        <p className="text-sm text-muted mt-2">{t("settings.connectDriveDesc")}</p>
        {driveError && <p className="text-xs text-red-600 dark:text-red-400 mt-3">{driveError}</p>}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
          <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 text-sm font-medium text-foreground hover:bg-border/30 rounded-lg disabled:opacity-50">{t("common.cancel")}</button>
          <button type="button" onClick={onConnect} disabled={loading} className="px-4 py-2 rounded-lg bg-[#89BD49] text-white text-sm font-semibold hover:bg-[#6B9A35] shadow-xs shadow-[#89BD49]/25 disabled:opacity-50">{loading ? t("settings.connecting") : driveStatus === "reconnect_required" ? "Reconnect with Google" : t("settings.continueToGoogle")}</button>
        </div>
      </div>
    </div>
  );
}
