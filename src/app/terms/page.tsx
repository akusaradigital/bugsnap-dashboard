import { pageMeta } from "@/lib/pageMeta";
import { LegalTermsContent } from "./LegalTermsContent";

export const metadata = pageMeta({
  title: "Terms of Service - BugSnap",
  description:
    "Terms of service, acceptable use policies, and privacy commitments for BugSnap Chrome Extension and Dashboard.",
  canonical: "/terms",
});

export default function TermsPage() {
  return <LegalTermsContent />;
}
