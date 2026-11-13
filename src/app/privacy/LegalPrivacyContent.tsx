"use client";

import { ReactNode } from "react";
import { StaticShell } from "@/components/StaticShell";
import { Reveal } from "@/components/site/motion";
import { useT } from "@/components/I18nProvider";

const EMAIL = "support@akusaradigital.com";
const EMAIL_LINK = (
  <a href={`mailto:${EMAIL}`} className="text-accent underline">{EMAIL}</a>
);
const CODE = (text: string) => (
  <code className="bg-site-surface-2 px-1 py-0.5 rounded text-xs border border-site-border">{text}</code>
);

export function LegalPrivacyContent() {
  const { t } = useT();

  const sections: { key: string; content: ReactNode }[] = [
    {
      key: "1",
      content: (
        <>
          <p className="text-site-text-2">
            {t("privacy.s1p1Before")}{CODE("bugsnap.akusaraproject.my.id")}{t("privacy.s1p1After")}
          </p>
          <p className="text-site-text-2">
            {t("privacy.s1p2Before")}<strong>{t("privacy.s1p2Strong")}</strong>{t("privacy.s1p2Mid")}<strong>{t("privacy.s1p2Moz")}</strong>{t("privacy.s1p2After")}
          </p>
        </>
      ),
    },
    {
      key: "2",
      content: (
        <div className="border border-site-border rounded-xl p-5 bg-site-surface space-y-4 shadow-xs">
          <div>
            <h3 className="font-bold text-[11px] uppercase tracking-wider text-accent mb-1">{t("privacy.s2aTitle")}</h3>
            <p className="text-site-text"><strong>{t("privacy.dataLabel")}</strong> {t("privacy.s2aData")}</p>
            <p className="text-xs text-site-text-2 mt-1"><strong>{t("privacy.purposeLabel")}</strong> {t("privacy.s2aPurpose")}</p>
          </div>

          <div className="border-t border-site-border-subtle pt-3">
            <h3 className="font-bold text-[11px] uppercase tracking-wider text-accent mb-1">{t("privacy.s2bTitle")}</h3>
            <p className="text-site-text"><strong>{t("privacy.dataLabel")}</strong> {t("privacy.s2bData")}</p>
            <p className="text-xs text-site-text-2 mt-1">
              <strong>{t("privacy.storageLabel")}</strong> {t("privacy.s2bStorageBefore")}<strong>{t("privacy.s2bStorageStrong")}</strong>{t("privacy.s2bStorageMid")}{CODE("drive.file")}{t("privacy.s2bStorageAfter")}
            </p>
          </div>

          <div className="border-t border-site-border-subtle pt-3">
            <h3 className="font-bold text-[11px] uppercase tracking-wider text-accent mb-1">{t("privacy.s2cTitle")}</h3>
            <p className="text-site-text"><strong>{t("privacy.dataLabel")}</strong> {t("privacy.s2cData")}</p>
            <p className="text-xs text-site-text-2 mt-1"><strong>{t("privacy.storagePurposeLabel")}</strong> {t("privacy.s2cStoragePurpose")}</p>
          </div>
        </div>
      ),
    },
    {
      key: "3",
      content: (
        <>
          <p className="text-site-text-2">{t("privacy.s3Intro")}</p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-site-text-2">
            <li><strong className="text-site-text">desktopCapture &amp; tabCapture:</strong> {t("privacy.perm.capture")}</li>
            <li><strong className="text-site-text">activeTab &amp; scripting:</strong> {t("privacy.perm.activeTab")}</li>
            <li><strong className="text-site-text">storage:</strong> {t("privacy.perm.storage")}</li>
            <li><strong className="text-site-text">identity:</strong> {t("privacy.perm.identity")}</li>
            <li><strong className="text-site-text">offscreen:</strong> {t("privacy.perm.offscreen")}</li>
            <li><strong className="text-site-text">&lt;all_urls&gt; {t("privacy.perm.hostLabel")}</strong> {t("privacy.perm.allUrls")}</li>
          </ul>
        </>
      ),
    },
    {
      key: "4",
      content: (
        <ul className="list-disc pl-5 space-y-2 text-site-text-2">
          <li><strong className="text-site-text">{t("privacy.share.noSellLabel")}</strong> {t("privacy.share.noSell")}</li>
          <li><strong className="text-site-text">{t("privacy.share.noAdsLabel")}</strong> {t("privacy.share.noAds")}</li>
          <li>
            <strong className="text-site-text">{t("privacy.share.providersLabel")}</strong> {t("privacy.share.providersIntro")}
            <ul className="list-circle pl-5 mt-1 space-y-1 text-xs text-site-text-2">
              <li><strong>{t("privacy.share.driveLabel")}</strong> {t("privacy.share.driveDesc")}</li>
              <li><strong>{t("privacy.share.dbLabel")}</strong> {t("privacy.share.dbDesc")}</li>
              <li><strong>{t("privacy.share.hostLabel")}</strong> {t("privacy.share.hostDesc")}</li>
            </ul>
          </li>
        </ul>
      ),
    },
    {
      key: "5",
      content: (
        <>
          <p className="text-site-text-2">{t("privacy.s5p1")}</p>
          <p className="text-site-text-2">{t("privacy.s5p2")}</p>
        </>
      ),
    },
    {
      key: "6",
      content: (
        <div className="space-y-2 text-site-text-2">
          <p>{t("privacy.s6Intro")}</p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs">
            <li><strong>{t("privacy.rights.accessLabel")}</strong> {t("privacy.rights.access")}</li>
            <li><strong>{t("privacy.rights.rectLabel")}</strong> {t("privacy.rights.rect")}</li>
            <li><strong>{t("privacy.rights.erasureLabel")}</strong> {t("privacy.rights.erasure")}</li>
            <li><strong>{t("privacy.rights.withdrawLabel")}</strong> {t("privacy.rights.withdraw")}</li>
            <li><strong>{t("privacy.rights.inquiryLabel")}</strong> {t("privacy.rights.inquiryBefore")}{EMAIL_LINK}{t("privacy.rights.inquiryAfter")}</li>
          </ul>
        </div>
      ),
    },
    {
      key: "7",
      content: (
        <p className="text-site-text-2">
          {t("privacy.s7Before")}
          <a href="https://developers.google.com/terms/api-services-user-data-policy#additional_requirements_for_specific_api_scopes" target="_blank" rel="noopener noreferrer" className="text-accent underline">{t("privacy.s7Link")}</a>
          {t("privacy.s7After")}
        </p>
      ),
    },
    {
      key: "8",
      content: (
        <>
          <p className="text-site-text-2">{t("privacy.s8Intro")}</p>
          <p className="font-medium text-accent">
            {EMAIL_LINK} · <a href="https://akusaradigital.com" target="_blank" rel="noopener noreferrer" className="underline">akusaradigital.com</a>
          </p>
          <p className="text-xs text-site-text-2 pt-1">{t("privacy.s8Sla")}</p>
        </>
      ),
    },
  ];

  const titles: Record<string, string> = {
    "1": t("privacy.t1"),
    "2": t("privacy.t2"),
    "3": t("privacy.t3"),
    "4": t("privacy.t4"),
    "5": t("privacy.t5"),
    "6": t("privacy.t6"),
    "7": t("privacy.t7"),
    "8": t("privacy.t8"),
  };

  return (
    <StaticShell
      title={t("privacy.pageTitle")}
      subtitle={t("privacy.pageSubtitle")}
      lastUpdated={t("privacy.lastUpdated")}
    >
      <div className="max-w-4xl space-y-8 font-site text-xs sm:text-sm text-site-text leading-relaxed">
        {sections.map((section, i) => (
          <Reveal key={section.key} delay={i * 0.05}>
            <section className="space-y-3">
              <h2 className="text-base font-bold text-site-text">{titles[section.key]}</h2>
              {section.content}
            </section>
          </Reveal>
        ))}
      </div>
    </StaticShell>
  );
}
