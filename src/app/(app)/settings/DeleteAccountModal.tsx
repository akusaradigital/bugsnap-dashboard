"use client";

import { useT } from "@/components/I18nProvider";

import { Icon } from "@/lib/iconify";

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  deleting: boolean;
}

export function DeleteAccountModal({
  isOpen,
  onClose,
  onConfirm,
  deleting,
}: DeleteAccountModalProps) {
  const { t } = useT();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="alertdialog" aria-modal="true" aria-labelledby="delete-account-title">
      <button
        className="absolute inset-0 bg-black/50 backdrop-blur-xs"
        aria-label={t("common.close")}
        onClick={() => !deleting && onClose()}
      />
      <div className="relative w-[min(28rem,calc(100vw-2rem))] max-w-md rounded-2xl border border-border bg-subtle p-6 shadow-2xl space-y-4">
        <div className="text-center space-y-1.5 pt-1">
          <h2 id="delete-account-title" className="text-base font-bold text-foreground break-words">
            {t("settings.deleteAccountModalTitle")}
          </h2>
          <p className="text-xs text-muted leading-relaxed text-balance break-words">
            {t("settings.deleteAccountModalDesc")}
          </p>
        </div>

        <div className="rounded-xl border border-rose-200/80 dark:border-rose-900/40 bg-rose-50/60 dark:bg-rose-950/20 p-3 text-xs text-center text-rose-700 dark:text-rose-300 text-balance">
          <span className="font-semibold">{t("settings.deleteAccountIrreversibleLabel")}</span> {t("settings.deleteAccountIrreversibleDesc")}
        </div>

        <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-border/50">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="w-full inline-flex items-center justify-center whitespace-nowrap px-3.5 py-2.5 text-xs font-semibold text-foreground border border-border bg-background hover:bg-subtle rounded-xl transition-colors disabled:opacity-50 select-none cursor-pointer"
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="w-full inline-flex items-center justify-center whitespace-nowrap px-3.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-semibold transition-colors disabled:opacity-50 gap-1.5 shadow-xs select-none cursor-pointer"
          >
            {deleting ? (
              <>
                <Icon icon="lucide:loader-2" className="w-3.5 h-3.5 animate-spin text-white shrink-0 brightness-0 invert" aria-hidden="true" />
                <span>{t("settings.deletingAccount")}</span>
              </>
            ) : (
              <span>{t("settings.deleteAccountConfirmBtn")}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
