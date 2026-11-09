"use client";

import { SiteNavbar } from "@/components/site/SiteNavbar";
import { SiteFooter } from "@/components/site/SiteFooter";
import { InProgressView } from "@/components/InProgressView";
import { useT } from "@/components/I18nProvider";

export default function UpgradePage() {
  const { t } = useT();

  return (
    <div className="min-h-screen flex flex-col bg-site-bg text-site-text font-site transition-colors selection:bg-[#DC2626]/20 selection:text-[#B91C1C] dark:selection:text-[#F87171]">
      <SiteNavbar />
      <main className="flex-1 flex items-center justify-center">
        <InProgressView
          featureName="Pro & Billing"
          backHref="/settings"
          backLabel={t("settings.title") || "Settings"}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
