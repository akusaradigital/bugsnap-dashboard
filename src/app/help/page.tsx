import { pageMeta } from "@/lib/pageMeta";
import { HelpContent } from "./HelpContent";

export const metadata = pageMeta({
  title: "Help Center & FAQ",
  description: "Get help with BugSnap setup, Google Drive permissions, reporting bugs, and team management.",
  canonical: "/help",
});

export default function HelpPage() {
  return <HelpContent />;
}
