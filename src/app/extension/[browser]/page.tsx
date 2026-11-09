import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { pageMeta } from "@/lib/pageMeta";
import { SiteNavbar as SiteHeader } from "@/components/site/SiteNavbar";
import { SiteFooter } from "@/components/site/SiteFooter";
import { BrowserProgressContent } from "./BrowserProgressContent";

export function generateStaticParams() {
  return [{ browser: "firefox" }];
}

interface PageProps {
  params: {
    browser: string;
  };
}

export function generateMetadata({ params }: PageProps): Metadata {
  if (params.browser === "firefox") {
    return pageMeta({
      title: "BugSnap for Firefox",
      description: "Install BugSnap from the official Mozilla Add-ons listing.",
      canonical: "/extension/firefox",
    });
  }

  return {};
}

export default function BrowserProgressPage({ params }: PageProps) {
  if (params.browser !== "firefox") {
    notFound();
  }

  return (
    <div className="min-h-screen bg-site-bg text-site-text flex flex-col font-site">
      <SiteHeader />
      <main className="flex-1 pt-10 sm:pt-14">
        <BrowserProgressContent browser="firefox" />
      </main>
      <SiteFooter />
    </div>
  );
}
