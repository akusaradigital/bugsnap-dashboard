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
    <div className="min-h-screen flex flex-col bg-site-bg text-site-text font-site transition-colors selection:bg-[#89BD49]/20 selection:text-[#46741A] dark:selection:text-[#A8D666]">
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
