"use client";

import Link from "next/link";
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
      <div className="space-y-12 font-site">
        <PricingToggle />

        <div className="rounded-xl border border-site-border bg-site-surface p-8 text-center space-y-3 max-w-xl mx-auto shadow-xs">
          <h3 className="text-base font-bold text-site-text">{t("pricing.customTitle")}</h3>
          <p className="text-xs text-site-text-2 leading-relaxed">
            {t("pricing.customDesc")}
          </p>
          <div className="pt-1">
            <Link
              href="/contact"
              className="inline-flex items-center text-xs font-semibold text-accent hover:underline"
            >
              {t("pricing.contactSales")} →
            </Link>
          </div>
        </div>
      </div>
    </StaticShell>
  );
}
