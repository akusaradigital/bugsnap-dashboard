"use client";

import { useT } from "@/components/I18nProvider";
import { Icon } from "@/lib/iconify";

export function RoleSwitcher() {
  const { t } = useT();

  const roles = [
    {
      key: "qa",
      kicker: t("site.roles.qa.badge"),
      headline: t("site.roles.qa.headline"),
      oldWay: t("site.roles.qa.oldWay"),
      subheading: t("site.roles.qa.title"),
      desc: t("site.roles.qa.desc"),
      bullets: [
        t("site.roles.qa.p1"),
        t("site.roles.qa.p2"),
        t("site.roles.qa.p3"),
      ],
    },
    {
      key: "dev",
      kicker: t("site.roles.dev.badge"),
      headline: t("site.roles.dev.headline"),
      oldWay: t("site.roles.dev.oldWay"),
      subheading: t("site.roles.dev.title"),
      desc: t("site.roles.dev.desc"),
      bullets: [
        t("site.roles.dev.p1"),
        t("site.roles.dev.p2"),
        t("site.roles.dev.p3"),
      ],
    },
    {
      key: "pm",
      kicker: t("site.roles.pm.badge"),
      headline: t("site.roles.pm.headline"),
      oldWay: t("site.roles.pm.oldWay"),
      subheading: t("site.roles.pm.title"),
      desc: t("site.roles.pm.desc"),
      bullets: [
        t("site.roles.pm.p1"),
        t("site.roles.pm.p2"),
        t("site.roles.pm.p3"),
      ],
    },
  ];

  const workflowSteps = [
    {
      num: 1,
      title: t("site.roles.loop.s1"),
      desc: t("site.roles.loop.s1Sub"),
    },
    {
      num: 2,
      title: t("site.roles.loop.s2"),
      desc: t("site.roles.loop.s2Sub"),
    },
    {
      num: 3,
      title: t("site.roles.loop.s3"),
      desc: t("site.roles.loop.s3Sub"),
    },
    {
      num: 4,
      title: t("site.roles.loop.s4"),
      desc: t("site.roles.loop.s4Sub"),
    },
  ];

  return (
    <div className="w-full font-site">
      {/* 3 Columns: QA & Testers, Software Engineers, Product Managers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10 items-stretch">
        {roles.map((role) => (
          <div key={role.key} className="flex flex-col min-w-0">
            {/* Keep the desktop comparison rows aligned across all roles. */}
            <div className="lg:min-h-[132px]">
              {/* Role Kicker */}
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                {role.kicker}
              </p>

              {/* Role Headline */}
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-950 dark:text-white tracking-tight leading-snug mb-5">
                {role.headline}
              </h3>
            </div>

            {/* Red / Pink Container: The Old Way */}
            <div className="lg:min-h-[132px] rounded-2xl bg-[#FFF5F5] dark:bg-red-950/25 border border-[#FED7D7]/70 dark:border-red-900/40 p-4 sm:p-5 mb-6">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-xs uppercase tracking-wider mb-2">
                <Icon icon="lucide:x" className="w-3.5 h-3.5 stroke-[3] shrink-0" aria-hidden="true" />
                <span>{t("site.roles.oldWay")}</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {role.oldWay}
              </p>
            </div>

            {/* Green Kicker: With BugSnap */}
            <div className="text-xs font-bold uppercase tracking-wider text-[#3D7A24] dark:text-[#72C048] mb-2">
              {t("site.roles.withBugSnap")}
            </div>

            {/* Solution Subheading */}
            <h4 className="text-base sm:text-lg font-bold text-slate-950 dark:text-white tracking-tight leading-snug mb-3">
              {role.subheading}
            </h4>

            {/* Solution Paragraph */}
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
              {role.desc}
            </p>

            {/* Bullet List with Green Checkmarks */}
            <ul className="space-y-3 mt-auto">
              {role.bullets.map((bullet, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-200">
                  <Icon icon="lucide:check" className="w-4 h-4 text-[#3D7A24] dark:text-[#72C048] stroke-[2.5] shrink-0 mt-0.5" aria-hidden="true" />
                  <span className="leading-snug">{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Direct Team Handoff Stepper */}
      <div className="border-t border-slate-100 dark:border-slate-800/80 pt-10 sm:pt-12 mt-12 sm:mt-16">
        <p className="text-xs sm:text-[13px] font-bold uppercase tracking-wider text-[#3D7A24] dark:text-[#72C048] mb-2">
          {t("site.roles.loop.badge")}
        </p>
        <h3 className="text-xl sm:text-2xl font-extrabold text-slate-950 dark:text-white tracking-tight mb-8">
          {t("site.roles.loop.title")}
        </h3>

        {/* 4 Connected Process Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:items-center lg:justify-between gap-6 lg:gap-2">
          {workflowSteps.map((step, idx) => (
            <div key={step.num} className="contents lg:flex lg:items-center lg:gap-4 min-w-0">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-full bg-[#EBF7E3] dark:bg-emerald-950/60 text-[#3D7A24] dark:text-emerald-400 font-extrabold text-sm flex items-center justify-center shrink-0">
                  {step.num}
                </div>
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-bold text-slate-950 dark:text-white truncate">
                    {step.title}
                  </div>
                  <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {step.desc}
                  </div>
                </div>
              </div>
              {idx < workflowSteps.length - 1 && (
                <span className="hidden lg:block text-slate-300 dark:text-slate-700 text-lg px-2 shrink-0 select-none" aria-hidden="true">
                  
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
