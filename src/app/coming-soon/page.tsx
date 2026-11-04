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
