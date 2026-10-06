import { pageMeta } from "@/lib/pageMeta";
import { HowItWorksContent } from "./HowItWorksContent";

export const metadata = pageMeta({
  title: "How BugSnap Works - From Click to Fix",
  description: "Discover how BugSnap captures screen recordings, DevTools console logs, and network telemetry in 3 simple steps, saving files straight to your Google Drive.",
  canonical: "/how-it-works",
});

export default function HowItWorksPage() {
  return <HowItWorksContent />;
}
