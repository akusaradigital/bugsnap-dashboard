"use client";

import { useState } from "react";
import { openPaddleCustomerPortal } from "@/lib/paddle";

interface RetentionModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

export function RetentionModal({
  isOpen,
  onClose,
  showToast,
  t,
}: RetentionModalProps) {
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs" role="dialog" aria-modal="true">
      <button className="absolute inset-0 bg-transparent" aria-label="Close" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 flex items-center justify-center text-2xl mx-auto shadow-inner">
          🎁
        </div>
        <div className="text-center space-y-1.5">
          <h2 className="text-lg font-bold text-foreground">
            {t("settings.churnRetentionTitle")}
          </h2>
          <p className="text-xs text-muted leading-relaxed">
            {t("settings.churnRetentionOffer")}
          </p>
        </div>

        <div className="space-y-2.5 pt-2">
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText("SAVE50");
              setCopiedCode(true);
              showToast(t("upgrade.appliedCoupon", { coupon: "SAVE50" }) || "Code SAVE50 copied!", "success");
              setTimeout(() => {
                openPaddleCustomerPortal();
                onClose();
              }, 800);
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-[#89BD49] hover:bg-[#6B9A35] text-white font-bold text-xs shadow-xs shadow-[#89BD49]/25 transition-all flex items-center justify-center gap-2 active:scale-98"
          >
            <span>{copiedCode ? "✓ Copied SAVE50!" : t("settings.churnApplyCode")}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              showToast("Opening customer portal to pause your subscription...", "info");
              openPaddleCustomerPortal();
              onClose();
            }}
            className="w-full py-2 px-4 rounded-xl border border-border hover:bg-subtle text-foreground font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <span>⏸️</span>
            <span>{t("settings.churnPauseInstead")}</span>
          </button>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => {
                openPaddleCustomerPortal();
                onClose();
              }}
              className="text-[11px] text-muted hover:text-foreground transition-colors"
            >
              {t("settings.churnContinueCancel")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
