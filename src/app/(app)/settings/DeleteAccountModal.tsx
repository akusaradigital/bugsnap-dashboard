"use client";

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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button
        className="absolute inset-0 bg-black/40 backdrop-blur-xs"
        aria-label="Close"
        onClick={() => !deleting && onClose()}
      />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-subtle p-6 shadow-2xl space-y-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="space-y-1 min-w-0 flex-1">
            <h2 className="text-base font-bold text-foreground">Delete BugSnap Account?</h2>
            <p className="text-xs text-muted leading-relaxed">
              Are you sure you want to permanently delete your account? All your recordings, captures, workspace memberships, and personal data will be completely erased.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-red-200/80 dark:border-red-900/40 bg-red-50/60 dark:bg-red-950/20 p-3.5 text-xs text-red-700 dark:text-red-300">
          <span className="font-semibold">Irreversible:</span> This action cannot be undone or recovered later.
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="px-4 py-2 text-xs font-semibold text-foreground hover:bg-border/30 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
          >
            {deleting ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Deleting…</span>
              </>
            ) : (
              <span>Yes, delete account</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
