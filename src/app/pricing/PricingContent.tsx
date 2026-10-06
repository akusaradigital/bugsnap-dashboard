"use client";

import Link from "next/link";
import { StaticShell } from "@/components/StaticShell";
import { useT } from "@/components/I18nProvider";
import { Reveal } from "@/components/site/motion";
import { PricingToggle } from "./PricingToggle";

export function PricingContent() {
  const { t } = useT();

  return (
    <StaticShell
      title={t("pricing.title") || "Simple, Transparent Pricing"}
      subtitle={
        t("pricing.subtitle") ||
        "Start free, own your files forever. No hidden fees or storage paywalls."
      }
    >
      <div className="space-y-16 font-site">
        <PricingToggle />

        <Reveal delay={0.4}>
          <div className="relative overflow-hidden rounded-xl border border-site-border bg-gradient-to-b from-site-surface via-site-surface to-site-surface-2/70 p-5 sm:p-8 text-center space-y-3 max-w-xl mx-auto shadow-sm">
            <h3 className="text-base font-bold text-site-text">{t("pricing.customTitle")}</h3>
            <p className="text-xs text-site-text-2 leading-relaxed">
              {t("pricing.customDesc")}
            </p>
            <div className="pt-1">
              <Link
                href="/contact"
                className="inline-flex items-center text-xs font-semibold text-accent hover:underline hover:scale-105 transition-transform"
              >
                {t("pricing.contactSales")} →
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </StaticShell>
  );
}
