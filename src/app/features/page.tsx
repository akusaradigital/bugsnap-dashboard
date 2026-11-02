import { pageMeta } from "@/lib/pageMeta";
import { FeaturesContent } from "./FeaturesContent";

export const metadata = pageMeta({
  title: "Product Capabilities - Bug Reporting Toolkit | BugSnap",
  description:
    "From intelligent capture to automated debugging, BugSnap gives modern teams visibility, context, and AI-ready data without slowing down their workflow.",
  canonical: "/features",
});

export default function FeaturesPage() {
  return <FeaturesContent />;
}
