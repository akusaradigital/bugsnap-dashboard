"use client";

import { StaticShell } from "@/components/StaticShell";
import { useT } from "@/components/I18nProvider";
import { PricingToggle } from "./PricingToggle";

export function PricingContent() {
  const { t } = useT();

  return (
    <StaticShell
      title={t("pricing.title")}
      subtitle={t("pricing.subtitle")}
      ctaLabel="← Home"
      ctaHref="/"
    >
      <div className="mx-auto max-w-6xl px-6 py-12">
        <PricingToggle />

        <div className="mt-16 max-w-2xl mx-auto text-center space-y-4">
          <h3 className="text-lg font-bold text-foreground">{t("pricing.customTitle")}</h3>
          <p className="text-sm text-muted leading-relaxed">
            {t("pricing.customDesc")}
          </p>
          <div className="pt-2">
            <a href="/contact" className="text-sm font-semibold text-indigo-600 hover:underline">
              {t("pricing.contactSales")}
            </a>
          </div>
        </div>
      </div>
    </StaticShell>
  );
}
