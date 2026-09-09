import { Metadata } from "next";
import { PricingContent } from "./PricingContent";

export const metadata: Metadata = {
  title: "Pricing Plans - Free & Pro",
  description: "BugSnap pricing. Free forever screen recorder and bug reporting tool, with Pro, Pro+, and Enterprise plans for growing teams.",
};

export default function PricingPage() {
  return <PricingContent />;
}
