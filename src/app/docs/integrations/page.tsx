import { pageMeta } from "@/lib/pageMeta";
import { IntegrationsDocsContent } from "./IntegrationsDocsContent";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bugsnap.akusaraproject.my.id";

export const metadata = pageMeta({
  title: "Integration Guides & Setup Tutorials - BugSnap",
  description:
    "Step-by-step tutorials to connect BugSnap to GitHub, Linear, Jira, Slack, Notion, GitLab, ClickUp, Asana, Azure DevOps, Aksora, SnapTest, Claude AI, ChatGPT, and custom Webhooks.",
  canonical: "/docs/integrations",
});

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "TechArticle",
  headline: "Integration Guides & Setup Tutorials",
  description:
    "Step-by-step tutorials to connect BugSnap to GitHub, Linear, Jira, Slack, Notion, GitLab, ClickUp, Asana, Azure DevOps, Aksora, SnapTest, Claude AI, ChatGPT, and custom Webhooks.",
  url: `${siteUrl}/docs/integrations`,
  author: { "@type": "Organization", name: "BugSnap Team" },
  publisher: {
    "@type": "Organization",
    name: "BugSnap",
    logo: { "@type": "ImageObject", url: `${siteUrl}/icon.svg` },
  },
};

export default function IntegrationsDocsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <IntegrationsDocsContent />
    </>
  );
}
