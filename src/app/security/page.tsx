import { pageMeta } from "@/lib/pageMeta";
import { SecurityContent } from "./SecurityContent";

export const metadata = pageMeta({
  title: "Security & Privacy Architecture - BugSnap",
  description: "BugSnap stores your captures directly in your Google Drive. We never hold your recording files or store raw authentication credentials.",
  canonical: "/security",
});

export default function SecurityPage() {
  return <SecurityContent />;
}
