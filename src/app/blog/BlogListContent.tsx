"use client";

import Link from "next/link";
import { StaticShell } from "@/components/StaticShell";
import { useT } from "@/components/I18nProvider";
import { blogPosts, type BlogPost } from "@/content/blog";
import { Reveal } from "@/components/site/motion/Reveal";
import { IconCheck } from "@/components/site/TablerIcons";

export function BlogListContent() {
  const { t, locale } = useT();
  const isId = locale === "id";

  return (
    <StaticShell
      title={t("blog.title") || "Engineering & Bug Reporting Insights"}
      subtitle={
        t("blog.subtitle") ||
        "Practical guides on bug reporting, DevTools diagnostics, screen recording, and developer productivity."
      }
    >
      <div className="space-y-12 sm:space-y-16 font-site">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-site-border pb-4">
          <div>
            <span className="text-xs font-bold tracking-widest uppercase text-site-accent">
              {t("blog.badge") || "BugSnap Blog"}
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-site-text tracking-tight mt-1">
              {t("blog.allArticles") || "All Articles"}
            </h2>
          </div>
          <span className="text-xs text-site-text-2">
            {blogPosts.length} {isId ? "artikel dipublikasikan" : "articles published"}
          </span>
        </div>

        {/* Post Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch">
          {blogPosts.map((post: BlogPost, index: number) => {
            const title = (isId && post.titleId) || post.title;
            const description = (isId && post.descriptionId) || post.description;

            return (
              <Reveal key={post.slug} delay={index * 0.06} className="h-full">
                <article className="flex flex-col h-full bg-site-surface border border-site-border rounded-2xl overflow-hidden shadow-sm min-w-0">
                  {/* Cover Image Container (Static, no hover transforms) */}
                  <Link
                    href={`/blog/${post.slug}`}
                    className="relative block w-full aspect-[16/9] bg-site-surface-2 overflow-hidden border-b border-site-border shrink-0"
                    tabIndex={-1}
                    aria-hidden="true"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={post.coverImage || "/opengraph-image.png"}
                      alt={title}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = "/opengraph-image.png";
                      }}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-xs text-[11px] font-medium text-white border border-white/10">
                      <span>{post.readTime}</span>
                    </div>
                  </Link>

                  {/* Body Content */}
                  <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2.5">
                      {/* Meta: Date & First tag */}
                      <div className="flex items-center justify-between text-xs text-site-text-2 gap-2">
                        <time dateTime={post.date} className="tabular-nums">
                          {new Date(post.date).toLocaleDateString(
                            isId ? "id-ID" : "en-US",
                            { year: "numeric", month: "short", day: "numeric" }
                          )}
                        </time>
                        {post.tags[0] && (
                          <span className="text-[11px] px-2 py-0.5 rounded bg-site-surface-2 text-site-text-2 font-medium border border-site-border-subtle">
                            #{post.tags[0]}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="text-base sm:text-lg font-bold text-site-text line-clamp-2 leading-snug">
                        <Link
                          href={`/blog/${post.slug}`}
                          className="hover:text-site-accent transition-colors"
                        >
                          {title}
                        </Link>
                      </h3>

                      {/* Description snippet */}
                      <p className="text-xs sm:text-sm text-site-text-2 line-clamp-3 leading-relaxed">
                        {description}
                      </p>
                    </div>

                    {/* Footer: Author & Direct CTA */}
                    <div className="pt-4 border-t border-site-border-subtle flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/icon.svg"
                          alt="BugSnap"
                          className="w-5 h-5 object-contain shrink-0"
                        />
                        <span className="text-xs font-medium text-site-text-2 truncate">
                          {post.author}
                        </span>
                      </div>

                      <Link
                        href={`/blog/${post.slug}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-site-accent hover:underline shrink-0"
                      >
                        {t("blog.readMore") || "Read"} →
                      </Link>
                    </div>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>

        {/* Soft Call to Action banner at the bottom of blog list */}
        <Reveal delay={0.3}>
          <div className="relative overflow-hidden rounded-2xl border border-site-border bg-gradient-to-br from-site-surface via-site-surface to-site-surface-2 p-6 sm:p-10 shadow-sm max-w-4xl mx-auto">
            {/* Subtle ambient corner glow */}
            <div
              className="pointer-events-none absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-40 blur-2xl"
              style={{
                background: "radial-gradient(circle, var(--glow-primary), transparent 70%)",
              }}
            />

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center text-left">
              {/* Left Column: Copy & CTAs */}
              <div className="md:col-span-7 space-y-4 min-w-0">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-site-accent/10 border border-site-accent/20 text-[11px] font-bold uppercase tracking-wider text-site-accent">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/icons/chrome.svg" alt="" aria-hidden="true" className="w-3.5 h-3.5 shrink-0" />
                  <span>BugSnap Chrome Extension</span>
                </div>

                <h3 className="text-xl sm:text-2xl font-extrabold text-site-text tracking-tight leading-snug">
                  {t("blog.ctaTitle") || "Ready to streamline your bug reports?"}
                </h3>

                <p className="text-xs sm:text-sm text-site-text-2 leading-relaxed">
                  {t("blog.ctaDesc") ||
                    "Record screens with audio, capture console & network logs, and store files directly in your own Google Drive."}
                </p>

                {/* Feature Highlights Pills */}
                <ul className="space-y-1.5 text-xs text-site-text font-medium pt-1">
                  <li className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <IconCheck size={11} strokeWidth={3} />
                    </span>
                    <span>{isId ? "Rekam layar & mikrofon instan" : "Screen & audio recording"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <IconCheck size={11} strokeWidth={3} />
                    </span>
                    <span>{isId ? "Tangkap log console & network otomatis" : "Console & network DevTools capture"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <IconCheck size={11} strokeWidth={3} />
                    </span>
                    <span>{isId ? "Tersimpan aman di Google Drive Anda" : "Direct Google Drive file storage"}</span>
                  </li>
                </ul>

                {/* Action Buttons */}
                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <a
                    href="https://chromewebstore.google.com/detail/klbgjodcbhopcjpfehjkbgofjdelohlf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-slate-900 text-xs font-bold transition-all shadow-sm shadow-accent/25 text-center"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/icons/chrome.svg" alt="" aria-hidden="true" className="w-4 h-4 shrink-0" />
                    <span>{t("blog.ctaButton") || "Install Extension — Free"}</span>
                  </a>
                  <Link
                    href="/features"
                    className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl border border-site-border bg-site-surface hover:bg-site-surface-2 text-site-text text-xs font-semibold transition-all text-center"
                  >
                    <span>{t("landing.exploreFeatures") || "Explore Features"}</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>

              {/* Right Column: Visual Product Widget Mockup */}
              <div className="md:col-span-5 min-w-0">
                <div className="rounded-xl border border-site-border bg-site-surface-2/80 p-4 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-site-border-subtle">
                    <div className="flex items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/icon.svg" alt="BugSnap" className="w-5 h-5 object-contain shrink-0" />
                      <span className="text-xs font-bold text-site-text">BugSnap</span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Active
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-site-surface border border-site-border-subtle flex items-center justify-between">
                      <span className="text-site-text-2 flex items-center gap-1.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/icons/monitor.svg" alt="" aria-hidden="true" className="w-3.5 h-3.5 opacity-70 shrink-0" />
                        <span>Capture</span>
                      </span>
                      <span className="font-mono text-[11px] font-semibold text-site-text">1080p · 60fps</span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-site-surface border border-site-border-subtle flex items-center justify-between">
                      <span className="text-site-text-2 flex items-center gap-1.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/icons/google.svg" alt="" aria-hidden="true" className="w-3.5 h-3.5 shrink-0" />
                        <span>Storage</span>
                      </span>
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Google Drive</span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-site-surface border border-site-border-subtle flex items-center justify-between">
                      <span className="text-site-text-2 flex items-center gap-1.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/icons/browser.svg" alt="" aria-hidden="true" className="w-3.5 h-3.5 opacity-70 shrink-0" />
                        <span>Telemetry</span>
                      </span>
                      <span className="text-[11px] font-semibold text-site-accent">Console + Network</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-center text-site-text-2/70 pt-1">
                    {isId ? "100% Gratis · Milik data Anda sendiri" : "100% Free · You own your data"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </StaticShell>
  );
}
