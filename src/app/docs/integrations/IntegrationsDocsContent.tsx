"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useT } from "@/components/I18nProvider";
import { SiteNavbar } from "@/components/site/SiteNavbar";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Reveal } from "@/components/site/motion";
import { Icon } from "@/lib/iconify";
import { INTEGRATIONS } from "@/lib/integrations";

type CategoryFilter = "all" | "tracker" | "alert" | "doc" | "ai";

interface IntegrationDetail {
  id: string;
  category: "tracker" | "alert" | "doc" | "ai";
  iconName: string;
  categoryLabel: string;
  scopeSummary: string;
  tokenUrl: string;
  tokenUrlLabel: string;
  steps: string[];
  samplePayload?: string;
  troubleshooting: { issue: string; resolution: string }[];
}

const INTEGRATION_DETAILS: Record<string, IntegrationDetail> = {
  github: {
    id: "github",
    category: "tracker",
    iconName: "logos:github-icon",
    categoryLabel: "Issue Tracker",
    scopeSummary: "Personal Access Token (classic) with 'repo' scope, or Fine-grained PAT with 'Issues: Read and write' on target repositories.",
    tokenUrl: "https://github.com/settings/tokens",
    tokenUrlLabel: "github.com/settings/tokens",
    steps: [
      "Navigate to GitHub Settings > Developer settings > Personal access tokens.",
      "Select 'Tokens (classic)' or 'Fine-grained tokens'. For classic tokens, check the 'repo' scope. For fine-grained tokens, grant 'Issues: Read and write' on your repository.",
      "Copy the generated token (starts with ghp_ or github_pat_).",
      "In BugSnap Workspace Settings > Integrations > GitHub, enter your PAT and target repository in owner/repo format (e.g. your-org/frontend-app).",
      "Click 'Test Connection' to verify repository access without creating an issue, then click 'Save Configuration'.",
    ],
    samplePayload: `## [BugSnap Bug Report] #142 - Checkout button unresponsive
**Environment:** Windows 11 · Chrome 132.0.0 · 1920x1080
**Source URL:** https://app.example.com/checkout
**Direct Capture Link:** https://bugsnap.akusaraproject.my.id/v/cap_9a8f2

### Console Diagnostics (2 Errors)
- [Uncaught TypeError] Cannot read properties of undefined (reading 'calculateTaxes') at checkout.js:142
- [Network 500] POST https://api.example.com/v1/charge - HTTP 500 Internal Server Error`,
    troubleshooting: [
      {
        issue: "HTTP 401 Unauthorized or 'Bad credentials'",
        resolution: "Your token has expired or was revoked. Generate a new token at github.com/settings/tokens.",
      },
      {
        issue: "HTTP 404 Not Found when testing connection",
        resolution: "Verify the repository name format is strictly 'owner/repo'. If using fine-grained tokens or SSO-protected organizations, ensure SAML SSO authorization is approved for the token.",
      },
    ],
  },
  linear: {
    id: "linear",
    category: "tracker",
    iconName: "logos:linear-icon",
    categoryLabel: "Issue Tracker",
    scopeSummary: "Linear Personal API Key with read and write privileges.",
    tokenUrl: "https://linear.app/settings/api",
    tokenUrlLabel: "linear.app/settings/api",
    steps: [
      "Open Linear and go to Settings > Account > Security & API.",
      "Under 'Personal API keys', click 'Create key' and give it a descriptive label (e.g. 'BugSnap Integration').",
      "Copy the generated API key (starts with lin_api_).",
      "Find your Team Key or Team UUID in Linear (e.g. 'ENG', 'FRONTEND', or the 36-character team UUID). BugSnap automatically resolves team keys like 'ENG' to their UUID.",
      "In BugSnap Workspace Settings > Linear, paste the API key and Team Key/ID, test the connection, and save.",
    ],
    samplePayload: `mutation IssueCreate {
  issueCreate(input: {
    title: "[BugSnap] Checkout button unresponsive"
    teamId: "4b92c1de-..."
    description: "Captured via BugSnap with full DevTools logs and environment telemetry..."
  }) { success issue { id identifier url } }
}`,
    troubleshooting: [
      {
        issue: "Could not find team with key or ID",
        resolution: "Confirm your team key exactly matches the team identifier shown in Linear issue prefixes (e.g. 'ENG-101' -> use 'ENG').",
      },
      {
        issue: "HTTP 403 Forbidden",
        resolution: "Ensure your Linear account has permission to view and file issues inside the specified team.",
      },
    ],
  },
  jira: {
    id: "jira",
    category: "tracker",
    iconName: "logos:jira",
    categoryLabel: "Issue Tracker",
    scopeSummary: "Atlassian API Token with Jira Cloud REST API access.",
    tokenUrl: "https://id.atlassian.com/manage-profile/security/api-tokens",
    tokenUrlLabel: "id.atlassian.com/manage-profile/security/api-tokens",
    steps: [
      "Log into Atlassian Account Security and click 'Create API token'.",
      "Label it 'BugSnap' and copy the token (starts with ATATT3...).",
      "Collect your Atlassian Site URL (e.g. https://yourcompany.atlassian.net) and your account email address.",
      "Find your Jira Project Key (e.g. 'PROJ' or 'BUG').",
      "In BugSnap Settings > Jira, fill in Host URL, Email, API Token, and Project Key. Click 'Test Connection' to verify project existence.",
    ],
    samplePayload: `{
  "fields": {
    "project": { "key": "BUG" },
    "summary": "[BugSnap] Checkout button unresponsive",
    "description": "Full capture link, environment details, console stack trace, and network failures...",
    "issuetype": { "name": "Bug" }
  }
}`,
    troubleshooting: [
      {
        issue: "HTTP 401 Unauthorized",
        resolution: "Check that the email address exactly matches the Atlassian ID account used to generate the API token.",
      },
      {
        issue: "HTTP 404 Project not found or user lacks browse project permission",
        resolution: "Verify the Project Key in Jira. Ensure your user account has 'Create Issues' and 'Browse Projects' permissions in that project's permission scheme.",
      },
    ],
  },
  gitlab: {
    id: "gitlab",
    category: "tracker",
    iconName: "logos:gitlab",
    categoryLabel: "Issue Tracker",
    scopeSummary: "Personal, Project, or Group Access Token with 'api' or 'read_api + write_repository' scope.",
    tokenUrl: "https://gitlab.com/-/user_settings/personal_access_tokens",
    tokenUrlLabel: "gitlab.com/-/user_settings/personal_access_tokens",
    steps: [
      "In GitLab, go to Preferences > Access Tokens (or Project Settings > Access Tokens).",
      "Create a token with the 'api' scope enabled.",
      "Specify your GitLab Host URL (leave as https://gitlab.com for cloud or provide your self-hosted instance URL).",
      "Enter your Project Path (e.g. my-group/my-project) or numeric Project ID.",
      "Paste your token in BugSnap Settings > GitLab, click 'Test Connection', and save.",
    ],
    samplePayload: `{
  "title": "[BugSnap] Checkout button unresponsive",
  "description": "Bug report captured via BugSnap.\\n\\n### Environment\\n- OS: Windows 11 · Chrome 132.0.0\\n- URL: https://app.example.com/checkout\\n\\n### Console Diagnostics (2 Errors)\\n- [Uncaught TypeError] Cannot read properties of undefined at checkout.js:142\\n- [Network 500] POST https://api.example.com/v1/charge\\n\\n[View BugSnap Capture](https://bugsnap.akusaraproject.my.id/v/cap_9a8f2)",
  "labels": "bug"
}`,
    troubleshooting: [
      {
        issue: "HTTP 404 Project Not Found",
        resolution: "Check whether your project is private. If private, the access token must belong to a member with at least Reporter or Developer role.",
      },
      {
        issue: "Self-hosted SSL certificate error",
        resolution: "Ensure your self-hosted GitLab instance has a valid CA-signed SSL certificate reachable from public networks.",
      },
    ],
  },
  notion: {
    id: "notion",
    category: "doc",
    iconName: "logos:notion-icon",
    categoryLabel: "Productivity & Docs",
    scopeSummary: "Internal Integration Secret connected to your target Notion database.",
    tokenUrl: "https://www.notion.so/profile/integrations",
    tokenUrlLabel: "notion.so/profile/integrations",
    steps: [
      "Visit notion.so/profile/integrations and click '+ New integration'.",
      "Name it 'BugSnap', select your workspace, and save to receive an 'Internal Integration Secret' (starts with secret_).",
      "Open your target Bug/Task Database in Notion. Click the '...' menu in the top-right corner > 'Connections' > search and connect 'BugSnap'.",
      "Copy the 32-character Database ID from the database page URL (the characters between notion.so/ and the ?v= query parameter).",
      "Paste the Secret and Database ID into BugSnap Settings > Notion, run 'Test Connection', and save.",
    ],
    samplePayload: `{
  "parent": { "database_id": "32_character_hex_database_id" },
  "properties": {
    "Name": {
      "title": [{ "text": { "content": "[BugSnap] Checkout button unresponsive" } }]
    }
  },
  "children": [
    {
      "object": "block",
      "type": "paragraph",
      "paragraph": {
        "rich_text": [{ "type": "text", "text": { "content": "Bug report captured via BugSnap with full DevTools logs and environment telemetry..." } }]
      }
    }
  ]
}`,
    troubleshooting: [
      {
        issue: "Could not find database with ID or integration has not been invited",
        resolution: "You must connect the integration to the database page: click '...' > 'Connections' > select your BugSnap integration.",
      },
      {
        issue: "Character limit errors in Notion blocks",
        resolution: "BugSnap automatically splits descriptions and stack traces exceeding Notion's 2,000-character block limit into sequential paragraph blocks.",
      },
    ],
  },
  clickup: {
    id: "clickup",
    category: "tracker",
    iconName: "logos:clickup-icon",
    categoryLabel: "Issue Tracker",
    scopeSummary: "ClickUp Personal API Token with workspace task creation rights.",
    tokenUrl: "https://app.clickup.com/settings/apps",
    tokenUrlLabel: "app.clickup.com/settings/apps",
    steps: [
      "In ClickUp, open your Workspace Settings > Apps > API Token.",
      "Click 'Generate' and copy your Personal API Token (starts with pk_).",
      "Open the target ClickUp List in your browser. The List ID is the numeric ID at the end of the URL (e.g. app.clickup.com/.../v/l/li/123456789 -> List ID is 123456789).",
      "Enter your Token and List ID in BugSnap Settings > ClickUp.",
      "Click 'Test Connection' to verify list access and task creation permissions.",
    ],
    samplePayload: `{
  "name": "[BugSnap] Checkout button unresponsive",
  "description": "Bug report captured via BugSnap.\\n\\n### Environment\\n- OS: Windows 11 · Chrome 132.0.0\\n- URL: https://app.example.com/checkout\\n\\n### Console Errors\\n- [error] Uncaught TypeError in checkout.js:142\\n\\n[View BugSnap Capture](https://bugsnap.akusaraproject.my.id/v/cap_9a8f2)",
  "priority": 2
}`,
    troubleshooting: [
      {
        issue: "HTTP 401 Token invalid",
        resolution: "Verify that the token was copied completely without trailing whitespaces.",
      },
      {
        issue: "HTTP 404 List not found",
        resolution: "Ensure you are using the List ID (not the Folder ID or Space ID).",
      },
    ],
  },
  asana: {
    id: "asana",
    category: "tracker",
    iconName: "logos:asana-icon",
    categoryLabel: "Issue Tracker",
    scopeSummary: "Asana Personal Access Token with task write access.",
    tokenUrl: "https://app.asana.com/0/my-apps",
    tokenUrlLabel: "app.asana.com/0/my-apps",
    steps: [
      "Go to Asana Developer Console (app.asana.com/0/my-apps).",
      "Under 'Personal access tokens', click '+ New access token'.",
      "Label it 'BugSnap' and copy the token (starts with 1/...).",
      "Open your target project in Asana. The Project GID is the numeric string in the URL (e.g. app.asana.com/0/1234567890/list).",
      "In BugSnap Settings > Asana, enter the token and Project GID, test the connection, and save.",
    ],
    samplePayload: `{
  "data": {
    "name": "[BugSnap] Checkout button unresponsive",
    "notes": "Bug report captured via BugSnap.\\n\\nEnvironment: Windows 11 · Chrome 132.0.0\\nSource URL: https://app.example.com/checkout\\nDirect Capture Link: https://bugsnap.akusaraproject.my.id/v/cap_9a8f2\\n\\nDevTools: 2 console errors detected.",
    "projects": ["1234567890"]
  }
}`,
    troubleshooting: [
      {
        issue: "HTTP 403 Forbidden or Project Not Accessible",
        resolution: "Verify the user account that created the PAT is a member of the target Asana project and workspace.",
      },
    ],
  },
  azure: {
    id: "azure",
    category: "tracker",
    iconName: "logos:azure-icon",
    categoryLabel: "Issue Tracker",
    scopeSummary: "Azure DevOps Personal Access Token with 'Work Items: Read & Write' scope.",
    tokenUrl: "https://dev.azure.com",
    tokenUrlLabel: "dev.azure.com (User settings > Personal access tokens)",
    steps: [
      "In Azure DevOps, click User Settings (top-right next to your avatar) > 'Personal access tokens'.",
      "Click '+ New Token', set Scopes to 'Custom defined', expand 'Work Items' and select 'Read & write'.",
      "Provide your Organization URL (e.g. https://dev.azure.com/your-org).",
      "Enter your Project Name exactly as named in Azure DevOps.",
      "Paste your PAT into BugSnap Settings > Azure DevOps, click 'Test Connection', and save.",
    ],
    samplePayload: `[
  {
    "op": "add",
    "path": "/fields/System.Title",
    "value": "[BugSnap] Checkout button unresponsive"
  },
  {
    "op": "add",
    "path": "/fields/System.Description",
    "value": "<p>Bug captured via BugSnap</p><h3>Environment</h3><p>OS: Windows 11<br/>Browser: Chrome 132.0.0</p><p><a href=\\"https://bugsnap.akusaraproject.my.id/v/cap_9a8f2\\">View BugSnap Capture</a></p>"
  }
]`,
    troubleshooting: [
      {
        issue: "HTTP 401 Unauthorized or Basic Auth failed",
        resolution: "Ensure third-party application access via PAT is not disabled in your Azure DevOps Organization Policies.",
      },
      {
        issue: "Project does not exist",
        resolution: "Azure DevOps project names are case-sensitive and must match the URL slug.",
      },
    ],
  },
  slack: {
    id: "slack",
    category: "alert",
    iconName: "logos:slack-icon",
    categoryLabel: "Chat & Alerts",
    scopeSummary: "Incoming Webhook integration in your Slack workspace.",
    tokenUrl: "https://api.slack.com/apps",
    tokenUrlLabel: "api.slack.com/apps",
    steps: [
      "Go to api.slack.com/apps and click 'Create New App' > 'From scratch'.",
      "Select 'Incoming Webhooks' under Features, toggle 'Activate Incoming Webhooks' to On.",
      "Click 'Add New Webhook to Workspace', choose the channel (e.g. #bugs or #qa-alerts), and click Allow.",
      "Copy the Incoming Webhook URL (starts with https://hooks.slack.com/services/...).",
      "In BugSnap Settings > Slack, paste the Webhook URL and optional default channel. Click 'Test Connection' to receive a verification alert in Slack.",
    ],
    samplePayload: `{
  "text": "[BugSnap] Screenshot - Checkout button unresponsive",
  "blocks": [
    {
      "type": "section",
      "text": { "type": "mrkdwn", "text": "*[BugSnap]* Screenshot - *Checkout button unresponsive*\\n<https://bugsnap.akusaraproject.my.id/v/cap_123|View Capture & DevTools Diagnostics>" }
    }
  ]
}`,
    troubleshooting: [
      {
        issue: "HTTP 404 or 'channel_not_found'",
        resolution: "Ensure the webhook was authorized for the correct channel and has not been archived or deleted.",
      },
    ],
  },
  webhook: {
    id: "webhook",
    category: "alert",
    iconName: "lucide:webhook",
    categoryLabel: "Chat & Alerts",
    scopeSummary: "Any HTTP POST endpoint (Discord Webhooks, Zapier, Make.com, n8n, or internal servers).",
    tokenUrl: "https://discord.com/developers/docs/resources/webhook",
    tokenUrlLabel: "Discord Webhook Docs",
    steps: [
      "Discord: Open Server Settings > Integrations > Webhooks > 'New Webhook' > Copy Webhook URL.",
      "Zapier / Make / n8n: Create a 'Catch Hook' trigger and copy the generated webhook endpoint URL.",
      "Custom Server: Create an HTTP POST route that accepts JSON payloads.",
      "In BugSnap Settings > Webhooks, enter your destination URL.",
      "Click 'Test Connection' — BugSnap validates SSRF safety and sends a ping payload. Click 'Save Configuration'.",
    ],
    samplePayload: `{
  "event": "capture.created",
  "content": "**[BugSnap]** Screenshot - Checkout button unresponsive",
  "embeds": [
    {
      "title": "Checkout button unresponsive",
      "url": "https://bugsnap.akusaraproject.my.id/v/cap_123",
      "color": 15680580,
      "fields": [
        { "name": "Platform", "value": "Windows / Chrome", "inline": true },
        { "name": "URL", "value": "https://app.example.com", "inline": true },
        { "name": "Errors", "value": "2", "inline": true }
      ]
    }
  ],
  "capture": {
    "id": "cap_123",
    "title": "Checkout button unresponsive",
    "site_url": "https://app.example.com",
    "dev_logs": [ ... ]
  }
}`,
    troubleshooting: [
      {
        issue: "SSRF Protection Error (Private or loopback address blocked)",
        resolution: "Webhooks must resolve to publicly routable internet domains or IPs. Internal IP addresses (127.0.0.1, 192.168.x.x, 10.x.x.x) are blocked for safety.",
      },
    ],
  },
  aksora: {
    id: "aksora",
    category: "tracker",
    iconName: "lucide:layers",
    categoryLabel: "Issue Tracker",
    scopeSummary: "Aksora QA Workspace API Key with write ticket permissions.",
    tokenUrl: "/settings",
    tokenUrlLabel: "Aksora Workspace > Settings > API Keys",
    steps: [
      "In your Aksora instance, navigate to Settings > Workspace > API Keys.",
      "Generate an API token with 'captures:write' and 'tickets:create' scope.",
      "Enter your Aksora Instance URL (e.g. https://qa.aksoraproject.my.id) and API key in BugSnap Settings.",
      "Click 'Test Connection' to verify workspace pairing and token validity.",
    ],
    samplePayload: `{
  "data": {
    "title": "[BugSnap] Checkout button unresponsive",
    "project": "General",
    "relatedFeature": "BugSnap Capture",
    "category": "Bug Fix",
    "status": "todo",
    "priority": "P1",
    "description": "Bug report captured via BugSnap with full DevTools telemetry.",
    "acceptanceCriteria": "Verify bug reported in BugSnap capture is resolved.",
    "evidence": "https://bugsnap.akusaraproject.my.id/v/cap_9a8f2"
  }
}`,
    troubleshooting: [
      {
        issue: "HTTP 401 Invalid Token",
        resolution: "Check if the API key in Aksora has expired or has been revoked by a workspace administrator.",
      },
    ],
  },
  snaptest: {
    id: "snaptest",
    category: "ai",
    iconName: "lucide:cpu",
    categoryLabel: "AI & Automation",
    scopeSummary: "SnapTest AI Runner endpoint or automated test executor URL.",
    tokenUrl: "/settings",
    tokenUrlLabel: "SnapTest Runner Configuration",
    steps: [
      "Launch your SnapTest AI Runner server or cloud endpoint (e.g. https://runner.snaptest.ai or local runner).",
      "Obtain your runner authentication token (optional for local endpoints).",
      "In BugSnap Settings > SnapTest AI, configure the Runner URL and Token.",
      "Click 'Test Connection' — BugSnap queries the runner health endpoint (/health or /api/status) to verify connectivity.",
    ],
    samplePayload: `{
  "captureId": "cap_9a8f2",
  "title": "Checkout button unresponsive",
  "description": "User clicks checkout button but total taxes fail to calculate.",
  "type": "video",
  "driveUrl": "https://bugsnap.akusaraproject.my.id/v/cap_9a8f2",
  "siteUrl": "https://app.example.com/checkout",
  "os": "Windows 11",
  "browser": "Chrome 132.0.0",
  "devLogs": [
    { "type": "console", "level": "error", "message": "calculateTaxes is undefined" }
  ]
}`,
    troubleshooting: [
      {
        issue: "Runner health check timeout",
        resolution: "Ensure your runner server is running and accessible over HTTP/HTTPS from the BugSnap dashboard server.",
      },
    ],
  },
  claude: {
    id: "claude",
    category: "ai",
    iconName: "logos:anthropic-icon",
    categoryLabel: "AI & Automation",
    scopeSummary: "Anthropic API Key with Claude 3.5 Sonnet access.",
    tokenUrl: "https://console.anthropic.com/settings/keys",
    tokenUrlLabel: "console.anthropic.com/settings/keys",
    steps: [
      "Sign in to Anthropic Console at console.anthropic.com.",
      "Navigate to Settings > API Keys and click 'Create Key'.",
      "Copy your API key (starts with sk-ant-).",
      "In BugSnap Settings > Claude AI, enter your key. Optionally select your model (default: claude-3-5-sonnet-latest).",
      "Click 'Test Connection' — BugSnap runs a lightweight auth check without consuming chat tokens.",
    ],
    samplePayload: `### AI Root Cause & Repro Analysis (Claude 3.5 Sonnet)

1. Steps to Reproduce:
   - Navigate to /checkout with 1+ items in cart.
   - Click "Proceed to Payment".
   - Observed: Button spinner hangs; calculateTaxes fails.

2. Root Cause Analysis:
   - Uncaught TypeError at checkout.js:142 indicates state.cart.taxDetails is undefined before the async tax calculation promise resolves.

3. Recommended Fix:
   - Add optional chaining cart?.taxDetails?.rate or supply a fallback default tax object before mounting the checkout submit handler.`,
    troubleshooting: [
      {
        issue: "HTTP 401 Invalid API Key",
        resolution: "Check that the API key was copied completely without leading or trailing spaces.",
      },
      {
        issue: "Credit balance is too low",
        resolution: "Ensure your Anthropic account has available prepaid credits in Billing.",
      },
    ],
  },
  chatgpt: {
    id: "chatgpt",
    category: "ai",
    iconName: "logos:openai-icon",
    categoryLabel: "AI & Automation",
    scopeSummary: "OpenAI API Key with Chat Completions permissions.",
    tokenUrl: "https://platform.openai.com/api-keys",
    tokenUrlLabel: "platform.openai.com/api-keys",
    steps: [
      "Open platform.openai.com and navigate to API Keys.",
      "Click '+ Create new secret key', name it 'BugSnap', and copy the key (starts with sk-).",
      "In BugSnap Settings > ChatGPT, paste your API key and optionally set the model (default: gpt-4o-mini).",
      "Click 'Test Connection' to verify API key validity without incurring prompt token charges.",
    ],
    samplePayload: `### AI Bug Diagnostic & Fix Guide (GPT-4o)

1. Steps to Reproduce:
   - Open https://app.example.com/checkout
   - Trigger payment submission with empty tax field
   - Network payload fails with HTTP 500 charge error

2. Root Cause:
   - Backend charge API rejects missing tax computation payload due to client-side unhandled exception.

3. Fix:
   - Validate tax calculation synchronously before dispatching the POST /v1/charge request.`,
    troubleshooting: [
      {
        issue: "HTTP 401 Incorrect API key provided",
        resolution: "Generate a new secret key at platform.openai.com/api-keys and paste it into BugSnap Settings.",
      },
      {
        issue: "HTTP 429 You exceeded your current quota",
        resolution: "Check your OpenAI account billing dashboard to add payment credits.",
      },
    ],
  },
  gemini: {
    id: "gemini",
    category: "ai",
    iconName: "",
    categoryLabel: "AI & Automation",
    scopeSummary: "Google AI Studio API Key with Gemini 1.5/2.0 model access.",
    tokenUrl: "https://aistudio.google.com/app/apikey",
    tokenUrlLabel: "aistudio.google.com/app/apikey",
    steps: [
      "Sign in to Google AI Studio at aistudio.google.com.",
      "Navigate to 'Get API key' and click 'Create API key' in a new or existing Google Cloud project.",
      "Copy your generated API key (starts with AIzaSy...).",
      "In BugSnap Workspace Settings > Integrations > Google Gemini, paste your API key and optionally set the model (default: gemini-1.5-flash).",
      "Click 'Test Connection' or 'Pull Live Data' to verify connectivity and available models with zero chat spend.",
    ],
    samplePayload: `### AI Root Cause & Repro Analysis (Gemini 1.5 Flash)

1. Steps to Reproduce:
   - Load /checkout with multiple cart items.
   - Click "Submit Payment".
   - Unhandled rejection halts execution.

2. Root Cause Analysis:
   - TypeError: calculateTaxes is not a function at checkout.js:142. The tax calculator script failed to load before user interaction.

3. Recommended Fix:
   - Ensure the tax computation bundle is loaded statically or wrap the invocation in a safety check before triggering payment.`,
    troubleshooting: [
      {
        issue: "HTTP 400 or API_KEY_INVALID",
        resolution: "Ensure your API key from Google AI Studio is copied accurately without extra characters.",
      },
      {
        issue: "Quota exceeded or permission denied",
        resolution: "Check your Google Cloud / AI Studio project quota and ensure Generative Language API is enabled.",
      },
    ],
  },
};

export function IntegrationsDocsContent() {
  const { t } = useT();
  const [activeTab, setActiveTab] = useState<CategoryFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const filteredIntegrations = useMemo(() => {
    return INTEGRATIONS.filter((item) => {
      const details = INTEGRATION_DETAILS[item.id];
      const matchesTab = activeTab === "all" || (details && details.category === activeTab);
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [activeTab, searchQuery]);

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100 font-site flex flex-col bg-white dark:bg-site-surface relative overflow-hidden">
      {/* Background glow effects */}
      <div
        className="absolute top-0 right-1/4 w-[500px] h-[360px] bg-emerald-300/15 dark:bg-emerald-500/10 blur-[130px] pointer-events-none rounded-full"
        aria-hidden="true"
      />
      <div
        className="absolute top-12 left-1/4 w-[420px] h-[320px] bg-emerald-200/20 dark:bg-emerald-500/5 blur-[110px] pointer-events-none rounded-full"
        aria-hidden="true"
      />

      <SiteNavbar />

      <main id="main-content" className="flex-1 relative z-10">
        {/* Hero Section */}
        <div className="pt-8 sm:pt-14 pb-8 sm:pb-12 text-center">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <Reveal delay={0}>
              <nav
                className="inline-flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-xs text-slate-500 dark:text-slate-400 mb-5 max-w-full px-2"
                aria-label="Breadcrumb"
              >
                <Link
                  href="/"
                  className="hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  {t("landing.home") || "Home"}
                </Link>
                <span className="text-slate-400 dark:text-slate-600" aria-hidden="true">
                  &gt;
                </span>
                <Link
                  href="/docs"
                  className="hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  {t("docs.title") || "Documentation"}
                </Link>
                <span className="text-slate-400 dark:text-slate-600" aria-hidden="true">
                  &gt;
                </span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  {t("docs.navIntegrations") || "Integrations"}
                </span>
              </nav>
            </Reveal>

            <Reveal delay={0.07}>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.12]">
                {t("docs.integrationsTitle") || "Integration guides &"}
                <br />
                <span className="text-blue-600 dark:text-blue-500">
                  {t("docs.integrationsTitleHighlight") || "setup tutorials"}
                </span>
              </h1>
            </Reveal>

            <Reveal delay={0.14}>
              <p className="mt-4 text-sm sm:text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                {t("docs.integrationsSubtitle") ||
                  "Connect your development and QA toolchain to file actionable bug reports with zero manual typing."}
              </p>
            </Reveal>

            {/* Quick Actions Bar */}
            <Reveal delay={0.2}>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/settings"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition-colors"
                >
                  <Icon icon="lucide:settings" className="w-4 h-4" />
                  {t("docs.goToSettings") || "Configure in Workspace Settings"}
                </Link>
                <a
                  href="#quick-test"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs sm:text-sm shadow-2xs transition-colors"
                >
                  <Icon icon="lucide:shield-check" className="w-4 h-4 text-emerald-500" />
                  {t("docs.howWeTest") || "Universal Credential Probe"}
                </a>
              </div>
            </Reveal>
          </div>
        </div>

        {/* Content Container */}
        <div className="mx-auto max-w-6xl px-4 sm:px-6 pb-12 sm:pb-16 space-y-8 sm:space-y-10">
          {/* Universal Credential Probe Notice Card */}
          <Reveal delay={0.1}>
            <div
              id="quick-test"
              className="rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 scroll-mt-24"
            >
              <div className="space-y-1.5 min-w-0 max-w-3xl">
                <div className="flex items-center gap-2">
                  <Icon icon="lucide:check-circle-2" className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    {t("docs.probeTitle") || "Pre-flight Verification Engine Built-In"}
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {t("docs.probeDesc") ||
                    "Every integration in BugSnap features a non-mutating 'Test Connection' probe. It validates your tokens, project keys, and database permissions using read-only API calls — without spamming your issue trackers with fake test tickets or consuming chat prompt quotas."}
                </p>
              </div>
              <Link
                href="/settings"
                className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-slate-800 shadow-2xs transition-colors"
              >
                {t("docs.openSettings") || "Test in Settings →"}
              </Link>
            </div>
          </Reveal>

          {/* Filter Bar & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/80 dark:border-slate-800">
            {/* Category tabs */}
            <div role="tablist" aria-label="Integration categories" className="flex flex-wrap gap-1.5">
              {[
                { id: "all", label: t("docs.catAll") || "All" },
                { id: "tracker", label: t("docs.catTrackers") || "Issue Trackers" },
                { id: "alert", label: t("docs.catAlerts") || "Chat & Alerts" },
                { id: "doc", label: t("docs.catDocs") || "Docs & Productivity" },
                { id: "ai", label: t("docs.catAi") || "AI & Automation" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id as CategoryFilter)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    activeTab === tab.id
                      ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xs"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative min-w-0 w-full sm:w-64">
              <Icon
                icon="lucide:search"
                className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                placeholder={t("docs.searchIntegrations") || "Search integrations..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-9 pr-3 py-2 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          {/* Integration Cards List */}
          <div className="space-y-10 sm:space-y-14">
            {filteredIntegrations.map((item) => {
              const details = INTEGRATION_DETAILS[item.id];
              return (
                <section
                  key={item.id}
                  id={item.id}
                  className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-4 sm:p-8 space-y-6 scroll-mt-24"
                >
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 p-2.5 flex items-center justify-center shrink-0">
                        {details?.iconName ? (
                          <Icon icon={details.iconName} className="w-7 h-7" />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.iconSrc}
                            alt={item.name}
                            className="w-7 h-7 object-contain"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = "none";
                            }}
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center flex-wrap gap-2">
                          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                            {item.name}
                          </h2>
                          {details?.categoryLabel && (
                            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {details.categoryLabel}
                            </span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                          {item.desc}
                        </p>
                      </div>
                    </div>

                    <Link
                      href="/settings"
                      className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                    >
                      <Icon icon="lucide:plug" className="w-3.5 h-3.5" />
                      {t("docs.connectInSettings") || "Connect in Settings"}
                    </Link>
                  </div>

                  {/* Required Fields & Scopes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Fields */}
                    <div className="rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 p-4 space-y-2 min-w-0">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {t("docs.requiredFields") || "Configured Fields"}
                      </h3>
                      <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                        {item.fields.map((f) => (
                          <li key={f.key} className="flex items-start gap-1.5 flex-wrap min-w-0">
                            <span className="font-semibold text-slate-900 dark:text-white">{f.label}:</span>
                            <span className="text-slate-500 dark:text-slate-400">
                              {f.required ? "(Required)" : "(Optional)"}
                            </span>
                            {f.hint && (
                              <span className="text-slate-400 dark:text-slate-500 text-[11px] block mt-0.5 break-words">
                                — {f.hint}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Scopes & Token URL */}
                    <div className="rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 p-4 space-y-2 min-w-0">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {t("docs.requiredScopes") || "Permissions & Scope"}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {details?.scopeSummary || "Personal API token or incoming webhook endpoint."}
                      </p>
                      {details?.tokenUrl && (
                        <div className="pt-1">
                          <a
                            href={details.tokenUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline max-w-full min-w-0"
                          >
                            <Icon icon="lucide:external-link" className="w-3.5 h-3.5 shrink-0" />
                            <span className="break-all">{details.tokenUrlLabel || "Token Dashboard"}</span>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Step-by-Step Tutorial */}
                  {details?.steps && details.steps.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {t("docs.stepByStep") || "Step-by-Step Setup Guide"}
                      </h3>
                      <ol className="space-y-2.5">
                        {details.steps.map((step, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <span className="shrink-0 w-6 h-6 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="min-w-0 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed pt-0.5 break-words">
                              {step}
                            </span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                  {/* Sample Payload (if available) */}
                  {details?.samplePayload && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          {t("docs.samplePayload") || "Delivered Payload Preview"}
                        </h3>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(details.samplePayload || "", `payload-${item.id}`)}
                          className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                          <Icon icon={copiedKey === `payload-${item.id}` ? "lucide:check" : "lucide:copy"} className="w-3.5 h-3.5" />
                          {copiedKey === `payload-${item.id}` ? "Copied" : "Copy"}
                        </button>
                      </div>
                      <div className="relative rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 p-3.5 font-mono text-[11px] sm:text-xs text-slate-300 overflow-x-auto min-w-0 leading-relaxed">
                        <pre className="whitespace-pre-wrap break-all sm:break-normal">
                          {details.samplePayload}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Troubleshooting Guide */}
                  {details?.troubleshooting && details.troubleshooting.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {t("docs.troubleshooting") || "Common Issues & Resolutions"}
                      </h3>
                      <div className="space-y-2">
                        {details.troubleshooting.map((item, idx) => (
                          <div
                            key={idx}
                            className="rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 p-3 text-xs space-y-1"
                          >
                            <div className="font-semibold text-amber-900 dark:text-amber-300 flex items-center gap-1.5 min-w-0">
                              <Icon icon="lucide:alert-triangle" className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                              <span className="min-w-0 break-words">{item.issue}</span>
                            </div>
                            <p className="text-amber-800 dark:text-amber-200/90 pl-5 leading-relaxed break-words">
                              {item.resolution}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
