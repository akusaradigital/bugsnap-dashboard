"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { SiteNavbar } from "@/components/site/SiteNavbar";
import { SiteFooter } from "@/components/site/SiteFooter";
import { useT } from "@/components/I18nProvider";
import { getBlogPost, blogPosts, type BlogPost } from "@/content/blog";
import { BlogBottomBanner } from "@/components/blog/BlogBottomBanner";

interface HeadingItem {
  id: string;
  text: string;
}

const PROSE_CLASSES = [
  // Headings with scroll-mt for sticky header offset
  "[&_h2]:scroll-mt-28 [&_h2]:text-xl [&_h2]:sm:text-2xl [&_h2]:font-bold [&_h2]:text-site-text [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:tracking-tight",
  "[&_h3]:scroll-mt-28 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-site-text [&_h3]:mt-6 [&_h3]:mb-3",
  // Paragraphs
  "[&_p]:text-site-text-2 [&_p]:leading-relaxed [&_p]:mb-5 [&_p]:text-sm [&_p]:sm:text-base",
  // Lists
  "[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-6 [&_ul]:text-site-text-2 [&_ul]:space-y-2.5 [&_ul]:text-sm [&_ul]:sm:text-base [&_ul>li::marker]:text-site-accent",
  "[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-6 [&_ol]:text-site-text-2 [&_ol]:space-y-2.5 [&_ol]:text-sm [&_ol]:sm:text-base [&_ol>li::marker]:text-site-accent [&_ol>li::marker]:font-semibold",
  "[&_li]:text-site-text-2 [&_li]:leading-relaxed",
  // Inline Code & Pre blocks
  "[&_code]:bg-site-surface-2 [&_code]:text-site-text [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:sm:text-sm [&_code]:font-mono [&_code]:border [&_code]:border-site-border-subtle",
  "[&_pre]:bg-site-surface-2 [&_pre]:border [&_pre]:border-site-border [&_pre]:rounded-xl [&_pre]:p-4 [&_pre]:overflow-x-auto [&_pre]:font-mono [&_pre]:text-xs [&_pre]:sm:text-sm [&_pre]:my-6",
  // Typography accents
  "[&_strong]:text-site-text [&_strong]:font-bold",
  "[&_a]:text-site-accent [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-site-accent/80 [&_a]:font-medium",
  // Engineering QA Blockquotes with left accent border and clean styling
  "[&_blockquote]:border-l-4 [&_blockquote]:border-site-accent [&_blockquote]:bg-site-surface-2/60 [&_blockquote]:py-3 [&_blockquote]:pl-4 [&_blockquote]:pr-4 [&_blockquote]:rounded-r-xl [&_blockquote]:text-site-text-2 [&_blockquote]:my-6 [&_blockquote]:text-sm [&_blockquote]:sm:text-base [&_blockquote]:font-medium",
].join(" ");

export function BlogPostContent({ slug }: { slug: string }) {
  const post = getBlogPost(slug);
  const { t, locale } = useT();
  const isId = locale === "id";

  const [scrollPercent, setScrollPercent] = useState(0);
  const [activeHeadingId, setActiveHeadingId] = useState<string>("");

  const title = (isId && post?.titleId) || post?.title || "";
  const rawContent = (isId && post?.contentId) || post?.content || "";

  // Dynamically extract h2 headings and inject corresponding IDs for smooth scrolling
  const { processedHtml, headings } = useMemo(() => {
    if (!rawContent) return { processedHtml: "", headings: [] };
    const items: HeadingItem[] = [];
    const slugCounts: Record<string, number> = {};

    const html = rawContent.replace(
      /<h2([^>]*)>(.*?)<\/h2>/gi,
      (_, attrs: string, rawHeadingText: string) => {
        const cleanText = rawHeadingText.replace(/<[^>]+>/g, "").trim();
        let headingId = cleanText
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");
        if (!headingId) headingId = "section";

        if (slugCounts[headingId]) {
          slugCounts[headingId]++;
          headingId = `${headingId}-${slugCounts[headingId]}`;
        } else {
          slugCounts[headingId] = 1;
        }

        items.push({ id: headingId, text: cleanText });
        return `<h2 id="${headingId}"${attrs}>${rawHeadingText}</h2>`;
      }
    );

    return { processedHtml: html, headings: items };
  }, [rawContent]);

  // Window scroll handler: Reading progress bar + active ToC heading detection
  useEffect(() => {
    const handleScroll = () => {
      const doc = document.documentElement;
      const totalScrollable = doc.scrollHeight - window.innerHeight;
      if (totalScrollable > 0) {
        const scrolled = (window.scrollY / totalScrollable) * 100;
        setScrollPercent(Math.min(100, Math.max(0, scrolled)));
      } else {
        setScrollPercent(0);
      }

      if (headings.length > 0) {
        let currentActive = "";
        for (const heading of headings) {
          const el = document.getElementById(heading.id);
          if (el) {
            const rect = el.getBoundingClientRect();
            // Active if heading top has reached within 220px of the viewport top
            if (rect.top <= 220) {
              currentActive = heading.id;
            } else {
              break;
            }
          }
        }
        if (currentActive) {
          setActiveHeadingId(currentActive);
        } else if (headings[0]) {
          setActiveHeadingId(headings[0].id);
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [headings]);

  // Smart Related Articles: Match tags, sort newest first, exclude current post
  const relatedPosts = useMemo(() => {
    if (!post) return [];
    return blogPosts
      .filter((p: BlogPost) => p.slug !== post.slug)
      .map((p) => {
        const matchScore = p.tags.filter((tag) => post.tags.includes(tag)).length;
        return { post: p, matchScore };
      })
      .sort((a, b) => {
        if (b.matchScore !== a.matchScore) {
          return b.matchScore - a.matchScore;
        }
        return new Date(b.post.date).getTime() - new Date(a.post.date).getTime();
      })
      .map((item) => item.post)
      .slice(0, 2);
  }, [post]);

  if (!post) return null;

  const siteUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://bugsnap.akusaraproject.my.id";

  const scrollToHeading = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      setActiveHeadingId(id);
      if (typeof window !== "undefined") {
        window.history.pushState(null, "", `#${id}`);
      }
    }
  };

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
      {/* 1. Reading Progress Bar (Fixed top-0, height h-1, accent color, strictly no icons) */}
      <div
        className="fixed top-0 left-0 right-0 h-1 z-50 pointer-events-none bg-transparent"
        aria-hidden="true"
      >
        <div
          className="h-full bg-site-accent transition-[width] duration-150 ease-out"
          style={{ width: `${scrollPercent}%` }}
        />
      </div>

      <SiteNavbar />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="flex-1 relative">
        {/* Ambient Top Glow Background (Contained glow, no overflow-hidden on main content to preserve sticky ToC) */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[480px] overflow-hidden -z-0 opacity-25">
          <div
            className="absolute inset-0"
            style={{
              background: [
                "radial-gradient(ellipse 60% 50% at 15% 0%, var(--glow-primary), transparent 65%)",
                "radial-gradient(ellipse 45% 40% at 90% 10%, var(--glow-secondary), transparent 60%)",
              ].join(", "),
            }}
          />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 pt-8 pb-12 sm:pt-12 sm:pb-16">
          {/* Desktop 2-Column Layout: Article Column (Header + Image + Prose) + Sticky Table of Contents */}
          <div className="flex flex-col xl:flex-row xl:items-start xl:gap-12 justify-center">
              {/* Article Main Column (Title, Cover Image, and Prose aligned to exact same max-w-3xl width) */}
              <article className="flex-1 min-w-0 max-w-3xl w-full">
                {/* Breadcrumb */}
                <nav
                  aria-label="breadcrumb"
                  className="mb-6 inline-flex items-center gap-1.5 text-xs text-site-text-2 max-w-full"
                >
                  <Link
                    href="/"
                    className="shrink-0 hover:text-site-text transition-colors"
                  >
                    {t("landing.home") || "Home"}
                  </Link>
                  <span className="text-site-text-2/40 shrink-0" aria-hidden="true">
                    ›
                  </span>
                  <Link
                    href="/blog"
                    className="shrink-0 hover:text-site-text transition-colors"
                  >
                    {t("blog.title") || "Blog"}
                  </Link>
                  <span className="text-site-text-2/40 shrink-0" aria-hidden="true">
                    ›
                  </span>
                  <span className="text-site-text truncate max-w-[140px] xs:max-w-[200px] sm:max-w-none font-medium">
                    {title}
                  </span>
                </nav>

                <header className="space-y-4 mb-8">
                  <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-site-text leading-tight break-words">
                    {title}
                  </h1>

                  {/* Author & Date metadata row */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm text-site-text-2 pt-1">
                    <div className="flex items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/logo-day.svg"
                        alt="BugSnap"
                        className="w-5 h-5 object-contain shrink-0 dark:hidden"
                      />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/logo-dark.svg"
                        alt="BugSnap"
                        className="w-5 h-5 object-contain shrink-0 hidden dark:block"
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

                {/* Featured Cover Image Banner (Aligned to exact same width as article text) */}
                {post.coverImage && (
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
                  </div>
                )}

                {/* Article Prose Content (Pure CSS Styling, No Icons) */}
              <div
                className={`${PROSE_CLASSES} break-words`}
                dangerouslySetInnerHTML={{ __html: processedHtml }}
              />

              {/* Navigation back */}
              <div className="mt-14 pt-8 border-t border-site-border space-y-8">
                <div className="flex items-center justify-between">
                  <Link
                    href="/blog"
                    className="inline-flex items-center gap-1.5 py-2 text-xs font-bold text-site-accent hover:underline touch-manipulation"
                  >
                    {t("blog.backToBlog") || "← Back to Blog"}
                  </Link>
                </div>

                {/* Mobile & Tablet Related Articles (visible only below xl breakpoint) */}
                {relatedPosts.length > 0 && (
                  <div className="xl:hidden space-y-4 pt-4 border-t border-site-border">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-site-text">
                        {t("blog.relatedPosts") || "Related Articles"}
                      </h4>
                      <Link
                        href="/blog"
                        className="text-xs font-semibold text-site-accent hover:underline"
                      >
                        {t("blog.allArticles") || "All Articles"} →
                      </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {relatedPosts.map((op: BlogPost) => {
                        const opTitle = (isId && op.titleId) || op.title;
                        return (
                          <Link
                            key={op.slug}
                            href={`/blog/${op.slug}`}
                            className="group flex flex-col justify-between bg-site-surface border border-site-border hover:border-site-accent/40 rounded-xl overflow-hidden transition-colors shadow-xs"
                          >
                            <div className="relative w-full aspect-[16/9] bg-site-surface-2 overflow-hidden border-b border-site-border-subtle shrink-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={op.coverImage || "/opengraph-image.png"}
                                alt={opTitle}
                                onError={(e) => {
                                  e.currentTarget.src = "/opengraph-image.png";
                                }}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                            <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-[11px] text-site-text-2">
                                  <time dateTime={op.date} className="tabular-nums">
                                    {new Date(op.date + "T00:00:00").toLocaleDateString(
                                      isId ? "id-ID" : "en-US",
                                      {
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric",
                                      }
                                    )}
                                  </time>
                                  <span className="px-2 py-0.5 rounded bg-site-surface-2 border border-site-border-subtle font-medium">
                                    {op.readTime}
                                  </span>
                                </div>
                                <h5 className="text-xs sm:text-sm font-bold text-site-text group-hover:text-site-accent transition-colors line-clamp-2 leading-snug">
                                  {opTitle}
                                </h5>
                              </div>

                              <div className="pt-2 text-[11px] font-semibold text-site-accent">
                                {t("blog.readMore") || "Read"} →
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </article>

            {/* Desktop Sticky Sidebar: Table of Contents + Related Articles (Strictly NO Icons) */}
            {(headings.length > 0 || relatedPosts.length > 0) && (
              <aside className="hidden xl:block w-72 sticky top-28 self-start shrink-0 space-y-4">
                {headings.length > 0 && (
                  <div className="rounded-xl border border-site-border bg-site-surface-2/40 p-4 space-y-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-site-text-2">
                      {t("blog.tableOfContents") || "Table of Contents"}
                    </div>
                    <nav className="space-y-1 text-xs">
                      {headings.map((h) => {
                        const isActive = activeHeadingId === h.id;
                        return (
                          <a
                            key={h.id}
                            href={`#${h.id}`}
                            onClick={(e) => {
                              e.preventDefault();
                              scrollToHeading(h.id);
                            }}
                            className={`block py-1.5 pl-2.5 border-l-2 transition-colors break-words leading-snug ${
                              isActive
                                ? "border-site-accent text-site-accent font-semibold bg-site-accent/5 rounded-r"
                                : "border-transparent text-site-text-2 hover:text-site-text hover:border-site-border"
                            }`}
                          >
                            {h.text}
                          </a>
                        );
                      })}
                    </nav>
                  </div>
                )}

                {/* Related Articles Card in Sidebar */}
                {relatedPosts.length > 0 && (
                  <div className="rounded-xl border border-site-border bg-site-surface-2/40 p-4 space-y-3">
                    <div className="flex items-center justify-between pb-1 border-b border-site-border-subtle">
                      <div className="text-xs font-bold uppercase tracking-wider text-site-text-2">
                        {t("blog.relatedPosts") || "Related Articles"}
                      </div>
                      <Link
                        href="/blog"
                        className="text-[11px] font-semibold text-site-accent hover:underline"
                      >
                        {t("blog.allArticles") || "All"} →
                      </Link>
                    </div>

                    <div className="space-y-3">
                      {relatedPosts.map((op: BlogPost) => {
                        const opTitle = (isId && op.titleId) || op.title;
                        return (
                          <Link
                            key={op.slug}
                            href={`/blog/${op.slug}`}
                            className="group block rounded-lg border border-site-border bg-site-surface hover:border-site-accent/40 overflow-hidden transition-colors shadow-2xs"
                          >
                            <div className="relative w-full aspect-[16/9] bg-site-surface-2 overflow-hidden border-b border-site-border-subtle shrink-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={op.coverImage || "/opengraph-image.png"}
                                alt={opTitle}
                                onError={(e) => {
                                  e.currentTarget.src = "/opengraph-image.png";
                                }}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                            <div className="p-3 space-y-1.5">
                              <div className="flex items-center justify-between text-[10px] text-site-text-2">
                                <time dateTime={op.date} className="tabular-nums">
                                  {new Date(op.date + "T00:00:00").toLocaleDateString(
                                    isId ? "id-ID" : "en-US",
                                    { month: "short", day: "numeric", year: "numeric" }
                                  )}
                                </time>
                                <span className="font-medium text-site-accent">
                                  {op.readTime}
                                </span>
                              </div>
                              <h5 className="text-xs font-bold text-site-text group-hover:text-site-accent transition-colors line-clamp-2 leading-snug">
                                {opTitle}
                              </h5>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </aside>
            )}
          </div>

          {/* Unified Bottom Subscription & Promotion Banner (DomaiNesia-style Split Card) */}
          <BlogBottomBanner />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
