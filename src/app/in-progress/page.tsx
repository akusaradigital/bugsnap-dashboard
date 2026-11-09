import { Suspense } from "react";
import { pageMeta } from "@/lib/pageMeta";
import { SiteNavbar } from "@/components/site/SiteNavbar";
import { SiteFooter } from "@/components/site/SiteFooter";
import { InProgressView } from "@/components/InProgressView";

export const metadata = pageMeta({
  title: "Feature Under Development",
  description:
    "This feature is currently under active development. BugSnap core screen recording and DevTools logging remain 100% free with unlimited quotas.",
  canonical: "/in-progress",
});

interface InProgressPageProps {
  searchParams?: {
    feature?: string;
  };
}

export default function InProgressPage({ searchParams }: InProgressPageProps) {
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
