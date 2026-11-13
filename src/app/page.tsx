import type { Metadata } from "next";
import { pageMeta } from "@/lib/pageMeta";
import { HomeContent } from "./HomeContent";

// Server component so the title, description, and canonical are in the HTML
// response itself (not injected after JS runs), which is what crawlers index first.
export const metadata: Metadata = pageMeta({
  title: "BugSnap - Bug Reporter & Screen Recorder Chrome Extension",
  description:
    "Install BugSnap, the free Chrome & Firefox extension to record your screen, capture screenshots with console and network logs, and share bug reports with one link.",
  canonical: "/",
});

export default function Page() {
  return <HomeContent />;
}
