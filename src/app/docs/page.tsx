import { pageMeta } from "@/lib/pageMeta";
import { DocsContent } from "./DocsContent";

export const metadata = pageMeta({
  title: "Documentation - BugSnap",
  description: "Learn how to capture bugs, configure hotkeys, connect Google Drive, and share telemetry-rich bug reports with BugSnap.",
  canonical: "/docs",
});

export default function DocsPage() {
  return <DocsContent />;
}
