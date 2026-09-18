// Integration catalogue: pure data + its types. Lifted out of settings/page.tsx,
// which is a component file and had 160 lines of table in it.

export interface IntegrationField {
  key: string;
  label: string;
  type: "text" | "password" | "url";
  placeholder: string;
  hint?: string;
  required?: boolean;
}

export interface IntegrationDef {
  id: string;
  name: string;
  desc: string;
  iconSrc: string;
  fields: IntegrationField[];
}

// ── Integration catalogue (same order as extension editor.html) ─────────────
export const INTEGRATIONS: IntegrationDef[] = [
  {
    id: "aksora",
    name: "Aksora",
    desc: "Connect your Aksora QA Workspace to push bug tickets directly.",
    iconSrc: "/integrations/aksora.png",
    fields: [
      { key: "url", label: "Instance URL", type: "url", placeholder: "https://your-aksora-instance.com", required: true },
      { key: "apiKey", label: "API Key / Token", type: "password", placeholder: "aksora_...", hint: "Generate an API key with write permissions from Aksora > Settings > API Keys.", required: true },
    ],
  },
  {
    id: "snaptest",
    name: "SnapTest AI",
    desc: "Forward captures directly into automated test suites and test runs.",
    iconSrc: "/integrations/snaptest.png",
    fields: [
      { key: "url", label: "Runner / Server URL", type: "url", placeholder: "http://localhost:3000", required: true },
      { key: "apiKey", label: "API Key / Token", type: "password", placeholder: "Token (optional)", required: false },
    ],
  },
  {
    id: "slack",
    name: "Slack",
    desc: "Send bug captures and reports directly to Slack channels.",
    iconSrc: "/integrations/slack.png",
    fields: [
      { key: "webhookUrl", label: "Incoming Webhook URL", type: "url", placeholder: "https://hooks.slack.com/services/...", hint: "Create an Incoming Webhook in your Slack App configurations.", required: true },
      { key: "channel", label: "Default Channel", type: "text", placeholder: "#bug-reports (optional)", required: false },
    ],
  },
  {
    id: "webhook",
    name: "Webhooks",
    desc: "Send capture alerts to custom Slack, Discord, Zapier, or HTTP endpoints.",
    iconSrc: "/integrations/webhook.svg",
    fields: [
      { key: "url", label: "Webhook URL", type: "url", placeholder: "https://hooks.slack.com/... or https://discord.com/api/webhooks/...", hint: "We POST a JSON payload with capture URL, thumbnail, DevTools error diagnostics, and system metadata.", required: true },
    ],
  },
  {
    id: "github",
    name: "GitHub",
    desc: "Open GitHub issues directly from bug captures with diagnostic data.",
    iconSrc: "/integrations/github.png",
    fields: [
      { key: "token", label: "Personal Access Token (PAT)", type: "password", placeholder: "ghp_...", hint: "Requires 'repo' scope or fine-grained token with 'Issues: Read and Write'.", required: true },
      { key: "repo", label: "Repository (owner/repo)", type: "text", placeholder: "owner/repository", hint: "e.g. your-org/frontend-app", required: true },
    ],
  },
  {
    id: "linear",
    name: "Linear",
    desc: "Create Linear issues from bug captures with full metadata instantly.",
    iconSrc: "/integrations/linear.png",
    fields: [
      { key: "apiKey", label: "Linear API Key", type: "password", placeholder: "lin_api_...", hint: "Generate from Linear Settings > Account > Security & API.", required: true },
      { key: "teamId", label: "Team Key or ID", type: "text", placeholder: "ENG (or Team ID)", required: true },
    ],
  },
  {
    id: "jira",
    name: "Jira",
    desc: "Create Jira issue tickets automatically from captured bugs.",
    iconSrc: "/integrations/jira.png",
    fields: [
      { key: "host", label: "Atlassian Site URL", type: "url", placeholder: "https://yourcompany.atlassian.net", required: true },
      { key: "email", label: "Atlassian Account Email", type: "text", placeholder: "user@company.com", required: true },
      { key: "token", label: "Atlassian API Token", type: "password", placeholder: "ATATT3...", hint: "Generate from id.atlassian.com/manage-profile/security/api-tokens.", required: true },
      { key: "projectKey", label: "Jira Project Key", type: "text", placeholder: "BUG (or PROJ)", required: true },
    ],
  },
  {
    id: "gitlab",
    name: "GitLab",
    desc: "Open GitLab issues from bug captures instantly.",
    iconSrc: "/integrations/gitlab.png",
    fields: [
      { key: "url", label: "GitLab Host URL", type: "url", placeholder: "https://gitlab.com", hint: "Leave as https://gitlab.com or provide self-hosted URL.", required: true },
      { key: "token", label: "Personal / Project Access Token", type: "password", placeholder: "glpat-...", hint: "Requires 'api' scope.", required: true },
      { key: "project", label: "Project Path or ID", type: "text", placeholder: "group/project-name or 123456", required: true },
    ],
  },
  {
    id: "notion",
    name: "Notion",
    desc: "Log bug captures as database pages in your Notion workspace.",
    iconSrc: "/integrations/notion.png",
    fields: [
      { key: "token", label: "Internal Integration Secret", type: "password", placeholder: "secret_...", hint: "Create at notion.so/my-integrations and connect it to your database.", required: true },
      { key: "databaseId", label: "Database ID", type: "text", placeholder: "32-character database id from URL", required: true },
    ],
  },
  {
    id: "clickup",
    name: "ClickUp",
    desc: "Create ClickUp tasks from captures with one click.",
    iconSrc: "/integrations/clickup.png",
    fields: [
      { key: "token", label: "Personal API Token", type: "password", placeholder: "pk_...", hint: "Generate from ClickUp Settings > Apps > API Token.", required: true },
      { key: "listId", label: "List ID", type: "text", placeholder: "123456789", hint: "Found in your ClickUp List URL.", required: true },
    ],
  },
  {
    id: "asana",
    name: "Asana",
    desc: "Create Asana tasks and attach captures automatically.",
    iconSrc: "/integrations/asana.png",
    fields: [
      { key: "token", label: "Personal Access Token", type: "password", placeholder: "1/...", hint: "Generate from Asana Developer Console.", required: true },
      { key: "projectId", label: "Project GID", type: "text", placeholder: "1234567890", hint: "Found in your Asana project URL.", required: true },
    ],
  },
  {
    id: "azure",
    name: "Azure DevOps",
    desc: "File Azure DevOps work items directly from bug captures.",
    iconSrc: "/integrations/azure.png",
    fields: [
      { key: "orgUrl", label: "Organization URL", type: "url", placeholder: "https://dev.azure.com/my-org", required: true },
      { key: "token", label: "Personal Access Token (PAT)", type: "password", placeholder: "Personal Access Token", hint: "Requires Work Items (Read & Write) scope.", required: true },
      { key: "project", label: "Project Name", type: "text", placeholder: "MyProject", required: true },
    ],
  },
  {
    id: "claude",
    name: "Claude AI",
    desc: "Use Anthropic Claude AI to generate root cause summaries and repro steps.",
    iconSrc: "/integrations/claude.png",
    fields: [
      { key: "apiKey", label: "Anthropic API Key", type: "password", placeholder: "sk-ant-...", hint: "Generate from console.anthropic.com.", required: true },
      { key: "model", label: "Model Name", type: "text", placeholder: "claude-3-5-sonnet-latest (optional)", required: false },
    ],
  },
  {
    id: "chatgpt",
    name: "ChatGPT",
    desc: "Generate AI bug summaries, repro steps, and analysis via OpenAI.",
    iconSrc: "/integrations/chatgpt.png",
    fields: [
      { key: "apiKey", label: "OpenAI API Key", type: "password", placeholder: "sk-...", hint: "Generate from platform.openai.com/api-keys.", required: true },
      { key: "model", label: "Model Name", type: "text", placeholder: "gpt-4o-mini (optional)", required: false },
    ],
  },
];
