import { pageMeta } from "@/lib/pageMeta";
import { PricingContent } from "./PricingContent";

export const metadata = pageMeta({
  title: "Pricing Plans - Free & Pro",
  description: "BugSnap pricing. Free screen recorder and bug reporting tool, with Pro, Pro+, and Enterprise plans for growing teams.",
  canonical: "/pricing",
});

export default function PricingPage() {
  return <PricingContent />;
}
