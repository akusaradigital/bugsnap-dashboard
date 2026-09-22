import type { Metadata } from "next";
import { HowItWorksContent } from "./HowItWorksContent";

export const metadata: Metadata = {
  title: "How BugSnap Works - From Click to Fix",
  description:
    "Discover how BugSnap captures screen recordings, DevTools console logs, and network telemetry in 3 simple steps, saving files straight to your Google Drive.",
  alternates: {
    canonical: "/how-it-works",
  },
};

export default function HowItWorksPage() {
  return <HowItWorksContent />;
}
