"use client";

import { Icon } from "@/lib/iconify";

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
      <div className="relative w-[min(28rem,calc(100vw-2rem))] rounded-2xl border border-border bg-subtle p-4 sm:p-6 shadow-2xl space-y-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
            <Icon icon="lucide:trash-2" className="w-5 h-5 shrink-0" aria-hidden="true" />
          </div>
          <div className="space-y-1 min-w-0 flex-1">
            <h2 className="text-base font-bold text-foreground">Remove Member?</h2>
            <p className="text-xs text-muted leading-relaxed">
              Are you sure you want to remove <span className="font-semibold text-foreground break-all">{member.email}</span> from this workspace? They will immediately lose access to all captures and team discussions.
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
                <Icon icon="lucide:loader-2" className="w-3.5 h-3.5 animate-spin text-white shrink-0" aria-hidden="true" />
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
