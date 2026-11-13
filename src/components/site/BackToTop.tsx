"use client";

import { useEffect, useState } from "react";
import { useT } from "@/components/I18nProvider";
import { Icon } from "@/lib/iconify";

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
      aria-label={t("site.backToTop")}
      title={t("site.backToTop")}
      className="fixed bottom-8 right-5 sm:bottom-10 sm:right-8 z-40 inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold bg-[#2563EB] hover:bg-[#1D4ED8] text-white border border-[#2563EB] shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 group animate-in fade-in slide-in-from-bottom-2 duration-200"
    >
      <Icon icon="lucide:arrow-up" className="w-3.5 h-3.5 brightness-0 invert" aria-hidden="true" />
      <span>{t("site.backToTop")}</span>
    </button>
  );
}
