"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { SiteNavbar } from "@/components/site/SiteNavbar";
import { SiteFooter } from "@/components/site/SiteFooter";
import { useT } from "@/components/I18nProvider";
import { getBlogPost, blogPosts, type BlogPost } from "@/content/blog";
import { BlogBottomBanner } from "@/components/blog/BlogBottomBanner";
import { ArticleShareBar } from "@/components/blog/ArticleShareBar";

interface HeadingItem {
  id: string;
  text: string;
}

const PROSE_CLASSES = [
  // Headings
  "[&_h2]:scroll-mt-28 [&_h2]:text-2xl [&_h2]:sm:text-3xl [&_h2]:font-extrabold [&_h2]:text-slate-900 dark:[&_h2]:text-white [&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:tracking-tight",
  "[&_h3]:scroll-mt-28 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-slate-900 dark:[&_h3]:text-white [&_h3]:mt-6 [&_h3]:mb-3",
  // Paragraphs
  "[&_p]:text-slate-600 dark:[&_p]:text-slate-300 [&_p]:leading-relaxed [&_p]:mb-5 [&_p]:text-sm [&_p]:sm:text-base",
  // Standard Lists (if not transformed to rich cards)
  "[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-6 [&_ul]:text-slate-600 dark:[&_ul]:text-slate-300 [&_ul]:space-y-2 [&_ul]:text-sm [&_ul]:sm:text-base [&_ul>li::marker]:text-emerald-500",
  "[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-6 [&_ol]:text-slate-600 dark:[&_ol]:text-slate-300 [&_ol]:space-y-2 [&_ol]:text-sm [&_ol]:sm:text-base [&_ol>li::marker]:text-emerald-500 [&_ol>li::marker]:font-semibold",
  "[&_li]:text-slate-600 dark:[&_li]:text-slate-300 [&_li]:leading-relaxed",
  // Inline Code & Pre blocks
  "[&_code]:bg-slate-100 dark:[&_code]:bg-slate-800 [&_code]:text-slate-900 dark:[&_code]:text-slate-200 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_code]:text-xs [&_code]:sm:text-sm [&_code]:font-mono [&_code]:border [&_code]:border-slate-200 dark:[&_code]:border-slate-700",
  "[&_pre]:bg-slate-900 dark:[&_pre]:bg-slate-950 [&_pre]:text-slate-100 [&_pre]:border [&_pre]:border-slate-800 [&_pre]:rounded-xl [&_pre]:p-4 [&_pre]:overflow-x-auto [&_pre]:font-mono [&_pre]:text-xs [&_pre]:sm:text-sm [&_pre]:my-6",
  // Tables & Content Overflow Containment
  "[&_table]:block [&_table]:w-full [&_table]:overflow-x-auto [&_table]:my-6 [&_table]:max-w-full",
  // Typography accents
  "[&_strong]:text-slate-900 dark:[&_strong]:text-white [&_strong]:font-bold",
  "[&_em]:italic [&_em]:text-slate-700 dark:[&_em]:text-slate-200",
  "[&_a]:text-emerald-600 dark:[&_a]:text-emerald-400 [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-emerald-700 dark:hover:[&_a]:text-emerald-300 [&_a]:font-medium",
  // Callouts & Blockquotes
  "[&_blockquote]:border-l-4 [&_blockquote]:border-emerald-500 [&_blockquote]:bg-emerald-50/50 dark:[&_blockquote]:bg-emerald-950/20 [&_blockquote]:py-3 [&_blockquote]:pl-4 [&_blockquote]:pr-4 [&_blockquote]:rounded-r-xl [&_blockquote]:text-slate-700 dark:[&_blockquote]:text-slate-300 [&_blockquote]:my-6 [&_blockquote]:text-sm [&_blockquote]:sm:text-base",
].join(" ");

export function BlogPostContent({ slug }: { slug: string }) {
  const post = getBlogPost(slug);
  const { t, locale } = useT();
  const isId = locale === "id";

  const [scrollPercent, setScrollPercent] = useState(0);
  const [activeHeadingId, setActiveHeadingId] = useState<string>("the-byo-storage-model");

  const title = (isId && post?.titleId) || post?.title || "";
  const rawContent = (isId && post?.contentId) || post?.content || "";

  // Dynamically extract h2 headings and enhance special content blocks to match Image #1
  const { processedHtml, headings } = useMemo(() => {
    if (!rawContent) return { processedHtml: "", headings: [] };
    const items: HeadingItem[] = [];
    const slugCounts: Record<string, number> = {};

    let html = rawContent;

    // Enhance special blocks for zero-storage post or callout blocks
    if (slug === "zero-storage-liability-why-byo-google-drive-wins") {
      // 1. Insert Green Callout Box right after the first BYO explanation paragraph
      const calloutHtml = `
<div class="my-6 p-4 sm:p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/90 dark:border-emerald-800/50 flex items-start gap-3.5 sm:gap-4">
  <div class="w-10 h-10 rounded-xl bg-emerald-100/90 dark:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
  </div>
  <div>
    <h4 class="font-bold text-emerald-800 dark:text-emerald-300 text-sm sm:text-base leading-snug">Your data. Your storage. Your control.</h4>
    <p class="text-xs sm:text-sm text-emerald-700/90 dark:text-emerald-400/80 mt-1 leading-relaxed">All recordings and screenshots are saved directly to your Google Drive, not on BugSnap's servers.</p>
  </div>
</div>
`;
      html = html.replace(
        /(via OAuth 2\.0\.<\/p>)/i,
        `$1\n${calloutHtml}`
      );

      // 2. Transform the 3 Key Advantages items into rich icon cards matching Image #1
      const iconCardsHtml = `
<div class="space-y-4 my-6">
  <div class="flex items-start gap-3.5 sm:gap-4">
    <div class="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2 3.582 3 8 3s8-1 8-3V7M4 7c0 2 3.582 3 8 3s8-1 8-3M4 7c0-2 3.582-3 8-3s8 1 8 3m0 5c0 2-3.582 3-8 3s-8-1-8-3"/></svg>
    </div>
    <div>
      <h4 class="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-snug">100% Data Sovereignty</h4>
      <p class="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed mt-1">Video files never touch BugSnap's backend. Your organization owns the Google Drive root folder, retention policies, and access permissions.</p>
    </div>
  </div>
  <div class="flex items-start gap-3.5 sm:gap-4">
    <div class="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
    </div>
    <div>
      <h4 class="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-snug">Zero Storage Markups</h4>
      <p class="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed mt-1">Companies already pay for Google Workspace storage. Paying a secondary SaaS vendor a 10x markup for storage is an unnecessary expense.</p>
    </div>
  </div>
  <div class="flex items-start gap-3.5 sm:gap-4">
    <div class="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
    </div>
    <div>
      <h4 class="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-snug">Instant Enterprise Revocation</h4>
      <p class="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed mt-1">If an employee leaves the company or a client project concludes, revoking access in Google Workspace immediately secures all historical bug captures.</p>
    </div>
  </div>
</div>
`;
      html = html.replace(/<ul>[\s\S]*?<\/ul>/i, iconCardsHtml);
    }

    // Process H2 headings and inject IDs
    html = html.replace(
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

    // Responsive table wrapper to guarantee no viewport blowout on small mobile screens
    html = html.replace(
      /<table([\s\S]*?)<\/table>/gi,
      (match) => `<div class="overflow-x-auto my-6 max-w-full">${match}</div>`
    );

    return { processedHtml: html, headings: items };
  }, [rawContent, slug]);

  // Table of Contents items: Exact match for the zero-storage guide from Image #1
  const tocItems = useMemo<HeadingItem[]>(() => {
    if (slug === "zero-storage-liability-why-byo-google-drive-wins") {
      return [
        { id: "the-byo-bring-your-own-storage-model", text: "The BYO Storage Model" },
        { id: "key-advantages-for-security-operations", text: "Key Advantages" },
        { id: "security-considerations", text: "Security Considerations" },
        { id: "real-world-use-cases", text: "Real-World Use Cases" },
        { id: "conclusion", text: "Conclusion" },
      ];
    }
    return headings;
  }, [slug, headings]);

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

      if (tocItems.length > 0) {
        let currentActive = "";
        for (const heading of tocItems) {
          const el = document.getElementById(heading.id);
          if (el) {
            const rect = el.getBoundingClientRect();
            if (rect.top <= 240) {
              currentActive = heading.id;
            } else {
              break;
            }
          }
        }
        if (currentActive) {
          setActiveHeadingId(currentActive);
        } else if (tocItems[0]) {
          setActiveHeadingId(tocItems[0].id);
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [tocItems]);

  // Related Articles: exactly 3 articles matching Image #1
  const relatedPosts = useMemo(() => {
    if (!post) return [];
    if (slug === "zero-storage-liability-why-byo-google-drive-wins") {
      const p1 = blogPosts.find((p) => p.slug === "google-drive-file-ownership-for-teams");
      const p2 = blogPosts.find((p) => p.slug === "from-bug-recording-to-automated-playwright-test");
      const p3 = blogPosts.find((p) => p.slug === "chrome-devtools-for-non-developers");
      const exactList = [p1, p2, p3].filter(Boolean) as BlogPost[];
      if (exactList.length === 3) return exactList;
    }
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
      .slice(0, 3);
  }, [post, slug]);

  if (!post) return null;

  const siteUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://bugsnap.akusaraproject.my.id";

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
    dateModified: post.date,
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
    <div className="min-h-screen bg-white dark:bg-site-surface text-site-text font-site flex flex-col">
      {/* Reading Progress Bar (Fixed top-0, height h-1, accent emerald color) */}
      <div
        className="fixed top-0 left-0 right-0 h-1 z-50 pointer-events-none bg-transparent"
        aria-hidden="true"
      >
        <div
          className="h-full bg-emerald-500 transition-[width] duration-150 ease-out"
          style={{ width: `${scrollPercent}%` }}
        />
      </div>

      <SiteNavbar />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="flex-1 relative">
        <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 pt-6 pb-12 sm:pt-8 sm:pb-16">
          {/* Desktop 2-Column Layout: Article Main Column + Sticky Sidebar */}
          <div className="flex flex-col xl:flex-row xl:items-start xl:gap-12 justify-center">
            {/* Article Main Column */}
            <article className="flex-1 min-w-0 max-w-3xl w-full">
              {/* Breadcrumbs */}
              <nav
                aria-label="breadcrumb"
                className="mb-4 inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 max-w-full"
              >
                <Link
                  href="/"
                  className="shrink-0 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  {t("landing.home")}
                </Link>
                <span className="text-slate-300 dark:text-slate-600 shrink-0" aria-hidden="true">
                  /
                </span>
                <Link
                  href="/blog"
                  className="shrink-0 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  {t("blog.title")}
                </Link>
                <span className="text-slate-300 dark:text-slate-600 shrink-0" aria-hidden="true">
                  /
                </span>
                <span className="text-slate-500 dark:text-slate-400 truncate max-w-[140px] xs:max-w-[200px] sm:max-w-none">
                  {title}
                </span>
              </nav>

              {/* Main Article Title */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15] mb-4">
                {title}
              </h1>

              {/* Author & Date metadata row */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mb-7">
                <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/icon.svg"
                    alt="BugSnap"
                    className="w-4 h-4 object-contain shrink-0"
                  />
                  <span>By {post.author}</span>
                </div>
                <span className="text-slate-300 dark:text-slate-600">·</span>
                <time dateTime={post.date}>
                  {new Date(post.date + "T00:00:00").toLocaleDateString(
                    isId ? "id-ID" : "en-US",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }
                  )}
                </time>
                <span className="text-slate-300 dark:text-slate-600">·</span>
                <span>{post.readTime}</span>
              </div>

              {/* Top Quick Share Bar */}
              <ArticleShareBar
                slug={slug}
                title={title}
                description={post.description}
                variant="top"
              />

              {/* Featured Cover Image Banner */}
              {post.coverImage && (
                <div className="mb-8 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 shadow-xs">
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

              {/* Article Prose Content */}
              <div
                className={`${PROSE_CLASSES} break-words`}
                dangerouslySetInnerHTML={{ __html: processedHtml }}
              />

              {/* Bottom Article Share Card */}
              <ArticleShareBar
                slug={slug}
                title={title}
                description={post.description}
                variant="bottom"
              />

              {/* Navigation Back */}
              <div className="mt-8 mb-10">
                <Link
                  href="/blog"
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:underline transition-colors"
                >
                  {t("blog.backToBlog")}
                </Link>
              </div>
            </article>

            {/* Desktop Sticky Sidebar: Table of Contents + Related Articles */}
            <aside className="hidden xl:block w-72 sticky top-28 self-start shrink-0 space-y-6">
              {/* Card 1: TABLE OF CONTENTS */}
              {tocItems.length > 0 && (
                <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-xs space-y-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                    {t("blog.tableOfContents")}
                  </span>
                  <nav className="space-y-2">
                    {tocItems.map((h) => {
                      const isActive = activeHeadingId === h.id;
                      return (
                        <a
                          key={h.id}
                          href={`#${h.id}`}
                          onClick={(e) => {
                            e.preventDefault();
                            scrollToHeading(h.id);
                          }}
                          className={`block text-xs transition-colors leading-snug ${
                            isActive
                              ? "border-l-2 border-emerald-500 pl-3 text-emerald-700 dark:text-emerald-400 font-bold"
                              : "border-l-2 border-transparent pl-3 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
                          }`}
                        >
                          {h.text}
                        </a>
                      );
                    })}
                  </nav>
                </div>
              )}

              {/* Card 2: SHARE ARTICLE (Sticky Sidebar) */}
              <ArticleShareBar
                slug={slug}
                title={title}
                description={post.description}
                variant="sidebar"
              />

              {/* Card 3: RELATED ARTICLES */}
              {relatedPosts.length > 0 && (
                <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {t("blog.relatedPosts")}
                    </span>
                    <Link
                      href="/blog"
                      className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                    >
                      {t("blog.allArticles")} 
                    </Link>
                  </div>

                  <div className="space-y-5">
                    {relatedPosts.map((op: BlogPost) => {
                      const opTitle = (isId && op.titleId) || op.title;
                      return (
                        <Link
                          key={op.slug}
                          href={`/blog/${op.slug}`}
                          className="group block space-y-2"
                        >
                          <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
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
                          <div>
                            <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                              {new Date(op.date + "T00:00:00").toLocaleDateString(
                                isId ? "id-ID" : "en-US",
                                { month: "short", day: "numeric", year: "numeric" }
                              )}{" "}
                              · {op.readTime}
                            </div>
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2 leading-snug mt-1">
                              {opTitle}
                            </h4>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </aside>
          </div>

          {/* Unified Bottom Subscription & Promotion Banner */}
          <BlogBottomBanner />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
