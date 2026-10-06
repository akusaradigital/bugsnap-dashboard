import { pageMeta } from "@/lib/pageMeta";
import { ExtensionContent } from "./ExtensionContent";

export const metadata = pageMeta({
  title: "BugSnap Chrome Extension - Screen Recorder with DevTools Logs",
  description: "Download the free BugSnap Chrome extension. Record screens and take screenshots with automated console logs, network errors, and system specs saved directly to your Google Drive.",
  canonical: "/extension",
});

export default function ExtensionPage() {
  return <ExtensionContent />;
}
