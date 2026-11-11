"use client";

import Link from "next/link";
import { useT } from "@/components/I18nProvider";
import { Icon } from "@/lib/iconify";

interface InProgressViewProps {
  featureName?: string;
  customTitle?: string;
  customDesc?: string;
  backHref?: string;
  backLabel?: string;
}

export function InProgressView({
  featureName,
  customTitle,
  customDesc,
  backHref = "/",
  backLabel,
}: InProgressViewProps) {
  const { t } = useT();

  const baseTitle = t("inProgress.title");
  const title = customTitle || (featureName ? `${featureName} -${baseTitle}` : baseTitle);
  const desc = customDesc || t("inProgress.desc");
  const resolvedBackLabel = backLabel || t("inProgress.backHome");

  return (
    <div className="w-full flex flex-col items-center justify-center py-12 sm:py-20 px-4 sm:px-6">
      <div className="w-full max-w-2xl mx-auto flex flex-col items-center text-center min-w-0">
        {/* Central Visual Card */}
        <div className="relative mb-8 group">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xl flex items-center justify-center p-3 relative z-10 transition-transform group-hover:scale-105 duration-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-day.svg"
              alt="BugSnap"
              width={56}
              height={56}
              className="w-12 h-12 sm:w-14 sm:h-14 object-contain dark:hidden"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-dark.svg"
              alt="BugSnap"
              width={56}
              height={56}
              className="w-12 h-12 sm:w-14 sm:h-14 object-contain hidden dark:block"
            />
          </div>
          {/* Subtle Ambient Glow */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-emerald-500/20 rounded-2xl blur-xl -z-0 pointer-events-none"
          />
        </div>

        {/* Headline */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-site-text max-w-xl leading-tight mb-4 break-words">
          {title}
        </h1>

        {/* Description */}
        <p className="text-sm sm:text-base text-site-text-2 max-w-lg leading-relaxed mb-8 break-words">
          {desc}
        </p>

        {/* Free Forever Banner Notice */}
        <div className="w-full max-w-lg rounded-xl border border-border bg-subtle/70 p-4 mb-8 text-left flex items-start gap-3 shadow-xs min-w-0">
          <Icon
            icon="lucide:check-circle-2"
            className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            <h2 className="text-xs font-bold text-foreground uppercase tracking-wide mb-0.5">
              {t("inProgress.statusActive")}
            </h2>
            <p className="text-xs text-muted leading-relaxed break-words">
              {t("inProgress.freeNotice")}
            </p>
          </div>
        </div>

        {/* Responsive Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto min-w-0">
          <Link
            href={backHref}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#89BD49] hover:bg-[#6B9A35] active:scale-[0.99] text-white text-xs sm:text-sm font-semibold shadow-xs hover:shadow-md shadow-[#89BD49]/25 transition-all duration-150"
          >
            
            <span className="truncate">{resolvedBackLabel}</span>
          </Link>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-border hover:bg-subtle text-foreground text-xs sm:text-sm font-semibold transition-colors"
          >
            <Icon icon="lucide:layout-dashboard" className="w-4 h-4 shrink-0 text-muted" aria-hidden="true" />
            <span className="truncate">{t("inProgress.goToDashboard")}</span>
          </Link>
          <Link
            href="/docs"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-border hover:bg-subtle text-foreground text-xs sm:text-sm font-semibold transition-colors"
          >
            <Icon icon="lucide:file-text" className="w-4 h-4 shrink-0 text-muted" aria-hidden="true" />
            <span className="truncate">{t("inProgress.exploreDocs")}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
