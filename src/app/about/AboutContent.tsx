"use client";

import { StaticShell } from "@/components/StaticShell";
import { useT } from "@/components/I18nProvider";
import { IconLock, IconWorld, IconShieldCheck, IconFolder } from "@/components/site/TablerIcons";
import { Reveal } from "@/components/site/motion";

export function AboutContent() {
  const { t } = useT();

  const pillars = [
    {
      title: "Data Sovereignty by Design",
      desc: "We believe your diagnostic captures and screen recordings belong to you, not your tools vendor. Every video and screenshot is uploaded directly to your own Google Drive. No proprietary lock-in.",
      icon: <IconFolder size={20} className="text-site-accent" />,
    },
    {
      title: "Zero-Knowledge Architecture",
      desc: "Our backend never stores your video streams, console logs, or customer data. Everything stays within your authorized Google Drive infrastructure, protected by Google's enterprise security.",
      icon: <IconShieldCheck size={20} className="text-site-accent" />,
    },
    {
      title: "Built by Developers, for Teams",
      desc: "Created by Akusara Digital in Indonesia, BugSnap was born from the frustration of vague bug reports and endless 'can you reproduce it?' Slack threads. We build the tool we wanted to use every day.",
      icon: <IconWorld size={20} className="text-site-accent" />,
    },
    {
      title: "Privacy First",
      desc: "Automated sensitive data blurring ensures passwords, tokens, and PII are redacted before captures leave your screen. Compliance-ready for GDPR and SOC 2 teams.",
      icon: <IconLock size={20} className="text-site-accent" />,
    },
  ];

  return (
    <StaticShell
      title={t("about.title") || "About BugSnap"}
      subtitle={
        t("about.subtitle") ||
        "We're on a mission to eliminate vague bug reports and give engineering teams their time back."
      }
    >
      <div className="space-y-16">
        {/* Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {pillars.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.08}>
              <div className="h-full rounded-2xl border border-site-border bg-gradient-to-b from-site-surface to-site-surface-2/60 p-6 sm:p-8 space-y-3 shadow-sm">
                <div className="p-2.5 w-fit rounded-xl bg-site-accent/10 border border-site-accent/20">
                  {p.icon}
                </div>
                <h3 className="text-xl font-bold text-site-text">{p.title}</h3>
                <p className="text-sm text-site-text-2 leading-relaxed">{p.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Story Section */}
        <Reveal delay={0.3}>
          <div className="rounded-3xl border border-site-border bg-site-surface-2/50 p-8 sm:p-12 space-y-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-site-accent">
              Our Philosophy
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-site-text">
              The Best Bug Report is One That Fixes Itself
            </h2>
            <p className="text-sm sm:text-base text-site-text-2 leading-relaxed">
              When a developer gets a bug report with a screen recording, synchronized console errors, and exact network request payloads, the debugging phase takes minutes instead of hours. No back-and-forth questions. No waiting for staging deployments. Just pure, focused problem-solving.
            </p>
          </div>
        </Reveal>
      </div>
    </StaticShell>
  );
}
