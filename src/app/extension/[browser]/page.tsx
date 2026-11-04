import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { pageMeta } from "@/lib/pageMeta";
import { SiteNavbar as SiteHeader } from "@/components/site/SiteNavbar";
import { SiteFooter } from "@/components/site/SiteFooter";
import { BrowserProgressContent } from "./BrowserProgressContent";

export function generateStaticParams() {
  return [{ browser: "firefox" }, { browser: "edge" }];
}

interface PageProps {
  params: {
    browser: string;
  };
}

export function generateMetadata({ params }: PageProps): Metadata {
  if (params.browser === "firefox") {
    return pageMeta({
      title: "BugSnap for Mozilla Firefox - In Review",
      description:
        "BugSnap for Mozilla Firefox is currently under review on Mozilla Add-ons (AMO). Capture bugs with automated DevTools logs stored directly in Google Drive.",
      canonical: "/extension/firefox",
    });
  }

  if (params.browser === "edge") {
    return pageMeta({
      title: "BugSnap for Microsoft Edge - In Preparation",
      description:
        "BugSnap works on Microsoft Edge today via Chrome Web Store, with native Microsoft Edge Add-ons catalog release in preparation.",
      canonical: "/extension/edge",
    });
  }

  return {};
}

export default function BrowserProgressPage({ params }: PageProps) {
  if (params.browser !== "firefox" && params.browser !== "edge") {
    notFound();
  }

  return (
    <div className="min-h-screen bg-site-bg text-site-text flex flex-col font-site">
      <SiteHeader />
      <main className="flex-1 pt-10 sm:pt-14">
        <BrowserProgressContent browser={params.browser} />
      </main>
      <SiteFooter />
    </div>
  );
}
