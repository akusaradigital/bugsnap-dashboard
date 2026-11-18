"use client";

import { useT } from "@/components/I18nProvider";

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
  const { t } = useT();
  if (!member) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button
        className="absolute inset-0 bg-black/40 backdrop-blur-xs"
        aria-label={t("common.close")}
        onClick={() => !removingMemberId && onClose()}
      />
      <div className="relative w-[min(28rem,calc(100vw-2rem))] rounded-2xl border border-border bg-subtle p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="text-center space-y-1.5 pt-1">
          <h2 className="text-base font-bold text-foreground">{t("modalFx.removeMemberTitle")}</h2>
          <p className="text-xs text-muted leading-relaxed">
            Are you sure you want to remove <span className="font-semibold text-foreground break-all">{member.email}</span> from this workspace? They will immediately lose access to all captures and team discussions.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            disabled={Boolean(removingMemberId)}
            className="w-full inline-flex items-center justify-center px-3.5 py-2.5 text-xs font-semibold text-foreground border border-border bg-background hover:bg-subtle rounded-xl transition-colors disabled:opacity-50 select-none cursor-pointer"
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={() => onConfirm(member)}
            disabled={Boolean(removingMemberId)}
            className="w-full inline-flex items-center justify-center px-3.5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors disabled:opacity-50 gap-1.5 shadow-xs select-none cursor-pointer"
          >
            {removingMemberId === member.user_id ? (
              <>
                <Icon icon="lucide:loader-2" className="w-3.5 h-3.5 animate-spin text-white shrink-0 brightness-0 invert" aria-hidden="true" />
                <span>{t("modalFx.removingLabel")}</span>
              </>
            ) : (
              <span>{t("modalFx.removeMemberBtn")}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
