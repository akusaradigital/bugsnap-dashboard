import { NextResponse } from "next/server";
import { authenticatedUser } from "@/lib/google-drive";
import { assertPublicUrl } from "@/lib/safe-url";
import { isRateLimited } from "@/lib/rate-limit";
import { sanitizeErrorMessage, redactString } from "@/lib/redact";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await authenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (await isRateLimited(`integration-test:${user.id}`, 20, 60)) {
    return NextResponse.json(
      { error: "Too many test attempts. Please wait a minute." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const service = typeof body?.service === "string" ? body.service.toLowerCase().trim() : "";
    const config = (body?.config && typeof body.config === "object") ? (body.config as Record<string, string>) : {};

    if (!service) {
      return NextResponse.json({ error: "Service parameter is required" }, { status: 400 });
    }

    switch (service) {
      case "slack": {
        const webhookUrl = (config.webhookUrl || config.url)?.trim();
        if (!webhookUrl) throw new Error("Slack Incoming Webhook URL is required");
        await assertPublicUrl(webhookUrl);

        const res = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: "🚀 *BugSnap Integration Test*: Connection verified successfully! Bug reports will appear in this channel.",
          }),
          redirect: "manual",
          signal: AbortSignal.timeout(10000),
        });

        if (!res.ok) {
          const errText = await res.text().catch(() => "");
          throw new Error(errText || `Slack webhook returned HTTP ${res.status}`);
        }
        return NextResponse.json({ ok: true, message: "Slack webhook test delivered successfully!" });
      }

      case "webhook": {
        const targetUrl = config.url?.trim();
        if (!targetUrl) throw new Error("Webhook URL is required");
        await assertPublicUrl(targetUrl);

        const isDiscord = /discord(?:app)?\.com\/api\/webhooks/i.test(targetUrl);
        const payload = isDiscord
          ? {
              content: "🚀 **BugSnap Webhook Test**: Connection established successfully!",
              embeds: [
                {
                  title: "BugSnap Integration Verified",
                  description: "This endpoint is ready to receive instant capture alerts and diagnostics.",
                  color: 0x89bd49,
                  timestamp: new Date().toISOString(),
                },
              ],
            }
          : {
              event: "ping",
              source: "BugSnap",
              message: "Webhook connection test payload.",
              timestamp: new Date().toISOString(),
            };

        const res = await fetch(targetUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          redirect: "manual",
          signal: AbortSignal.timeout(10000),
        });

        if (!res.ok) {
          const errText = await res.text().catch(() => "");
          throw new Error(errText || `Webhook endpoint returned HTTP ${res.status}`);
        }
        return NextResponse.json({ ok: true, message: "Webhook test payload delivered successfully!" });
      }

      case "github": {
        const token = config.token?.trim();
        let repo = config.repo?.trim() || "";
        if (!token) throw new Error("GitHub Personal Access Token is required");
        if (!repo) throw new Error("Repository (owner/repo) is required");

        repo = repo.replace(/^https?:\/\/github\.com\//i, "").replace(/\/+$/, "");
        if (!repo.includes("/")) throw new Error("Repository format must be 'owner/repo'");

        // 1. Probe user identity
        const userRes = await fetch("https://api.github.com/user", {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github.v3+json",
            "User-Agent": "BugSnap-App",
          },
          signal: AbortSignal.timeout(10000),
        });
        const userData = await userRes.json().catch(() => ({}));
        if (!userRes.ok) {
          throw new Error(userData.message || `GitHub authentication failed (HTTP ${userRes.status})`);
        }

        // 2. Probe repo access
        const repoRes = await fetch(`https://api.github.com/repos/${repo}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github.v3+json",
            "User-Agent": "BugSnap-App",
          },
          signal: AbortSignal.timeout(10000),
        });
        const repoData = await repoRes.json().catch(() => ({}));
        if (!repoRes.ok) {
          throw new Error(repoData.message || `Cannot access repository '${repo}'`);
        }

        return NextResponse.json({
          ok: true,
          message: `Connected as @${userData.login || "user"}. Repository '${repoData.full_name}' verified!`,
        });
      }

      case "linear": {
        const apiKey = config.apiKey?.trim();
        const teamInput = config.teamId?.trim() || "";
        if (!apiKey) throw new Error("Linear API key is required");
        if (!teamInput) throw new Error("Linear Team Key or ID is required");

        const query = `
          query VerifyLinear {
            viewer {
              id
              name
              email
            }
            teams {
              nodes {
                id
                key
                name
              }
            }
          }
        `;

        const res = await fetch("https://api.linear.app/graphql", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: apiKey,
          },
          body: JSON.stringify({ query }),
          signal: AbortSignal.timeout(10000),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.errors) {
          throw new Error(data.errors?.[0]?.message || "Linear API authentication failed");
        }

        const viewer = data.data?.viewer;
        const teams = data.data?.teams?.nodes || [];
        const matched = teams.find(
          (t: { id: string; key: string; name: string }) =>
            t.key.toLowerCase() === teamInput.toLowerCase() || t.id.toLowerCase() === teamInput.toLowerCase()
        );

        if (!matched) {
          const available = teams.map((t: { key: string }) => t.key).join(", ");
          throw new Error(
            `Team '${teamInput}' not found. Available team keys: ${available || "none"}`
          );
        }

        return NextResponse.json({
          ok: true,
          message: `Connected as ${viewer?.name || "User"}. Team '${matched.name} (${matched.key})' verified!`,
        });
      }

      case "jira": {
        const host = config.host?.trim();
        const email = config.email?.trim();
        const token = config.token?.trim();
        const projectKey = config.projectKey?.trim().toUpperCase();

        if (!host || !email || !token || !projectKey) {
          throw new Error("Jira requires host URL, account email, API token, and project key");
        }

        const validatedHost = await assertPublicUrl(host);
        const hostUrl = validatedHost.origin.replace(/\/+$/, "");
        const authHeader = `Basic ${Buffer.from(`${email}:${token}`).toString("base64")}`;

        // 1. Verify user authentication
        const myselfRes = await fetch(`${hostUrl}/rest/api/2/myself`, {
          headers: { Authorization: authHeader, Accept: "application/json" },
          redirect: "manual",
          signal: AbortSignal.timeout(10000),
        });
        const myselfData = await myselfRes.json().catch(() => ({}));
        if (!myselfRes.ok) {
          throw new Error(myselfData.errorMessages?.[0] || `Jira authentication failed (HTTP ${myselfRes.status})`);
        }

        // 2. Verify project exists
        const projRes = await fetch(`${hostUrl}/rest/api/2/project/${projectKey}`, {
          headers: { Authorization: authHeader, Accept: "application/json" },
          redirect: "manual",
          signal: AbortSignal.timeout(10000),
        });
        const projData = await projRes.json().catch(() => ({}));
        if (!projRes.ok) {
          throw new Error(projData.errorMessages?.[0] || `Jira project '${projectKey}' not found or no permission`);
        }

        return NextResponse.json({
          ok: true,
          message: `Connected as ${myselfData.displayName || email}. Jira project '${projData.name} (${projectKey})' verified!`,
        });
      }

      case "gitlab": {
        const rawUrl = (config.url || "https://gitlab.com").trim();
        const token = config.token?.trim();
        let project = config.project?.trim() || "";

        if (!token) throw new Error("GitLab token is required");
        if (!project) throw new Error("GitLab project path or ID is required");

        const validatedHost = await assertPublicUrl(rawUrl);
        const hostUrl = validatedHost.origin.replace(/\/+$/, "");
        project = project.replace(/^https?:\/\/[^/]+\//i, "").replace(/\/+$/, "");

        // 1. Verify user token
        const userRes = await fetch(`${hostUrl}/api/v4/user`, {
          headers: { "PRIVATE-TOKEN": token },
          redirect: "manual",
          signal: AbortSignal.timeout(10000),
        });
        const userData = await userRes.json().catch(() => ({}));
        if (!userRes.ok) {
          throw new Error(userData.message || `GitLab authentication failed (HTTP ${userRes.status})`);
        }

        // 2. Verify project access
        const projRes = await fetch(`${hostUrl}/api/v4/projects/${encodeURIComponent(project)}`, {
          headers: { "PRIVATE-TOKEN": token },
          redirect: "manual",
          signal: AbortSignal.timeout(10000),
        });
        const projData = await projRes.json().catch(() => ({}));
        if (!projRes.ok) {
          throw new Error(projData.message || `GitLab project '${project}' not found`);
        }

        return NextResponse.json({
          ok: true,
          message: `Connected as @${userData.username || "user"}. Project '${projData.name_with_namespace || projData.name}' verified!`,
        });
      }

      case "notion": {
        const token = config.token?.trim();
        const rawDbId = config.databaseId?.trim() || "";

        if (!token) throw new Error("Notion integration secret token is required");
        if (!rawDbId) throw new Error("Notion database ID is required");

        const cleanDbId = rawDbId.replace(/^.*\/([a-f0-9]{32})(\?.*)?$/i, "$1").replace(/-/g, "");
        if (cleanDbId.length !== 32) {
          throw new Error("Invalid Notion database ID. Must be a 32-character hexadecimal string or database URL.");
        }

        // 1. Check bot user
        const botRes = await fetch("https://api.notion.com/v1/users/me", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Notion-Version": "2022-06-28",
          },
          signal: AbortSignal.timeout(10000),
        });
        const botData = await botRes.json().catch(() => ({}));
        if (!botRes.ok) {
          throw new Error(botData.message || `Notion authentication failed (HTTP ${botRes.status})`);
        }

        // 2. Check database access
        const dbRes = await fetch(`https://api.notion.com/v1/databases/${cleanDbId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Notion-Version": "2022-06-28",
          },
          signal: AbortSignal.timeout(10000),
        });
        const dbData = await dbRes.json().catch(() => ({}));
        if (!dbRes.ok) {
          throw new Error(
            dbData.message || "Database not found. Did you invite your integration to the database via '... > Add connections'?"
          );
        }

        const titleObj = dbData.title?.[0]?.plain_text || "Database";
        return NextResponse.json({
          ok: true,
          message: `Connected as '${botData.name || "Bot"}'. Database '${titleObj}' verified!`,
        });
      }

      case "clickup": {
        const token = config.token?.trim();
        let listId = config.listId?.trim() || "";
        if (!token) throw new Error("ClickUp API token is required");
        if (!listId) throw new Error("ClickUp List ID is required");

        // Extract numeric list ID if user pasted full URL (e.g. .../v/li/12345678)
        const match = listId.match(/(\d{6,15})/);
        if (match) listId = match[1];

        // 1. Check user token
        const userRes = await fetch("https://api.clickup.com/api/v2/user", {
          headers: { Authorization: token },
          signal: AbortSignal.timeout(10000),
        });
        const userData = await userRes.json().catch(() => ({}));
        if (!userRes.ok) {
          throw new Error(userData.err || userData.message || `ClickUp authentication failed (HTTP ${userRes.status})`);
        }

        // 2. Check list access
        const listRes = await fetch(`https://api.clickup.com/api/v2/list/${listId}`, {
          headers: { Authorization: token },
          signal: AbortSignal.timeout(10000),
        });
        const listData = await listRes.json().catch(() => ({}));
        if (!listRes.ok) {
          throw new Error(listData.err || listData.message || `ClickUp list #${listId} not found`);
        }

        return NextResponse.json({
          ok: true,
          message: `Connected as ${userData.user?.username || "user"}. List '${listData.name}' verified!`,
        });
      }

      case "asana": {
        const token = config.token?.trim();
        let projectId = config.projectId?.trim() || "";
        if (!token) throw new Error("Asana Personal Access Token is required");
        if (!projectId) throw new Error("Asana Project GID is required");

        // Extract GID if full URL entered
        const match = projectId.match(/(\d{6,25})/);
        if (match) projectId = match[1];

        // 1. Check user
        const userRes = await fetch("https://app.asana.com/api/1.0/users/me", {
          headers: { Authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(10000),
        });
        const userData = await userRes.json().catch(() => ({}));
        if (!userRes.ok) {
          throw new Error(userData.errors?.[0]?.message || `Asana authentication failed (HTTP ${userRes.status})`);
        }

        // 2. Check project
        const projRes = await fetch(`https://app.asana.com/api/1.0/projects/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(10000),
        });
        const projData = await projRes.json().catch(() => ({}));
        if (!projRes.ok) {
          throw new Error(projData.errors?.[0]?.message || `Asana project #${projectId} not found`);
        }

        return NextResponse.json({
          ok: true,
          message: `Connected as ${userData.data?.name || "user"}. Project '${projData.data?.name}' verified!`,
        });
      }

      case "azure": {
        const orgUrl = config.orgUrl?.trim();
        const token = config.token?.trim();
        const project = config.project?.trim();

        if (!orgUrl || !token || !project) {
          throw new Error("Azure DevOps requires organization URL, Personal Access Token (PAT), and project name");
        }

        await assertPublicUrl(orgUrl);
        const cleanOrg = orgUrl.replace(/\/+$/, "");
        const authHeader = `Basic ${Buffer.from(`:${token}`).toString("base64")}`;

        // 1. Check connection identity
        const connRes = await fetch(`${cleanOrg}/_apis/connectionData?api-version=7.0`, {
          headers: { Authorization: authHeader },
          redirect: "manual",
          signal: AbortSignal.timeout(10000),
        });
        const connData = await connRes.json().catch(() => ({}));
        if (!connRes.ok) {
          throw new Error(connData.message || `Azure DevOps authentication failed (HTTP ${connRes.status})`);
        }

        // 2. Check project existence
        const projRes = await fetch(`${cleanOrg}/_apis/projects/${encodeURIComponent(project)}?api-version=7.0`, {
          headers: { Authorization: authHeader },
          redirect: "manual",
          signal: AbortSignal.timeout(10000),
        });
        const projData = await projRes.json().catch(() => ({}));
        if (!projRes.ok) {
          throw new Error(projData.message || `Azure DevOps project '${project}' not found`);
        }

        const displayName = connData.authenticatedUser?.providerDisplayName || "User";
        return NextResponse.json({
          ok: true,
          message: `Connected as ${displayName}. Project '${projData.name}' verified!`,
        });
      }

      case "aksora": {
        const targetUrl = config.url?.trim();
        const apiKey = config.apiKey?.trim();
        if (!targetUrl || !apiKey) throw new Error("Aksora instance URL and API Key are required");

        await assertPublicUrl(targetUrl);
        const cleanUrl = targetUrl.replace(/\/+$/, "");

        const res = await fetch(`${cleanUrl}/api/public/v1/tasks?limit=1`, {
          headers: { Authorization: `Bearer ${apiKey}` },
          redirect: "manual",
          signal: AbortSignal.timeout(10000),
        });

        if (res.status === 401 || res.status === 403) {
          throw new Error("Aksora API Key is invalid or lacking permissions");
        }
        if (!res.ok && res.status !== 404 && res.status !== 200) {
          throw new Error(`Aksora server returned HTTP ${res.status}`);
        }

        return NextResponse.json({
          ok: true,
          message: "Aksora QA Workspace connection verified successfully!",
        });
      }

      case "snaptest": {
        const targetUrl = config.url?.trim();
        if (!targetUrl) throw new Error("SnapTest URL is required");

        await assertPublicUrl(targetUrl);
        const cleanUrl = targetUrl.replace(/\/+$/, "");

        const res = await fetch(`${cleanUrl}/api/health`, {
          headers: config.apiKey ? { Authorization: `Bearer ${config.apiKey.trim()}` } : {},
          redirect: "manual",
          signal: AbortSignal.timeout(10000),
        }).catch(async () => {
          // Fallback probe
          return fetch(cleanUrl, { redirect: "manual", signal: AbortSignal.timeout(5000) });
        });

        if (!res.ok && res.status >= 500) {
          throw new Error(`SnapTest server returned HTTP ${res.status}`);
        }

        return NextResponse.json({
          ok: true,
          message: "SnapTest test runner is reachable and active!",
        });
      }

      case "claude": {
        const apiKey = config.apiKey?.trim();
        if (!apiKey) throw new Error("Anthropic API key is required");

        const res = await fetch("https://api.anthropic.com/v1/models", {
          headers: {
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          signal: AbortSignal.timeout(10000),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error?.message || `Anthropic authentication failed (HTTP ${res.status})`);
        }

        return NextResponse.json({
          ok: true,
          message: "Anthropic API key verified! Ready to generate AI root cause summaries.",
        });
      }

      case "chatgpt": {
        const apiKey = config.apiKey?.trim();
        if (!apiKey) throw new Error("OpenAI API key is required");

        const res = await fetch("https://api.openai.com/v1/models", {
          headers: { Authorization: `Bearer ${apiKey}` },
          signal: AbortSignal.timeout(10000),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error?.message || `OpenAI authentication failed (HTTP ${res.status})`);
        }

        return NextResponse.json({
          ok: true,
          message: "OpenAI API key verified! Ready to generate AI bug summaries.",
        });
      }

      case "gemini": {
        const apiKey = config.apiKey?.trim();
        if (!apiKey) throw new Error("Google Gemini API key is required");

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
          signal: AbortSignal.timeout(10000),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error?.message || `Google Gemini authentication failed (HTTP ${res.status})`);
        }

        return NextResponse.json({
          ok: true,
          message: "Google Gemini API key verified! Ready to generate AI root cause summaries.",
        });
      }

      default:
        return NextResponse.json({ error: `Unsupported integration service: ${service}` }, { status: 400 });
    }
  } catch (err) {
    const rawMsg = err instanceof Error ? err.message : String(err);
    const safeMsg = sanitizeErrorMessage(redactString(rawMsg));
    return NextResponse.json({ error: safeMsg }, { status: 400 });
  }
}
