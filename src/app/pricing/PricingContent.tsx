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
      title={t("pricing.title")}
      subtitle={t("pricing.subtitle")}
    >
      <div className="space-y-12 font-site">
        <PricingToggle />

        <Reveal delay={0.4}>
          <div className="relative overflow-hidden rounded-xl border border-site-border bg-gradient-to-b from-site-surface via-site-surface to-site-surface-2/70 p-8 text-center space-y-3 max-w-xl mx-auto shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-lg hover:shadow-accent/5 group">
            {/* Top Edge Gradient Accent */}
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-hidden="true" />

            <h3 className="text-base font-bold text-site-text group-hover:text-accent transition-colors">{t("pricing.customTitle")}</h3>
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
