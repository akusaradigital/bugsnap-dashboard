"use client";

import { Icon } from "@/lib/iconify";
import { useT } from "@/components/I18nProvider";

interface AdminPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
  prevLabel: string;
  nextLabel: string;
}

// Numbered window: first, last, and neighbours of the current page; gaps shown as "…".
function windowPages(page: number, total: number): (number | "gap")[] {
  const pages: number[] = [];
  for (let p = 1; p <= total; p++) {
    if (p === 1 || p === total || Math.abs(p - page) <= 1) pages.push(p);
  }
  const out: (number | "gap")[] = [];
  pages.forEach((p, i) => {
    if (i > 0 && p - pages[i - 1] > 1) out.push("gap");
    out.push(p);
  });
  return out;
}

const BTN_BASE =
  "h-8 min-w-[32px] px-2 rounded-lg border text-xs flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed";

/** Shared admin pagination: centered, chevron prev/next, numbered pages. */
export function AdminPagination({ page, totalPages, onPageChange, disabled, prevLabel, nextLabel }: AdminPaginationProps) {
  const { t } = useT();
  if (totalPages <= 1) return null;

  return (
    <nav aria-label={t("sharedFx.pagination")} className="flex items-center justify-center gap-1.5">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={disabled || page <= 1}
        aria-label={prevLabel}
        className={`${BTN_BASE} border-border bg-white dark:bg-zinc-900 text-muted hover:text-foreground hover:bg-subtle`}
      >
        <Icon icon="lucide:chevron-left" className="w-3.5 h-3.5" aria-hidden="true" />
      </button>

      {windowPages(page, totalPages).map((item, idx) =>
        item === "gap" ? (
          <span key={`gap-${idx}`} className="px-1 text-xs text-muted select-none">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onPageChange(item)}
            disabled={disabled}
            aria-current={item === page ? "page" : undefined}
            className={`${BTN_BASE} ${
              item === page
                ? "border-[#2563EB] bg-[#2563EB] text-white font-semibold"
                : "border-border bg-white dark:bg-zinc-900 text-foreground hover:bg-subtle"
            }`}
          >
            {item}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={disabled || page >= totalPages}
        aria-label={nextLabel}
        className={`${BTN_BASE} border-border bg-white dark:bg-zinc-900 text-muted hover:text-foreground hover:bg-subtle`}
      >
        <Icon icon="lucide:chevron-right" className="w-3.5 h-3.5" aria-hidden="true" />
      </button>
    </nav>
  );
}
