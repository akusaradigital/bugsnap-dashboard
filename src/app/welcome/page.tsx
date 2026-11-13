import { pageMeta } from "@/lib/pageMeta";
import { WelcomeContent } from "./WelcomeContent";

export const metadata = {
  ...pageMeta({
    title: "Welcome to BugSnap - Quick Start Guide",
    description: "Get started with BugSnap in 60 seconds. Learn how to pin the extension, connect your Google Drive, and capture your first bug report.",
    canonical: "/welcome",
  }),
  // Only opened from the extension right after install (?installed=true).
  robots: { index: false, follow: false },
};

export default function WelcomePage() {
  return <WelcomeContent />;
}
