import { pageMeta } from "@/lib/pageMeta";
import { HowItWorksContent } from "./HowItWorksContent";

export const metadata = pageMeta({
  title: "How BugSnap Works",
  description: "No complex setup. No dev tools. Just capture, record, redact, and share actionable bug reports.",
  canonical: "/how-it-works",
});

export default function HowItWorksPage() {
  return <HowItWorksContent />;
}
