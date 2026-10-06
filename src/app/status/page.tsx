import { pageMeta } from "@/lib/pageMeta";
import { StatusContent } from "./StatusContent";

export const metadata = pageMeta({
  title: "System Status & Service Uptime - BugSnap",
  description: "Check the operational status of BugSnap services, API endpoints, and authentication.",
  canonical: "/status",
});

export default function StatusPage() {
  return <StatusContent />;
}
