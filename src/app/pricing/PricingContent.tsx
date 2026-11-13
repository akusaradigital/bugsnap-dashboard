"use client";

import { StaticShell } from "@/components/StaticShell";
import { useT } from "@/components/I18nProvider";
import { PricingToggle } from "./PricingToggle";

export function PricingContent() {
  const { t, locale } = useT();
  const isId = locale === "id";

  return (
    <StaticShell
      title={t("pricing.title")}
      titleHighlight={t("pricing.titleHighlight")}
      breadcrumb={isId ? "Harga" : "Pricing"}
      subtitle={t("pricing.subtitle")}
    >
      <PricingToggle />
    </StaticShell>
  );
}
