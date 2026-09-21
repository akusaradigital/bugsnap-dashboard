"use client";

export interface MemberToRemove {
  user_id: string;
  email: string;
  role: string;
}

interface RemoveMemberModalProps {
  member: MemberToRemove | null;
  onClose: () => void;
  onConfirm: (member: MemberToRemove) => void;
  removingMemberId: string | null;
}

export function RemoveMemberModal({
  member,
  onClose,
  onConfirm,
  removingMemberId,
}: RemoveMemberModalProps) {
  if (!member) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button
        className="absolute inset-0 bg-black/40 backdrop-blur-xs"
        aria-label="Close"
        onClick={() => !removingMemberId && onClose()}
      />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-subtle p-6 shadow-2xl space-y-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <div className="space-y-1 min-w-0 flex-1">
            <h2 className="text-base font-bold text-foreground">Remove Member?</h2>
            <p className="text-xs text-muted leading-relaxed">
              Are you sure you want to remove <span className="font-semibold text-foreground">{member.email}</span> from this workspace? They will immediately lose access to all captures and team discussions.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            disabled={Boolean(removingMemberId)}
            className="px-4 py-2 text-xs font-semibold text-foreground hover:bg-border/30 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(member)}
            disabled={Boolean(removingMemberId)}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
          >
            {removingMemberId === member.user_id ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Removing…</span>
              </>
            ) : (
              <span>Remove member</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
