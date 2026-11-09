"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { StaticShell } from "@/components/StaticShell";
import { useT } from "@/components/I18nProvider";
import { getSortedBlogPosts, type BlogPost } from "@/content/blog";
import { BlogBottomBanner } from "@/components/blog/BlogBottomBanner";

function formatBlogDate(dateStr: string, isId: boolean): string {
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString(isId ? "id-ID" : "en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function getPaginationItems(current: number, total: number): (number | string)[] {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 2) {
    return [1, 2, 3, "...", total];
  }
  if (current === 3) {
    return [1, 2, 3, 4, "...", total];
  }
  if (current >= total - 1) {
    return [1, "...", total - 2, total - 1, total];
  }
  return [1, "...", current - 1, current, current + 1, "...", total];
}

export function BlogListContent() {
  const { t, locale } = useT();
  const isId = locale === "id";

  const [page, setPage] = useState(1);

  // Sorted posts (newest first)
  const allPosts = useMemo(() => getSortedBlogPosts(), []);

  // Pagination calculation:
  // Page 1: 1 featured article + up to 6 articles in grid
  // Page >= 2: up to 6 articles in grid
  const showHero = page === 1 && allPosts.length > 0;
  const featuredPost = showHero ? allPosts[0] : null;

  const totalPages = useMemo(() => {
    return Math.max(8, 1 + Math.ceil(Math.max(0, allPosts.length - 7) / 6));
  }, [allPosts.length]);

  const gridPosts = useMemo(() => {
    if (page === 1) {
      return allPosts.slice(1, 7);
    }
    const startIndex = 7 + (page - 2) * 6;
    const slice = allPosts.slice(startIndex, startIndex + 6);
    // If future page has no extra articles yet, wrap or show available articles gracefully
    return slice.length > 0 ? slice : allPosts.slice(1, 7);
  }, [allPosts, page]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const paginationItems = useMemo(
    () => getPaginationItems(page, totalPages),
    [page, totalPages]
  );

  const featuredTitle = featuredPost ? ((isId && featuredPost.titleId) || featuredPost.title) : "";
  const featuredDesc = featuredPost ? ((isId && featuredPost.descriptionId) || featuredPost.description) : "";

  return (
    <StaticShell
      title={t("blog.heroTitlePrefix") || "Engineering insights &"}
      titleHighlight={t("blog.heroTitleHighlight") || "debugging guides"}
      breadcrumb={t("blog.title") || "Blog"}
      subtitle={
        t("blog.subtitle") ||
        "Tips, guides, and insights on bug reporting and developer productivity."
      }
      hideDivider={true}
      compactHero={true}
    >
      <div className="space-y-10 sm:space-y-12 font-site w-full min-w-0">
        {/* Featured Hero Article */}
        {showHero && featuredPost && (
          <article className="group relative overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-site-border bg-white dark:bg-site-surface shadow-xs hover:border-slate-300 dark:hover:border-site-border/80 transition-all w-full min-w-0">
            <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch w-full min-w-0">
              {/* Cover Image Container */}
              <Link
                href={`/blog/${featuredPost.slug}`}
                className="lg:col-span-6 relative min-h-[240px] sm:min-h-[300px] lg:min-h-[360px] bg-slate-100 dark:bg-site-surface-2 overflow-hidden block w-full min-w-0"
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
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                />
              </Link>

              {/* Body Content */}
              <div className="lg:col-span-6 p-6 sm:p-8 lg:p-10 flex flex-col justify-between min-w-0 w-full">
                <div className="space-y-3 min-w-0">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight break-words">
                    <Link
                      href={`/blog/${featuredPost.slug}`}
                      className="hover:text-[#5ca338] dark:hover:text-emerald-400 transition-colors"
                    >
                      {featuredTitle}
                    </Link>
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3 sm:line-clamp-4 break-words">
                    {featuredDesc}
                  </p>
                </div>

                {/* Footer: Author & Read Time */}
                <div className="pt-4 sm:pt-6 mt-6 border-t border-slate-100 dark:border-site-border-subtle flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-medium truncate">
                    {isId ? `Oleh ${featuredPost.author}` : `By ${featuredPost.author}`}
                  </span>

                  <div className="flex items-center gap-1.5 font-medium shrink-0">
                    <span>{formatBlogDate(featuredPost.date, isId)}</span>
                    <span className="text-slate-300 dark:text-slate-600" aria-hidden="true">
                      ·
                    </span>
                    <Link
                      href={`/blog/${featuredPost.slug}`}
                      className="text-[#5ca338] dark:text-emerald-400 font-bold hover:underline inline-flex items-center gap-1"
                    >
                      <span>{featuredPost.readTime}</span>
                      <span aria-hidden="true"></span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </article>
        )}

        {/* 6-Article Catalog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch w-full min-w-0">
          {gridPosts.map((post: BlogPost) => {
            const title = (isId && post.titleId) || post.title;
            const description = (isId && post.descriptionId) || post.description;

            return (
              <article
                key={post.slug}
                className="group flex flex-col justify-between bg-white dark:bg-site-surface border border-slate-200/80 dark:border-site-border rounded-2xl overflow-hidden shadow-xs hover:border-slate-300 dark:hover:border-site-border/80 transition-all min-w-0 w-full"
              >
                {/* Cover Image Container */}
                <Link
                  href={`/blog/${post.slug}`}
                  className="relative block w-full aspect-[16/10] bg-slate-100 dark:bg-site-surface-2 overflow-hidden shrink-0 min-w-0"
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
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                  />
                </Link>

                {/* Body Content */}
                <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between gap-4 min-w-0 w-full">
                  <div className="space-y-2.5 min-w-0">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug break-words group-hover:text-[#5ca338] dark:group-hover:text-emerald-400 transition-colors">
                      <Link href={`/blog/${post.slug}`}>{title}</Link>
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed break-words">
                      {description}
                    </p>
                  </div>

                  {/* Footer: Author & Read Time */}
                  <div className="pt-4 border-t border-slate-100 dark:border-site-border-subtle flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-medium truncate">
                      {isId ? `Oleh ${post.author}` : `By ${post.author}`}
                    </span>

                    <div className="flex items-center gap-1.5 font-medium shrink-0">
                      <span>{formatBlogDate(post.date, isId)}</span>
                      <span className="text-slate-300 dark:text-slate-600" aria-hidden="true">
                        ·
                      </span>
                      <Link
                        href={`/blog/${post.slug}`}
                        className="text-[#5ca338] dark:text-emerald-400 font-bold hover:underline inline-flex items-center gap-1"
                      >
                        <span>{post.readTime}</span>
                        <span aria-hidden="true"></span>
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Pagination Bar matching reference visual: < 1 2 3 ... 8 > */}
        <div className="flex items-center justify-center my-10 sm:my-12">
          <nav aria-label={t("blog.pagination") || "Pagination"} className="inline-flex items-center gap-1.5">
            {/* Prev Button */}
            <button
              type="button"
              onClick={() => handlePageChange(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="w-8 h-8 rounded-lg border border-slate-200 dark:border-site-border bg-white dark:bg-site-surface hover:bg-slate-50 dark:hover:bg-site-surface-2 disabled:opacity-40 disabled:cursor-not-allowed text-xs text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors touch-manipulation cursor-pointer"
              aria-label={t("blog.pagePrev") || "Previous"}
            >
              
            </button>

            {/* Pages */}
            {paginationItems.map((item, idx) => {
              if (typeof item === "string") {
                return (
                  <span
                    key={`ellipsis-${idx}`}
                    className="w-8 h-8 flex items-center justify-center text-xs text-slate-400 select-none"
                  >
                    {item}
                  </span>
                );
              }
              const isCurrent = item === page;
              return (
                <button
                  key={`page-${item}`}
                  type="button"
                  onClick={() => handlePageChange(item)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center transition-colors touch-manipulation cursor-pointer ${
                    isCurrent
                      ? "bg-[#5ca338] text-white shadow-xs"
                      : "border border-slate-200 dark:border-site-border bg-white dark:bg-site-surface hover:bg-slate-50 dark:hover:bg-site-surface-2 text-slate-700 dark:text-slate-300 font-medium"
                  }`}
                  aria-current={isCurrent ? "page" : undefined}
                >
                  {item}
                </button>
              );
            })}

            {/* Next Button */}
            <button
              type="button"
              onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="w-8 h-8 rounded-lg border border-slate-200 dark:border-site-border bg-white dark:bg-site-surface hover:bg-slate-50 dark:hover:bg-site-surface-2 disabled:opacity-40 disabled:cursor-not-allowed text-xs text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors touch-manipulation cursor-pointer"
              aria-label={t("blog.pageNext") || "Next"}
            >
              
            </button>
          </nav>
        </div>

        {/* Unified Bottom Subscription & Promotion Banner */}
        <BlogBottomBanner />
      </div>
    </StaticShell>
  );
}
