import { pageMeta } from "@/lib/pageMeta";
import { LegalPrivacyContent } from "./LegalPrivacyContent";

export const metadata = pageMeta({
  title: "Privacy Policy - BugSnap",
  description: "Privacy policy and data handling practices for BugSnap Chrome Extension and Dashboard.",
  canonical: "/privacy",
});

export default function PrivacyPolicyPage() {
  return <LegalPrivacyContent />;
}
