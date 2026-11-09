import { Suspense } from "react";
import { pageMeta } from "@/lib/pageMeta";
import { SiteNavbar } from "@/components/site/SiteNavbar";
import { SiteFooter } from "@/components/site/SiteFooter";
import { InProgressView } from "@/components/InProgressView";

export const metadata = pageMeta({
  title: "Coming Soon - Under Development",
  description:
    "This feature is coming soon and currently under active development. Core BugSnap features remain 100% free.",
  canonical: "/coming-soon",
});

interface ComingSoonPageProps {
  searchParams?: {
    feature?: string;
  };
}

export default function ComingSoonPage({ searchParams }: ComingSoonPageProps) {
  const feature = searchParams?.feature;

  return (
    <div className="min-h-screen flex flex-col bg-site-bg text-site-text font-site transition-colors selection:bg-red-600/20 selection:text-red-700 dark:selection:text-red-400">
      <SiteNavbar />
      <main className="flex-1 flex items-center justify-center">
        <Suspense fallback={<div className="min-h-[50vh]" />}>
          <InProgressView featureName={feature} />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}
