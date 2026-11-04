"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/lib/iconify";
import { useT } from "@/components/I18nProvider";

export function BackToTop() {
  const { t } = useT();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 300);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label={t("site.backToTop") || "Back to top"}
      title={t("site.backToTop") || "Back to top"}
      className="fixed bottom-8 right-5 sm:bottom-10 sm:right-8 z-40 inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white border border-slate-200/80 dark:border-slate-800/80 shadow-md hover:shadow-lg hover:border-[#89BD49]/60 dark:hover:border-[#89BD49]/60 backdrop-blur-md transition-all duration-200 active:scale-95 group animate-in fade-in slide-in-from-bottom-2 duration-200"
    >
      <Icon
        icon="lucide:chevron-up"
        className="w-4 h-4 text-[#46741A] dark:text-[#A8D666] transition-transform group-hover:-translate-y-0.5"
        aria-hidden="true"
      />
      <span>{t("site.backToTop") || "Back to top"}</span>
    </button>
  );
}
