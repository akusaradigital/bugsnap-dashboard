"use client";

import Link from "next/link";
import { SiteNavbar } from "@/components/site/SiteNavbar";
import { SiteFooter } from "@/components/site/SiteFooter";
import { useT } from "@/components/I18nProvider";
import { getBlogPost, blogPosts, type BlogPost } from "@/content/blog";
import { Reveal } from "@/components/site/motion/Reveal";
import { IconCheck } from "@/components/site/TablerIcons";

const PROSE_CLASSES = [
  "[&_h2]:text-xl [&_h2]:sm:text-2xl [&_h2]:font-bold [&_h2]:text-site-text [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:tracking-tight",
  "[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-site-text [&_h3]:mt-6 [&_h3]:mb-3",
  "[&_p]:text-site-text-2 [&_p]:leading-relaxed [&_p]:mb-5 [&_p]:text-sm [&_p]:sm:text-base",
  "[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-6 [&_ul]:text-site-text-2 [&_ul]:space-y-2 [&_ul]:text-sm [&_ul]:sm:text-base",
  "[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-6 [&_ol]:text-site-text-2 [&_ol]:space-y-2 [&_ol]:text-sm [&_ol]:sm:text-base",
  "[&_li]:text-site-text-2 [&_li]:leading-relaxed",
  "[&_code]:bg-site-surface-2 [&_code]:text-site-text [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:sm:text-sm [&_code]:font-mono [&_code]:border [&_code]:border-site-border-subtle",
  "[&_strong]:text-site-text [&_strong]:font-bold",
  "[&_a]:text-site-accent [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-site-accent/80 [&_a]:font-medium",
  "[&_blockquote]:border-l-4 [&_blockquote]:border-site-accent [&_blockquote]:bg-site-surface-2/40 [&_blockquote]:py-2 [&_blockquote]:pl-4 [&_blockquote]:pr-3 [&_blockquote]:rounded-r-lg [&_blockquote]:italic [&_blockquote]:text-site-text-2 [&_blockquote]:my-6",
].join(" ");

export function BlogPostContent({ slug }: { slug: string }) {
  const post = getBlogPost(slug);
  const { t, locale } = useT();
  const isId = locale === "id";

  if (!post) return null;

  const title = (isId && post.titleId) || post.title;
  const content = (isId && post.contentId) || post.content;
  const siteUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://bugsnap.akusaraproject.my.id";

  const otherPosts = blogPosts
    .filter((p: BlogPost) => p.slug !== post.slug)
    .slice(0, 2);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    image: post.coverImage || post.ogImage || `${siteUrl}/opengraph-image.png`,
    datePublished: post.date,
    author: { "@type": "Organization", name: post.author },
    publisher: {
      "@type": "Organization",
      name: "BugSnap",
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/icon.svg`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${siteUrl}/blog/${post.slug}`,
    },
  };

  return (
    <div className="min-h-screen bg-site-surface text-site-text font-site flex flex-col">
      <SiteNavbar />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="flex-1">
        {/* Ambient Top Glow Header */}
        <div className="relative overflow-hidden border-b border-site-border">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: [
                "radial-gradient(ellipse 60% 55% at 10% 0%, var(--glow-primary), transparent 65%)",
                "radial-gradient(ellipse 45% 40% at 95% 15%, var(--glow-secondary), transparent 60%)",
              ].join(", "),
            }}
          />

          <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 pt-10 pb-12 sm:pt-14 sm:pb-16">
            <Reveal delay={0}>
              {/* Breadcrumb */}
              <nav
                aria-label="breadcrumb"
                className="mb-6 inline-flex items-center gap-1.5 text-xs text-site-text-2 max-w-full"
              >
                <Link href="/" className="shrink-0 hover:text-site-text transition-colors">
                  {t("landing.home") || "Home"}
                </Link>
                <span className="text-site-text-2/40 shrink-0" aria-hidden="true">›</span>
                <Link href="/blog" className="shrink-0 hover:text-site-text transition-colors">
                  {t("blog.title") || "Blog"}
                </Link>
                <span className="text-site-text-2/40 shrink-0" aria-hidden="true">›</span>
                <span className="text-site-text truncate max-w-[140px] xs:max-w-[200px] sm:max-w-none font-medium">
                  {title}
                </span>
              </nav>
            </Reveal>

            <Reveal delay={0.06}>
              <header className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold tracking-widest uppercase text-site-accent px-2.5 py-0.5 rounded-full bg-site-accent/10 border border-site-accent/20">
                    {t("blog.badge") || "BugSnap Blog"}
                  </span>
                  {post.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="text-[11px] px-2 py-0.5 rounded-md bg-site-surface-2 text-site-text-2 font-medium border border-site-border-subtle"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-site-text leading-tight">
                  {title}
                </h1>

                {/* Author & Date metadata row */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm text-site-text-2 pt-2">
                  <div className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/icon.svg"
                      alt="BugSnap"
                      className="w-5 h-5 object-contain shrink-0"
                    />
                    <span className="font-semibold text-site-text">
                      {post.author}
                    </span>
                  </div>
                  <span className="text-site-text-2/40">·</span>
                  <time dateTime={post.date} className="tabular-nums">
                    {new Date(post.date).toLocaleDateString(
                      isId ? "id-ID" : "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </time>
                  <span className="text-site-text-2/40">·</span>
                  <span>{post.readTime}</span>
                </div>
              </header>
            </Reveal>
          </div>
        </div>

        {/* Featured Cover Image & Article Body */}
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 sm:py-12">
          {/* Featured Cover Image Banner (Solid, no hover transform) */}
          {post.coverImage && (
            <Reveal delay={0.1}>
              <div className="mb-10 rounded-2xl border border-site-border overflow-hidden bg-site-surface-2 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.coverImage}
                  alt={title}
                  onError={(e) => {
                    e.currentTarget.src = "/opengraph-image.png";
                  }}
                  className="w-full aspect-[16/9] object-cover"
                />
                <div className="px-4 py-2 bg-site-surface border-t border-site-border flex items-center justify-between text-[11px] text-site-text-2">
                  <span>{t("blog.freeLicense") || "Free License Photo"} · Unsplash</span>
                  <span className="tabular-nums">16:9 HD</span>
                </div>
              </div>
            </Reveal>
          )}

          {/* Article Prose Content */}
          <article className="max-w-3xl mx-auto">
            <Reveal delay={0.15}>
              <div
                className={`${PROSE_CLASSES} break-words`}
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </Reveal>

            {/* Soft CTA Box to Install Extension */}
            <Reveal delay={0.25}>
              <div className="mt-10 relative overflow-hidden rounded-2xl border border-site-border bg-gradient-to-br from-site-surface via-site-surface to-site-surface-2 p-6 sm:p-8 shadow-sm">
                {/* Subtle ambient corner glow */}
                <div
                  className="pointer-events-none absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-40 blur-2xl"
                  style={{
                    background: "radial-gradient(circle, var(--glow-primary), transparent 70%)",
                  }}
                />

                <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
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

            {/* Navigation back and Other Articles */}
            <div className="mt-14 pt-8 border-t border-site-border space-y-8">
              <div className="flex items-center justify-between">
                <Link
                  href="/blog"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-site-accent hover:underline"
                >
                  {t("blog.backToBlog") || "← Back to Blog"}
                </Link>
              </div>

              {/* Other Articles Recommendation (Static Cards) */}
              {otherPosts.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-site-text">
                    {isId ? "Artikel Terkait" : "Related Articles"}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {otherPosts.map((op: BlogPost) => {
                      const opTitle = (isId && op.titleId) || op.title;
                      return (
                        <Link
                          key={op.slug}
                          href={`/blog/${op.slug}`}
                          className="flex flex-col bg-site-surface border border-site-border rounded-xl p-4 shadow-sm"
                        >
                          <span className="text-[11px] text-site-text-2 mb-1">
                            {op.readTime}
                          </span>
                          <h5 className="text-xs sm:text-sm font-bold text-site-text line-clamp-2 hover:text-site-accent transition-colors">
                            {opTitle}
                          </h5>
                          <span className="text-[11px] font-semibold text-site-accent mt-3">
                            {t("blog.readMore") || "Read"} →
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </article>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
