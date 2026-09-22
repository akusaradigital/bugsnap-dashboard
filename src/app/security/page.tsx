import type { Metadata } from "next";
import { SecurityContent } from "./SecurityContent";

export const metadata: Metadata = {
  title: "Security & Privacy Architecture - BugSnap",
  description:
    "BugSnap stores your captures directly in your Google Drive. We never hold your recording files or store raw authentication credentials.",
  alternates: {
    canonical: "/security",
  },
};

export default function SecurityPage() {
  return <SecurityContent />;
}
