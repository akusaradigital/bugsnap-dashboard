import { pageMeta } from "@/lib/pageMeta";
import { FeaturesContent } from "./FeaturesContent";

export const metadata = pageMeta({
  title: "Features - Bug Reporting & Screen Recorder",
  description: "Explore BugSnap features: Screen Recorder, DevTools log capture, instant sharing, and AI bug summaries.",
  canonical: "/features",
});

export default function FeaturesPage() {
  return <FeaturesContent />;
}
