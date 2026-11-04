"use client";

import { StaticShell } from "@/components/StaticShell";
import { useT } from "@/components/I18nProvider";
import { PricingToggle } from "./PricingToggle";

export function PricingContent() {
  const { t, locale } = useT();
  const isId = locale === "id";

  return (
    <StaticShell
      title={t("pricing.title") || "Simple & transparent"}
      titleHighlight={t("pricing.titleHighlight") || "team pricing"}
      breadcrumb={isId ? "Harga" : "Pricing"}
      subtitle={t("pricing.subtitle")}
    >
      <PricingToggle />
    </StaticShell>
  );
}
