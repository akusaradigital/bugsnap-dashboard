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
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-8 py-10 sm:py-12">
        <PricingToggle />

        <div className="mt-16 max-w-2xl mx-auto text-center space-y-4">
          <h3 className="text-lg font-bold text-foreground">{t("pricing.customTitle")}</h3>
          <p className="text-sm text-muted leading-relaxed">
            {t("pricing.customDesc")}
          </p>
          <div className="pt-2">
            <a href="/contact" className="inline-flex items-center text-sm font-semibold text-[#6B9A35] hover:text-[#58802A] dark:text-[#A8D666] dark:hover:text-[#C2E688] transition-colors">
              {t("pricing.contactSales")}
            </a>
          </div>
        </div>
      </div>
    </StaticShell>
  );
}
