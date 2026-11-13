"use client";

import { useState, useEffect } from "react";
import { useT } from "@/components/I18nProvider";

interface ArticleShareBarProps {
  slug: string;
  title: string;
  description?: string;
  variant?: "top" | "bottom" | "sidebar";
}

export function ArticleShareBar({
  slug,
  title,
  description,
  variant = "top",
}: ArticleShareBarProps) {
  const { t } = useT();
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    const origin =
      typeof window !== "undefined" && window.location.origin
        ? window.location.origin
        : "https://bugsnap.akusaraproject.my.id";
    setShareUrl(`${origin}/blog/${slug}`);

    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      setCanNativeShare(true);
    }
  }, [slug]);

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = shareUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Ignore copy error
    }
  };

  const handleNativeShare = async () => {
    if (!canNativeShare || !shareUrl) return;
    try {
      await navigator.share({
        title,
        text: description || title,
        url: shareUrl,
      });
    } catch {
      // User cancelled or share failed
    }
  };

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    title
  )}&url=${encodeURIComponent(shareUrl)}`;

  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
    shareUrl
  )}`;

  const redditUrl = `https://reddit.com/submit?url=${encodeURIComponent(
    shareUrl
  )}&title=${encodeURIComponent(title)}`;

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `${title} - ${shareUrl}`
  )}`;

  // 1. Sidebar Variant (Clean compact card in desktop sidebar)
  if (variant === "sidebar") {
    return (
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-xs space-y-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
          {t("shareFx.shareArticleCaps")}
        </span>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <a
            href={twitterUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={t("nonAdminFx.shareOnX")}
            className="flex items-center gap-2 p-2 rounded-xl border border-slate-200/80 dark:border-slate-700/80 hover:border-slate-400 dark:hover:border-slate-500 text-slate-700 dark:text-slate-200 hover:text-black dark:hover:text-white transition-all hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium"
          >
            <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            <span className="truncate">{t("nonAdminFx.shareXPost")}</span>
          </a>

          <a
            href={linkedInUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={t("nonAdminFx.shareOnLinkedIn")}
            className="flex items-center gap-2 p-2 rounded-xl border border-slate-200/80 dark:border-slate-700/80 hover:border-sky-500 text-slate-700 dark:text-slate-200 hover:text-sky-600 dark:hover:text-sky-400 transition-all hover:bg-sky-50/50 dark:hover:bg-sky-950/20 font-medium"
          >
            <svg className="w-3.5 h-3.5 fill-current shrink-0 text-sky-600 dark:text-sky-400" viewBox="0 0 24 24">
              <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
            </svg>
            <span className="truncate">{t("nonAdminFx.shareLinkedIn")}</span>
          </a>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={t("nonAdminFx.shareOnWhatsApp")}
            className="flex items-center gap-2 p-2 rounded-xl border border-slate-200/80 dark:border-slate-700/80 hover:border-emerald-500 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 font-medium"
          >
            <svg className="w-3.5 h-3.5 fill-current shrink-0 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24">
              <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.19-.09-1.1-.54-1.27-.6-.17-.06-.3-.09-.42.09-.12.19-.48.6-.59.72-.11.12-.23.14-.42.05-.19-.09-.81-.3-1.54-.95-.57-.51-.95-1.14-1.06-1.33-.11-.19-.01-.29.08-.38.08-.08.19-.23.29-.34.09-.12.12-.19.19-.32.06-.12.03-.23-.02-.32-.05-.09-.42-1.02-.58-1.39-.15-.37-.31-.32-.42-.32h-.36c-.12 0-.32.05-.49.23-.17.19-.65.64-.65 1.56 0 .93.67 1.82.77 1.94.09.12 1.33 2.03 3.22 2.85.45.19.8.31 1.07.4.45.14.86.12 1.18.07.36-.05 1.1-.45 1.26-.88.15-.43.15-.8.11-.88-.05-.08-.18-.13-.37-.22" />
            </svg>
            <span className="truncate">{t("nonAdminFx.shareWhatsApp")}</span>
          </a>

          <a
            href={redditUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={t("nonAdminFx.shareOnReddit")}
            className="flex items-center gap-2 p-2 rounded-xl border border-slate-200/80 dark:border-slate-700/80 hover:border-orange-500 text-slate-700 dark:text-slate-200 hover:text-orange-600 dark:hover:text-orange-400 transition-all hover:bg-orange-50/50 dark:hover:bg-orange-950/20 font-medium"
          >
            <svg className="w-3.5 h-3.5 fill-current shrink-0 text-orange-600 dark:text-orange-400" viewBox="0 0 24 24">
              <path d="M12 2A10 10 0 0 0 2 12a10 10 0 0 0 10 10 10 10 0 0 0 10-10A10 10 0 0 0 12 2m5.01 4.74c.6 0 1.09.49 1.09 1.09a1.09 1.09 0 0 1-1.09 1.09c-.4 0-.75-.22-.94-.55-.95.45-2.04.75-3.23.82l.64-3.03 2.11.45c.08.7.67 1.22 1.42 1.13m-10.02 6.42a1.5 1.5 0 0 1 1.5-1.5c.38 0 .72.15.98.39 1.12-.73 2.62-1.2 4.29-1.25l.8-3.77 3.03.65c.18-.45.62-.77 1.14-.77.69 0 1.25.56 1.25 1.25s-.56 1.25-1.25 1.25c-.53 0-.98-.33-1.16-.8l-2.61-.56-.66 3.12c1.61.07 3.05.54 4.13 1.25.26-.23.6-.37.97-.37a1.5 1.5 0 0 1 1.5 1.5c0 .6-.35 1.12-.87 1.36.03.22.05.44.05.67 0 2.4-2.8 4.35-6.25 4.35s-6.25-1.95-6.25-4.35c0-.23.02-.45.05-.67-.52-.24-.87-.76-.87-1.36m3.52 1.25c-.41 0-.75.34-.75.75s.34.75.75.75.75-.34.75-.75-.34-.75-.75-.75m6.98 2.82c-.88.88-2.54.95-3.48.95s-2.6-.07-3.48-.95c-.14-.14-.14-.38 0-.53.15-.14.39-.14.53 0 .68.67 2.05.74 2.95.74s2.27-.07 2.95-.74c.15-.14.39-.14.54 0 .14.15.14.39-.01.53m-1.98-2.07c-.41 0-.75.34-.75.75s.34.75.75.75.75-.34.75-.75-.34-.75-.75-.75" />
            </svg>
            <span className="truncate">{t("nonAdminFx.shareReddit")}</span>
          </a>
        </div>

        <button
          type="button"
          onClick={handleCopyLink}
          className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all cursor-pointer active:scale-[0.99]"
        >
          {copied ? (
            <>
              <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-emerald-700 dark:text-emerald-300 font-bold">
                {t("shareFx.linkCopied")}
              </span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              <span>{t("shareFx.copyArticleLink")}</span>
            </>
          )}
        </button>
      </div>
    );
  }

  // 2. Bottom Callout Card Variant (Rich banner at the end of article)
  if (variant === "bottom") {
    return (
      <div className="my-10 p-6 sm:p-7 rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/40 backdrop-blur-sm space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <h4 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
              {t("shareFx.valuableQ")}
            </h4>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {t("shareFx.valuableDesc")}
            </p>
          </div>

          {canNativeShare && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="sm:hidden self-start inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span>{t("shareFx.shareShort")}</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 pt-1">
          {/* X / Twitter */}
          <a
            href={twitterUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:border-slate-400 dark:hover:border-slate-500 text-xs font-semibold transition-all hover:scale-105 shadow-2xs"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            <span>{t("nonAdminFx.postOnX")}</span>
          </a>

          {/* LinkedIn */}
          <a
            href={linkedInUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:border-sky-500 text-xs font-semibold transition-all hover:scale-105 shadow-2xs"
          >
            <svg className="w-3.5 h-3.5 fill-current text-sky-600 dark:text-sky-400" viewBox="0 0 24 24">
              <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
            </svg>
            <span>{t("nonAdminFx.shareLinkedIn")}</span>
          </a>

          {/* WhatsApp */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:border-emerald-500 text-xs font-semibold transition-all hover:scale-105 shadow-2xs"
          >
            <svg className="w-3.5 h-3.5 fill-current text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24">
              <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.19-.09-1.1-.54-1.27-.6-.17-.06-.3-.09-.42.09-.12.19-.48.6-.59.72-.11.12-.23.14-.42.05-.19-.09-.81-.3-1.54-.95-.57-.51-.95-1.14-1.06-1.33-.11-.19-.01-.29.08-.38.08-.08.19-.23.29-.34.09-.12.12-.19.19-.32.06-.12.03-.23-.02-.32-.05-.09-.42-1.02-.58-1.39-.15-.37-.31-.32-.42-.32h-.36c-.12 0-.32.05-.49.23-.17.19-.65.64-.65 1.56 0 .93.67 1.82.77 1.94.09.12 1.33 2.03 3.22 2.85.45.19.8.31 1.07.4.45.14.86.12 1.18.07.36-.05 1.1-.45 1.26-.88.15-.43.15-.8.11-.88-.05-.08-.18-.13-.37-.22" />
            </svg>
            <span>{t("nonAdminFx.shareWhatsApp")}</span>
          </a>

          {/* Reddit */}
          <a
            href={redditUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:border-orange-500 text-xs font-semibold transition-all hover:scale-105 shadow-2xs"
          >
            <svg className="w-3.5 h-3.5 fill-current text-orange-600 dark:text-orange-400" viewBox="0 0 24 24">
              <path d="M12 2A10 10 0 0 0 2 12a10 10 0 0 0 10 10 10 10 0 0 0 10-10A10 10 0 0 0 12 2m5.01 4.74c.6 0 1.09.49 1.09 1.09a1.09 1.09 0 0 1-1.09 1.09c-.4 0-.75-.22-.94-.55-.95.45-2.04.75-3.23.82l.64-3.03 2.11.45c.08.7.67 1.22 1.42 1.13m-10.02 6.42a1.5 1.5 0 0 1 1.5-1.5c.38 0 .72.15.98.39 1.12-.73 2.62-1.2 4.29-1.25l.8-3.77 3.03.65c.18-.45.62-.77 1.14-.77.69 0 1.25.56 1.25 1.25s-.56 1.25-1.25 1.25c-.53 0-.98-.33-1.16-.8l-2.61-.56-.66 3.12c1.61.07 3.05.54 4.13 1.25.26-.23.6-.37.97-.37a1.5 1.5 0 0 1 1.5 1.5c0 .6-.35 1.12-.87 1.36.03.22.05.44.05.67 0 2.4-2.8 4.35-6.25 4.35s-6.25-1.95-6.25-4.35c0-.23.02-.45.05-.67-.52-.24-.87-.76-.87-1.36m3.52 1.25c-.41 0-.75.34-.75.75s.34.75.75.75.75-.34.75-.75-.34-.75-.75-.75m6.98 2.82c-.88.88-2.54.95-3.48.95s-2.6-.07-3.48-.95c-.14-.14-.14-.38 0-.53.15-.14.39-.14.53 0 .68.67 2.05.74 2.95.74s2.27-.07 2.95-.74c.15-.14.39-.14.54 0 .14.15.14.39-.01.53m-1.98-2.07c-.41 0-.75.34-.75.75s.34.75.75.75.75-.34.75-.75-.34-.75-.75-.75" />
            </svg>
            <span>{t("nonAdminFx.shareReddit")}</span>
          </a>

          {/* Copy Link Button */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:border-slate-400 dark:hover:border-slate-500 text-xs font-semibold transition-all hover:scale-105 shadow-2xs cursor-pointer active:scale-95"
          >
            {copied ? (
              <>
                <svg className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-emerald-700 dark:text-emerald-300 font-bold">
                  {t("shareFx.copiedShort")}
                </span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                <span>{t("shareFx.copyLinkShort")}</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // 3. Top Inline Variant (Under author/date metadata)
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-3 border-y border-slate-200/70 dark:border-slate-800/80 mb-6 text-xs text-slate-500 dark:text-slate-400">
      <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
        <svg className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        <span>{t("shareFx.shareColon")}</span>
      </div>

      <div className="flex items-center gap-1.5">
        {/* X / Twitter */}
        <a
          href={twitterUrl}
          target="_blank"
          rel="noopener noreferrer"
          title={t("nonAdminFx.shareXShort")}
          className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
        >
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </a>

        {/* LinkedIn */}
        <a
          href={linkedInUrl}
          target="_blank"
          rel="noopener noreferrer"
          title={t("nonAdminFx.shareOnLinkedIn")}
          className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 hover:border-sky-500 text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/20 transition-all"
        >
          <svg className="w-3.5 h-3.5 fill-current text-sky-600 dark:text-sky-400" viewBox="0 0 24 24">
            <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
          </svg>
        </a>

        {/* WhatsApp */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          title={t("nonAdminFx.shareOnWhatsApp")}
          className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all"
        >
          <svg className="w-3.5 h-3.5 fill-current text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24">
            <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.19-.09-1.1-.54-1.27-.6-.17-.06-.3-.09-.42.09-.12.19-.48.6-.59.72-.11.12-.23.14-.42.05-.19-.09-.81-.3-1.54-.95-.57-.51-.95-1.14-1.06-1.33-.11-.19-.01-.29.08-.38.08-.08.19-.23.29-.34.09-.12.12-.19.19-.32.06-.12.03-.23-.02-.32-.05-.09-.42-1.02-.58-1.39-.15-.37-.31-.32-.42-.32h-.36c-.12 0-.32.05-.49.23-.17.19-.65.64-.65 1.56 0 .93.67 1.82.77 1.94.09.12 1.33 2.03 3.22 2.85.45.19.8.31 1.07.4.45.14.86.12 1.18.07.36-.05 1.1-.45 1.26-.88.15-.43.15-.8.11-.88-.05-.08-.18-.13-.37-.22" />
          </svg>
        </a>

        {/* Reddit */}
        <a
          href={redditUrl}
          target="_blank"
          rel="noopener noreferrer"
          title={t("nonAdminFx.shareOnReddit")}
          className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 hover:border-orange-500 text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-all"
        >
          <svg className="w-3.5 h-3.5 fill-current text-orange-600 dark:text-orange-400" viewBox="0 0 24 24">
            <path d="M12 2A10 10 0 0 0 2 12a10 10 0 0 0 10 10 10 10 0 0 0 10-10A10 10 0 0 0 12 2m5.01 4.74c.6 0 1.09.49 1.09 1.09a1.09 1.09 0 0 1-1.09 1.09c-.4 0-.75-.22-.94-.55-.95.45-2.04.75-3.23.82l.64-3.03 2.11.45c.08.7.67 1.22 1.42 1.13m-10.02 6.42a1.5 1.5 0 0 1 1.5-1.5c.38 0 .72.15.98.39 1.12-.73 2.62-1.2 4.29-1.25l.8-3.77 3.03.65c.18-.45.62-.77 1.14-.77.69 0 1.25.56 1.25 1.25s-.56 1.25-1.25 1.25c-.53 0-.98-.33-1.16-.8l-2.61-.56-.66 3.12c1.61.07 3.05.54 4.13 1.25.26-.23.6-.37.97-.37a1.5 1.5 0 0 1 1.5 1.5c0 .6-.35 1.12-.87 1.36.03.22.05.44.05.67 0 2.4-2.8 4.35-6.25 4.35s-6.25-1.95-6.25-4.35c0-.23.02-.45.05-.67-.52-.24-.87-.76-.87-1.36m3.52 1.25c-.41 0-.75.34-.75.75s.34.75.75.75.75-.34.75-.75-.34-.75-.75-.75m6.98 2.82c-.88.88-2.54.95-3.48.95s-2.6-.07-3.48-.95c-.14-.14-.14-.38 0-.53.15-.14.39-.14.53 0 .68.67 2.05.74 2.95.74s2.27-.07 2.95-.74c.15-.14.39-.14.54 0 .14.15.14.39-.01.53m-1.98-2.07c-.41 0-.75.34-.75.75s.34.75.75.75.75-.34.75-.75-.34-.75-.75-.75" />
          </svg>
        </a>

        {/* Copy Link Button */}
        <button
          type="button"
          onClick={handleCopyLink}
          title={t("shareFx.copyArticleLink")}
          className="h-8 px-2.5 rounded-lg flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all font-medium cursor-pointer active:scale-95"
        >
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-emerald-700 dark:text-emerald-300 font-bold text-[11px]">
                {t("shareFx.copiedShort")}
              </span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              <span className="text-[11px]">{t("shareFx.copyLinkShort")}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
