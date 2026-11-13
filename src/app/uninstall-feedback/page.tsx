import type { Metadata } from "next";
import { pageMeta } from "@/lib/pageMeta";
import { UninstallFeedbackContent } from "./UninstallFeedbackContent";

export const metadata: Metadata = {
  ...pageMeta({
    title: "We're Sorry to See You Go - BugSnap",
    description: "Tell us why you uninstalled BugSnap so we can improve.",
    canonical: "/uninstall-feedback",
  }),
  // Only reachable right after an uninstall - nothing worth indexing here.
  robots: { index: false, follow: false },
};

export default function UninstallFeedbackPage() {
  return <UninstallFeedbackContent />;
}
