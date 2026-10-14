"use client";

import { StaticShell } from "@/components/StaticShell";
import { useT } from "@/components/I18nProvider";
import { PricingToggle } from "./PricingToggle";

export function PricingContent() {
  const { t } = useT();

  return (
    <StaticShell
      title={t("pricing.headline")}
      subtitle={t("pricing.subtitle")}
    >
      <PricingToggle />
    </StaticShell>
  );
}
