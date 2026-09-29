import type { Metadata } from "next";
import { StatusContent } from "./StatusContent";

export const metadata: Metadata = {
  title: "System Status & Service Uptime - BugSnap",
  description: "Check the operational status of BugSnap services, API endpoints, and authentication.",
  alternates: {
    canonical: "/status",
  },
};

export default function StatusPage() {
  return <StatusContent />;
}
