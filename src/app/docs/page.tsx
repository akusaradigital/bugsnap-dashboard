import type { Metadata } from "next";
import { DocsContent } from "./DocsContent";

export const metadata: Metadata = {
  title: "Documentation - BugSnap",
  description:
    "Learn how to capture bugs, configure hotkeys, connect Google Drive, and share telemetry-rich bug reports with BugSnap.",
  alternates: {
    canonical: "/docs",
  },
};

export default function DocsPage() {
  return <DocsContent />;
}
