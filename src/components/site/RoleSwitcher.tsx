"use client";

import { useT } from "@/components/I18nProvider";
import { Icon } from "@/lib/iconify";

export function RoleSwitcher() {
  const { t } = useT();

  const roles = [
    {
      key: "qa",
      badge: t("site.roles.qa.badge"),
      tag: t("site.roles.qa.tag"),
      icon: "lucide:flask-conical",
      pain: t("site.roles.qa.pain"),
      title: t("site.roles.qa.title"),
      desc: t("site.roles.qa.desc"),
      bullets: [
        t("site.roles.qa.p1"),
        t("site.roles.qa.p2"),
        t("site.roles.qa.p3"),
      ],
      metric: t("site.roles.qa.metric"),
      highlight: "from-site-surface to-site-surface hover:border-site-border-focus",
    },
    {
      key: "dev",
      badge: t("site.roles.dev.badge"),
      tag: t("site.roles.dev.tag"),
      icon: "lucide:code-2",
      pain: t("site.roles.dev.pain"),
      title: t("site.roles.dev.title"),
      desc: t("site.roles.dev.desc"),
      bullets: [
        t("site.roles.dev.p1"),
        t("site.roles.dev.p2"),
        t("site.roles.dev.p3"),
      ],
      metric: t("site.roles.dev.metric"),
      highlight: "from-site-surface to-site-surface hover:border-site-border-focus",
    },
    {
      key: "pm",
      badge: t("site.roles.pm.badge"),
      tag: t("site.roles.pm.tag"),
      icon: "lucide:clipboard-list",
      pain: t("site.roles.pm.pain"),
      title: t("site.roles.pm.title"),
      desc: t("site.roles.pm.desc"),
      bullets: [
        t("site.roles.pm.p1"),
        t("site.roles.pm.p2"),
        t("site.roles.pm.p3"),
      ],
      metric: t("site.roles.pm.metric"),
      highlight: "from-site-surface to-site-surface hover:border-site-border-focus",
    },
  ];

  const workflowSteps = [
    {
      step: "01",
      role: t("site.roles.loop.s1"),
      sub: t("site.roles.loop.s1Sub"),
      icon: "lucide:video",
    },
    {
      step: "02",
      role: t("site.roles.loop.s2"),
      sub: t("site.roles.loop.s2Sub"),
      icon: "lucide:database",
    },
    {
      step: "03",
      role: t("site.roles.loop.s3"),
      sub: t("site.roles.loop.s3Sub"),
      icon: "lucide:terminal",
    },
    {
      step: "04",
      role: t("site.roles.loop.s4"),
      sub: t("site.roles.loop.s4Sub"),
      icon: "lucide:check-circle-2",
    },
  ];

  return (
    <div className="w-full space-y-6 sm:space-y-8 font-site">
      {/* 3 Simple, Hook-Driven Role Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 items-stretch">
        {roles.map((role, idx) => (
          <div
            key={role.key}
            className="group relative rounded-2xl border border-site-border bg-site-surface p-4 sm:p-6 flex flex-col justify-between shadow-xs hover:shadow-md hover:border-accent/40 transition-all duration-200 min-w-0"
          >
            <div className="space-y-4">
              {/* Header: Role Identity & Tag */}
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-site-border-subtle">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0">
                    <Icon icon={role.icon} className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-site-text truncate">
                      {role.badge}
                    </h3>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-md bg-site-surface-2 border border-site-border text-site-text-2 shrink-0">
                  {role.tag}
                </span>
              </div>

              {/* The Hook: The Old Pain Quote */}
              <div className="p-3 rounded-xl border border-red-500/15 bg-red-500/5 dark:bg-red-500/10 space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <span>{t("site.roles.oldWay")}</span>
                </div>
                <p className="text-xs text-site-text-2 italic leading-relaxed line-through decoration-red-500/40">
                  &ldquo;{role.pain}&rdquo;
                </p>
              </div>

              {/* The Solution: Punchy Value Headline & Description */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-accent">
                  <Icon icon="lucide:sparkles" className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{t("site.roles.withBugSnap")}</span>
                </div>
                <h4 className="text-base sm:text-lg font-bold text-site-text tracking-tight leading-snug">
                  {role.title}
                </h4>
                <p className="text-xs text-site-text-2 leading-relaxed">
                  {role.desc}
                </p>
              </div>

              {/* 3 Clean Value Bullets */}
              <ul className="space-y-2.5 pt-2 text-xs text-site-text">
                {role.bullets.map((bullet, bIdx) => (
                  <li key={bIdx} className="flex items-start gap-2.5">
                    <span className="w-4 h-4 rounded-full bg-accent/15 text-accent flex items-center justify-center shrink-0 mt-0.5">
                      <Icon icon="lucide:check" className="w-2.5 h-2.5" aria-hidden="true" />
                    </span>
                    <span className="leading-relaxed">{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Bottom Outcome Metric */}
            <div className="mt-6 pt-3.5 border-t border-site-border-subtle flex items-center justify-between gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 text-site-text font-semibold truncate">
                <Icon icon="lucide:zap" className="w-3.5 h-3.5 text-accent shrink-0" aria-hidden="true" />
                <span className="truncate">{role.metric}</span>
              </span>
              <span className="text-[10px] font-mono font-bold text-site-text-2 bg-site-surface-2 px-1.5 py-0.5 rounded border border-site-border-subtle shrink-0">
                0{idx + 1}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Seamless Workflow Strip (Simple, Clean 4-Step Connection) */}
      <div className="rounded-2xl border border-site-border bg-site-surface/80 p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-site-border-subtle">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-accent">
              {t("site.roles.loop.badge")}
            </span>
            <h4 className="text-sm sm:text-base font-bold text-site-text">
              {t("site.roles.loop.title")}
            </h4>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{t("site.roles.loop.live")}</span>
          </span>
        </div>

        {/* 4 Connected Process Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
          {workflowSteps.map((ws) => (
            <div
              key={ws.step}
              className="rounded-xl border border-site-border-subtle bg-site-surface-2/60 p-3.5 space-y-1.5 min-w-0"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-accent">
                  {ws.step} /
                </span>
                <span className="w-5 h-5 rounded-md bg-accent/10 text-accent flex items-center justify-center">
                  <Icon icon={ws.icon} className="w-3 h-3 shrink-0" aria-hidden="true" />
                </span>
              </div>
              <h5 className="text-xs font-bold text-site-text truncate">
                {ws.role}
              </h5>
              <p className="text-[11px] text-site-text-2 leading-relaxed truncate">
                {ws.sub}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
