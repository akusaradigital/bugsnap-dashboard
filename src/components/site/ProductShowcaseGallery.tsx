"use client";

import { useState } from "react";
import { useT } from "@/components/I18nProvider";
import { Icon, withAssetVersion } from "@/lib/iconify";

interface ShowcaseSlide {
  id: string;
  src: string;
  tabKey: string;
  captionKey: string;
  alt: string;
}

const SLIDES: ShowcaseSlide[] = [
  {
    id: "capture",
    src: "/showcase/slide-1-capture-popup.png",
    tabKey: "showcase.tab1",
    captionKey: "showcase.cap1",
    alt: "BugSnap Chrome and Firefox extension popup capturing screenshots and tab recordings with DevTools attached",
  },
  {
    id: "editor",
    src: "/showcase/slide-2-editor-annotations.png",
    tabKey: "showcase.tab2",
    captionKey: "showcase.cap2",
    alt: "BugSnap visual editor annotating a checkout HTTP 500 error and blurring sensitive card digits",
  },
  {
    id: "devtools",
    src: "/showcase/slide-3-devtools-logs.png",
    tabKey: "showcase.tab3",
    captionKey: "showcase.cap3",
    alt: "BugSnap capture viewer displaying network 500 payloads, redacted bearer tokens, and console stack traces",
  },
  {
    id: "dashboard",
    src: "/showcase/slide-4-dashboard-drive.png",
    tabKey: "showcase.tab4",
    captionKey: "showcase.cap4",
    alt: "BugSnap team dashboard with color-coded Google Drive folders and workspace switcher",
  },
  {
    id: "share",
    src: "/showcase/slide-5-share-integrations.png",
    tabKey: "showcase.tab5",
    captionKey: "showcase.cap5",
    alt: "BugSnap share link access controls and connected team integrations including Jira, Linear, GitHub, Slack, and MCP",
  },
];

export function ProductShowcaseGallery() {
  const { t } = useT();
  const [activeIdx, setActiveIdx] = useState(0);
  const active = SLIDES[activeIdx];

  const prev = () => setActiveIdx((i) => (i - 1 + SLIDES.length) % SLIDES.length);
  const next = () => setActiveIdx((i) => (i + 1) % SLIDES.length);

  return (
    <section className="space-y-6" aria-labelledby="showcase-gallery-heading">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-[#2563EB] dark:text-[#3B82F6]">
          {t("showcase.eyebrow")}
        </span>
        <h2
          id="showcase-gallery-heading"
          className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white"
        >
          {t("showcase.heading")}
        </h2>
        <p className="text-xs sm:text-sm text-site-text-2 leading-relaxed text-balance">
          {t("showcase.subtitle")}
        </p>
      </div>

      {/* Tab selector pills */}
      <div
        className="flex flex-wrap items-center justify-center gap-2"
        role="tablist"
        aria-label={t("showcase.heading")}
      >
        {SLIDES.map((slide, idx) => {
          const isSelected = idx === activeIdx;
          return (
            <button
              key={slide.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => setActiveIdx(idx)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer select-none border ${
                isSelected
                  ? "bg-[#2563EB] text-white border-[#2563EB] shadow-xs"
                  : "bg-site-surface text-site-text-2 border-site-border hover:text-site-text hover:bg-site-surface-2"
              }`}
            >
              {t(slide.tabKey)}
            </button>
          );
        })}
      </div>

      {/* Main 16:10 Showcase Frame */}
      <div className="relative mx-auto max-w-5xl">
        <div className="rounded-2xl border border-site-border bg-white dark:bg-zinc-900 shadow-xl overflow-hidden">
          <div className="relative aspect-[16/10] w-full bg-slate-50 dark:bg-zinc-950">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={withAssetVersion(active.src)}
              alt={active.alt}
              width={1280}
              height={800}
              className="w-full h-full object-contain block"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-3.5 border-t border-site-border bg-site-surface">
            <p className="text-xs sm:text-sm font-medium text-site-text text-center sm:text-left">
              {t(active.captionKey)}
            </p>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-mono text-site-text-2 pr-1">
                {activeIdx + 1} / {SLIDES.length}
              </span>
              <button
                type="button"
                onClick={prev}
                aria-label={t("showcase.prev")}
                className="w-9 h-9 rounded-xl border border-site-border bg-site-surface-2 hover:bg-site-surface text-site-text flex items-center justify-center transition-colors cursor-pointer"
              >
                <Icon icon="lucide:chevron-left" className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={next}
                aria-label={t("showcase.next")}
                className="w-9 h-9 rounded-xl border border-site-border bg-site-surface-2 hover:bg-site-surface text-site-text flex items-center justify-center transition-colors cursor-pointer"
              >
                <Icon icon="lucide:chevron-right" className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
