"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { StaticShell } from "@/components/StaticShell";
import { useT } from "@/components/I18nProvider";
import { getSortedBlogPosts, type BlogPost } from "@/content/blog";
import { Icon } from "@/lib/iconify";
import { BlogBottomBanner } from "@/components/blog/BlogBottomBanner";

export function BlogListContent() {
  const { t, locale } = useT();
  const isId = locale === "id";

  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  // Sorted posts (newest first)
  const allPosts = useMemo(() => getSortedBlogPosts(), []);

  // Filter posts based on search query
  const filteredPosts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allPosts;
    return allPosts.filter((post) => {
      const matchesEnTitle = post.title.toLowerCase().includes(q);
      const matchesIdTitle = post.titleId ? post.titleId.toLowerCase().includes(q) : false;
      const matchesEnDesc = post.description.toLowerCase().includes(q);
      const matchesIdDesc = post.descriptionId ? post.descriptionId.toLowerCase().includes(q) : false;
      const matchesTags = post.tags.some((tag) => tag.toLowerCase().includes(q));
      return matchesEnTitle || matchesIdTitle || matchesEnDesc || matchesIdDesc || matchesTags;
    });
  }, [allPosts, searchQuery]);

  const isFiltering = Boolean(searchQuery.trim());

  // When on page 1 and no search query/tag filter is active, feature the newest post (index 0)
  const showHero = page === 1 && !isFiltering && filteredPosts.length > 0;
  const featuredPost = showHero ? filteredPosts[0] : null;

  // Pagination calculation:
  // Page 1 (when not filtering): 1 hero + up to 6 in grid = max 7 articles
  // Page >= 2 (or when filtering): up to 6 articles in grid, without hero
  const totalPages = useMemo(() => {
    if (filteredPosts.length === 0) return 1;
    if (!isFiltering) {
      if (filteredPosts.length <= 7) return 1;
      return 1 + Math.ceil((filteredPosts.length - 7) / 6);
    }
    return Math.max(1, Math.ceil(filteredPosts.length / 6));
  }, [filteredPosts.length, isFiltering]);

  const paginatedPosts = useMemo(() => {
    if (filteredPosts.length === 0) return [];
    if (!isFiltering) {
      if (page === 1) {
        return filteredPosts.slice(1, 7);
      }
      const startIndex = 7 + (page - 2) * 6;
      return filteredPosts.slice(startIndex, startIndex + 6);
    }
    const startIndex = (page - 1) * 6;
    return filteredPosts.slice(startIndex, startIndex + 6);
  }, [filteredPosts, isFiltering, page]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setPage(1);
  };

  const featuredTitle = featuredPost ? ((isId && featuredPost.titleId) || featuredPost.title) : "";
  const featuredDesc = featuredPost ? ((isId && featuredPost.descriptionId) || featuredPost.description) : "";

  return (
    <StaticShell
      title={t("blog.title") || "Engineering & Bug Reporting Insights"}
      subtitle={
        t("blog.subtitle") ||
        "Practical guides on bug reporting, DevTools diagnostics, screen recording, and developer productivity."
      }
    >
      <div className="space-y-10 sm:space-y-14 font-site">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-site-border pb-4 min-w-0">
          <div className="min-w-0">
            <span className="text-xs font-bold tracking-widest uppercase text-site-accent">
              {t("blog.badge") || "BugSnap Blog"}
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-site-text tracking-tight mt-1">
              {t("blog.allArticles") || "All Articles"}
            </h2>
          </div>
          <span className="text-xs text-site-text-2 shrink-0">
            {allPosts.length} {isId ? "artikel dipublikasikan" : "articles published"}
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative w-full max-w-xl min-w-0">
          <Icon
            icon="lucide:search"
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-site-text-2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder={t("blog.searchPlaceholder") || "Search articles, topics, DevTools guides..."}
            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-site-border bg-site-surface text-site-text placeholder:text-site-text-2/60 text-xs sm:text-sm focus:outline-hidden focus:border-site-accent transition-colors"
            aria-label={t("blog.searchPlaceholder") || "Search articles"}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setPage(1);
              }}
              className="absolute right-1 top-1/2 -translate-y-1/2 min-w-[40px] min-h-[40px] flex items-center justify-center text-site-text-2 hover:text-site-text rounded-md transition-colors touch-manipulation"
              aria-label="Clear search"
            >
              <Icon icon="lucide:x" className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Hero Featured Article (Displayed on Page 1 when not filtering) */}
        {showHero && featuredPost && (
          <article className="group relative overflow-hidden rounded-2xl sm:rounded-3xl border border-site-border bg-site-surface shadow-sm hover:border-site-accent/40 transition-colors w-full min-w-0 max-w-full">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 items-stretch w-full min-w-0">
                {/* Cover Image Container */}
                <Link
                  href={`/blog/${featuredPost.slug}`}
                  className="lg:col-span-7 relative min-h-[220px] sm:min-h-[280px] lg:min-h-[340px] bg-site-surface-2 overflow-hidden border-b lg:border-b-0 lg:border-r border-site-border block w-full min-w-0 max-w-full"
                  tabIndex={-1}
                  aria-hidden="true"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={featuredPost.coverImage || "/opengraph-image.png"}
                    alt={featuredTitle}
                    loading="eager"
                    onError={(e) => {
                      e.currentTarget.src = "/opengraph-image.png";
                    }}
                    className="w-full h-full object-cover max-w-full"
                  />
                  {/* Featured Badge */}
                  <div className="absolute top-3 left-3 sm:top-4 sm:left-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-site-accent text-white dark:text-slate-900 text-xs font-extrabold shadow-sm">
                    <Icon icon="lucide:sparkles" className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>{t("blog.featured") || "Featured Article"}</span>
                  </div>
                  {/* Read Time Pill */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/80 backdrop-blur-xs text-[11px] font-medium text-white border border-white/10">
                    <Icon icon="lucide:clock" className="w-3 h-3" aria-hidden="true" />
                    <span>{featuredPost.readTime}</span>
                  </div>
                </Link>

                {/* Body Content */}
                <div className="lg:col-span-5 p-5 sm:p-8 flex flex-col justify-between gap-6 min-w-0 w-full">
                  <div className="space-y-3 min-w-0">
                    {/* Meta: Date & First Tag */}
                    <div className="flex items-center justify-between text-xs text-site-text-2 gap-2">
                      <time dateTime={featuredPost.date} className="tabular-nums">
                        {new Date(featuredPost.date + "T00:00:00").toLocaleDateString(
                          isId ? "id-ID" : "en-US",
                          { year: "numeric", month: "short", day: "numeric" }
                        )}
                      </time>
                      {featuredPost.tags[0] && (
                        <span className="text-[11px] px-2.5 py-0.5 rounded bg-site-surface-2 text-site-text-2 font-medium border border-site-border-subtle">
                          #{featuredPost.tags[0]}
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl sm:text-2xl font-extrabold text-site-text tracking-tight leading-snug break-words">
                      <Link
                        href={`/blog/${featuredPost.slug}`}
                        className="hover:text-site-accent transition-colors"
                      >
                        {featuredTitle}
                      </Link>
                    </h3>

                    {/* Description snippet */}
                    <p className="text-xs sm:text-sm text-site-text-2 leading-relaxed line-clamp-3 sm:line-clamp-4 break-words">
                      {featuredDesc}
                    </p>
                  </div>

                  {/* Footer: Author & Direct CTA */}
                  <div className="pt-4 border-t border-site-border-subtle flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
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
                      <span className="text-xs font-medium text-site-text-2 truncate">
                        {featuredPost.author}
                      </span>
                    </div>

                    <Link
                      href={`/blog/${featuredPost.slug}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-site-accent hover:underline shrink-0"
                    >
                      <span>{t("blog.readMore") || "Read more"}</span>
                      <Icon icon="lucide:arrow-right" className="w-3.5 h-3.5" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </div>
            </article>
        )}

        {/* Article Catalog Grid & Empty State */}
        {filteredPosts.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-2xl border border-site-border bg-site-surface">
            <div className="w-12 h-12 rounded-full bg-site-surface-2 border border-site-border mx-auto flex items-center justify-center text-site-text-2 mb-3">
              <Icon icon="lucide:search" className="w-5 h-5" aria-hidden="true" />
            </div>
            <p className="text-sm font-medium text-site-text mb-4">
              {t("blog.noResults") || "No articles found matching your search."}
            </p>
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-site-surface-2 hover:bg-site-surface border border-site-border text-site-text transition-colors"
            >
              <Icon icon="lucide:x" className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{t("blog.clearFilter") || "Clear search & filters"}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-8 w-full min-w-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch w-full min-w-0">
              {paginatedPosts.map((post: BlogPost) => {
                const title = (isId && post.titleId) || post.title;
                const description = (isId && post.descriptionId) || post.description;

                return (
                  <article
                    key={post.slug}
                    className="flex flex-col h-full bg-site-surface border border-site-border rounded-2xl overflow-hidden shadow-sm hover:border-site-accent/40 transition-colors min-w-0 w-full max-w-full"
                  >
                      {/* Cover Image Container */}
                      <Link
                        href={`/blog/${post.slug}`}
                        className="relative block w-full aspect-[16/9] bg-site-surface-2 overflow-hidden border-b border-site-border shrink-0 min-w-0 max-w-full"
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
                          className="w-full h-full object-cover max-w-full"
                        />
                        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-xs text-[11px] font-medium text-white border border-white/10">
                          <Icon icon="lucide:clock" className="w-3 h-3" aria-hidden="true" />
                          <span>{post.readTime}</span>
                        </div>
                      </Link>

                      {/* Body Content */}
                      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4 min-w-0 w-full">
                        <div className="space-y-2.5 min-w-0">
                          {/* Meta: Date & First tag */}
                          <div className="flex items-center justify-between text-xs text-site-text-2 gap-2">
                            <time dateTime={post.date} className="tabular-nums">
                              {new Date(post.date + "T00:00:00").toLocaleDateString(
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

                          <h3 className="text-base sm:text-lg font-bold text-site-text line-clamp-2 leading-snug break-words">
                            <Link
                              href={`/blog/${post.slug}`}
                              className="hover:text-site-accent transition-colors"
                            >
                              {title}
                            </Link>
                          </h3>

                          {/* Description snippet */}
                          <p className="text-xs sm:text-sm text-site-text-2 line-clamp-3 leading-relaxed break-words">
                            {description}
                          </p>
                        </div>

                        {/* Footer: Author & Direct CTA */}
                        <div className="pt-4 border-t border-site-border-subtle flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0">
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
                            <span className="text-xs font-medium text-site-text-2 truncate">
                              {post.author}
                            </span>
                          </div>

                          <Link
                            href={`/blog/${post.slug}`}
                            className="inline-flex items-center gap-1 py-1.5 text-xs font-bold text-site-accent hover:underline shrink-0 touch-manipulation"
                          >
                            <span>{t("blog.readMore") || "Read"}</span>
                            <Icon icon="lucide:arrow-right" className="w-3.5 h-3.5" aria-hidden="true" />
                          </Link>
                        </div>
                      </div>
                    </article>
                );
              })}
            </div>

            {/* Pagination Controls (Centered, Clean Buttons, No Redundant Counter) */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center pt-8 border-t border-site-border">
                <nav
                  aria-label={t("blog.pagination") || "Pagination"}
                  className="inline-flex items-center gap-1.5"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setPage((p) => Math.max(1, p - 1));
                      if (typeof window !== "undefined") {
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }
                    }}
                    disabled={page <= 1}
                    className="inline-flex items-center justify-center gap-1 px-3 py-2 min-h-[40px] rounded-lg border border-site-border bg-site-surface hover:bg-site-surface-2 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-site-text transition-colors touch-manipulation"
                    aria-label={t("blog.pagePrev") || "Previous"}
                  >
                    <Icon icon="lucide:chevron-left" className="w-4 h-4" />
                    <span className="hidden sm:inline">{t("blog.pagePrev") || "Previous"}</span>
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        setPage(p);
                        if (typeof window !== "undefined") {
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }
                      }}
                      className={`w-9 h-9 sm:w-8 sm:h-8 min-h-[38px] min-w-[38px] sm:min-h-0 sm:min-w-0 rounded-lg text-xs font-bold transition-colors touch-manipulation ${
                        p === page
                          ? "bg-site-accent text-white dark:text-slate-900 shadow-xs"
                          : "border border-site-border bg-site-surface hover:bg-site-surface-2 text-site-text"
                      }`}
                      aria-current={p === page ? "page" : undefined}
                    >
                      {p}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => {
                      setPage((p) => Math.min(totalPages, p + 1));
                      if (typeof window !== "undefined") {
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }
                    }}
                    disabled={page >= totalPages}
                    className="inline-flex items-center justify-center gap-1 px-3 py-2 min-h-[40px] rounded-lg border border-site-border bg-site-surface hover:bg-site-surface-2 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-site-text transition-colors touch-manipulation"
                    aria-label={t("blog.pageNext") || "Next"}
                  >
                    <span className="hidden sm:inline">{t("blog.pageNext") || "Next"}</span>
                    <Icon icon="lucide:chevron-right" className="w-4 h-4" />
                  </button>
                </nav>
              </div>
            )}
          </div>
        )}

        {/* Unified Bottom Subscription & Promotion Banner (DomaiNesia-style Split Card) */}
        <BlogBottomBanner />
      </div>
    </StaticShell>
  );
}
