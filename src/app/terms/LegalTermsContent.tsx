"use client";

import { ReactNode } from "react";
import { StaticShell } from "@/components/StaticShell";
import { Reveal } from "@/components/site/motion";
import { useT } from "@/components/I18nProvider";

const EMAIL = "support@akusaradigital.com";
const CODE = (text: string) => (
  <code className="bg-site-surface-2 px-1 py-0.5 rounded border border-site-border">{text}</code>
);

export function LegalTermsContent() {
  const { t } = useT();

  const sections: { key: string; id?: string; content: ReactNode }[] = [
    {
      key: "1",
      id: "acceptance",
      content: <p className="text-site-text-2">{t("terms.s1")}</p>,
    },
    {
      key: "2",
      id: "description",
      content: (
        <div className="space-y-2 text-site-text-2">
          <p>
            {t("terms.s2aBefore")}<strong>{t("terms.s2aStrong")}</strong>{t("terms.s2aAfter")}
          </p>
          <p>
            {t("terms.s2bBefore")}<strong>{t("terms.s2bStrong")}</strong>{t("terms.s2bAfter")}
          </p>
        </div>
      ),
    },
    {
      key: "3",
      id: "accounts",
      content: (
        <p className="text-site-text-2">
          {t("terms.s3Before")}<a href={`mailto:${EMAIL}`} className="text-accent underline">{EMAIL}</a>{t("terms.s3After")}
        </p>
      ),
    },
    {
      key: "4",
      id: "acceptable-use",
      content: (
        <>
          <p className="text-site-text-2 mb-2">{t("terms.s4Intro")}</p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-site-text-2">
            <li>{t("terms.s4li1")}</li>
            <li>{t("terms.s4li2")}</li>
            <li>{t("terms.s4li3")}</li>
            <li>{t("terms.s4li4")}</li>
            <li>{t("terms.s4li5")}</li>
          </ul>
          <div className="mt-3 p-3 rounded-lg bg-site-surface-2 border border-site-border-subtle text-xs text-site-text-2 space-y-1">
            <strong className="text-site-text font-semibold">{t("terms.consentLabel")}</strong>
            <p>{t("terms.consentBody")}</p>
          </div>
        </>
      ),
    },
    {
      key: "5",
      id: "data-sovereignty",
      content: (
        <>
          <p className="text-site-text-2 mb-2">
            <strong>{t("terms.s5aStrong")}</strong>{t("terms.s5aAfter")}
          </p>
          <p className="text-site-text-2 mb-2">
            <strong>{t("terms.s5bLabel")}</strong>{t("terms.s5bBefore")}{CODE("drive.file")}{t("terms.s5bAfter")}
          </p>
          <p className="text-site-text-2">{t("terms.s5c")}</p>
        </>
      ),
    },
    {
      key: "6",
      id: "billing",
      content: (
        <div className="space-y-2 text-site-text-2">
          <p><strong>{t("terms.s6aLabel")}</strong> {t("terms.s6aBody")}</p>
          <p>
            <strong>{t("terms.s6bLabel")}</strong> {t("terms.s6bBefore")}<strong>{t("terms.s6bStrong")}</strong>{t("terms.s6bAfter")}
          </p>
          <p><strong>{t("terms.s6cLabel")}</strong> {t("terms.s6cBody")}</p>
        </div>
      ),
    },
    {
      key: "7",
      id: "refund",
      content: (
        <div className="space-y-3 text-site-text-2 border border-site-border rounded-xl p-5 bg-site-surface shadow-xs">
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-site-accent mb-1">{t("terms.s7aTitle")}</h3>
            <p className="text-xs">
              {t("terms.s7aBefore")}<span className="font-mono text-site-text">{t("terms.s7aMono")}</span>{t("terms.s7aAfter")}
            </p>
          </div>
          <div className="border-t border-site-border-subtle pt-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-site-accent mb-1">{t("terms.s7bTitle")}</h3>
            <p className="text-xs">
              {t("terms.s7bBefore")}<strong>{t("terms.s7bStrong")}</strong>{t("terms.s7bAfter")}
            </p>
          </div>
          <div className="border-t border-site-border-subtle pt-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-site-accent mb-1">{t("terms.s7cTitle")}</h3>
            <p className="text-xs">
              {t("terms.s7cBefore")}<a href={`mailto:${EMAIL}`} className="text-accent underline font-semibold">{EMAIL}</a>{t("terms.s7cAfter")}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "8",
      id: "consumer-protection",
      content: (
        <div className="space-y-3 text-site-text-2">
          <p>{t("terms.s8Intro")}</p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-site-text-2">
            <li><strong>{t("terms.s8li1Label")}</strong> {t("terms.s8li1Body")}</li>
            <li><strong>{t("terms.s8li2Label")}</strong> {t("terms.s8li2Body")}</li>
            <li><strong>{t("terms.s8li3Label")}</strong> {t("terms.s8li3Body")}</li>
          </ul>
          <p className="text-xs">
            <strong>{t("terms.s8GuarLabel")}</strong> {t("terms.s8GuarBody")}
          </p>
        </div>
      ),
    },
    {
      key: "9",
      id: "data-protection",
      content: (
        <div className="space-y-2 text-site-text-2">
          <p>{t("terms.s9Intro")}</p>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li><strong>{t("terms.s9li1Label")}</strong> {t("terms.s9li1Body")}</li>
            <li><strong>{t("terms.s9li2Label")}</strong> {t("terms.s9li2Body")}</li>
            <li><strong>{t("terms.s9li3Label")}</strong> {t("terms.s9li3Body")}</li>
          </ul>
          <p className="text-xs">
            {t("terms.s9Before")}<a href="/privacy" className="text-accent underline font-semibold">{t("terms.s9Link")}</a>{t("terms.s9After")}
          </p>
        </div>
      ),
    },
    {
      key: "10",
      id: "third-party",
      content: (
        <p className="text-site-text-2">
          {t("terms.s10Before")}{CODE("drive.file")}{t("terms.s10Mid")}
          <a href="https://developers.google.com/terms/api-services-user-data-policy#additional_requirements_for_specific_api_scopes" target="_blank" rel="noopener noreferrer" className="text-accent underline">{t("terms.s10Link")}</a>
          {t("terms.s10After")}
        </p>
      ),
    },
    {
      key: "11",
      id: "warranties",
      content: <p className="text-site-text-2">{t("terms.s11")}</p>,
    },
    {
      key: "12",
      id: "liability",
      content: <p className="text-site-text-2">{t("terms.s12")}</p>,
    },
    {
      key: "13",
      id: "termination",
      content: <p className="text-site-text-2">{t("terms.s13")}</p>,
    },
    {
      key: "14",
      id: "complaints",
      content: (
        <div className="space-y-3 text-site-text-2 border border-site-border rounded-xl p-5 bg-site-surface shadow-xs">
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-site-accent mb-1">{t("terms.s14aTitle")}</h3>
            <p className="text-xs">{t("terms.s14aBody")}</p>
            <ul className="list-disc pl-5 mt-1.5 space-y-1 text-xs">
              <li><strong>{t("terms.s14li1Label")}</strong> <a href={`mailto:${EMAIL}`} className="text-accent underline font-semibold">{EMAIL}</a></li>
              <li><strong>{t("terms.s14li2Label")}</strong> {t("terms.s14li2Body")}</li>
              <li><strong>{t("terms.s14li3Label")}</strong> {t("terms.s14li3Body")}</li>
            </ul>
          </div>
          <div className="border-t border-site-border-subtle pt-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-site-accent mb-1">{t("terms.s14bTitle")}</h3>
            <p className="text-xs leading-relaxed">
              {t("terms.s14bBefore")}<a href={`mailto:${EMAIL}`} className="text-accent underline">{EMAIL}</a>{t("terms.s14bAfter")}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "15",
      id: "governing-law",
      content: <p className="text-site-text-2">{t("terms.s15")}</p>,
    },
    {
      key: "16",
      id: "contact",
      content: (
        <div className="text-site-text-2 space-y-1">
          <p>{t("terms.s16Intro")}</p>
          <p className="font-medium text-site-text pt-1"><strong>{t("terms.s16Name")}</strong></p>
          <p>
            {t("terms.s16EmailLabel")} <a href={`mailto:${EMAIL}`} className="text-accent underline">{EMAIL}</a> · {t("terms.s16WebLabel")} <a href="https://akusaradigital.com" target="_blank" rel="noopener noreferrer" className="text-accent underline">akusaradigital.com</a>
          </p>
        </div>
      ),
    },
  ];

  const titles: Record<string, string> = {
    "1": t("terms.t1"), "2": t("terms.t2"), "3": t("terms.t3"), "4": t("terms.t4"),
    "5": t("terms.t5"), "6": t("terms.t6"), "7": t("terms.t7"), "8": t("terms.t8"),
    "9": t("terms.t9"), "10": t("terms.t10"), "11": t("terms.t11"), "12": t("terms.t12"),
    "13": t("terms.t13"), "14": t("terms.t14"), "15": t("terms.t15"), "16": t("terms.t16"),
  };

  return (
    <StaticShell
      title={t("terms.pageTitle")}
      subtitle={t("terms.pageSubtitle")}
      lastUpdated={t("terms.lastUpdated")}
    >
      <div className="max-w-4xl space-y-8 font-site text-xs sm:text-sm text-site-text leading-relaxed">
        {sections.map((section, i) => (
          <Reveal key={section.key} delay={i * 0.03}>
            <section id={section.id} className="space-y-3 scroll-mt-24">
              <h2 className="text-base font-bold text-site-text">{titles[section.key]}</h2>
              {section.content}
            </section>
          </Reveal>
        ))}
      </div>
    </StaticShell>
  );
}
