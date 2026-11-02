import { pageMeta } from "@/lib/pageMeta";
import { HelpContent } from "./HelpContent";

export const metadata = pageMeta({
  title: "Help Center & FAQs",
  description: "Find answers to common questions about setting up the Chrome extension, managing permissions, and using the dashboard.",
  canonical: "/help",
});

export default function HelpPage() {
  return <HelpContent />;
}
