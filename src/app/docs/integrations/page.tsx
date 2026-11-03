import { pageMeta } from "@/lib/pageMeta";
import { IntegrationsDocsContent } from "./IntegrationsDocsContent";

export const metadata = pageMeta({
  title: "Integration Guides & Setup Tutorials - BugSnap",
  description:
    "Step-by-step tutorials to connect BugSnap to GitHub, Linear, Jira, Slack, Notion, GitLab, ClickUp, Asana, Azure DevOps, Aksora, SnapTest, Claude AI, ChatGPT, and custom Webhooks.",
  canonical: "/docs/integrations",
});

export default function IntegrationsDocsPage() {
  return <IntegrationsDocsContent />;
}
