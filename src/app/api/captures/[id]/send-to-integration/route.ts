import { NextResponse } from "next/server";
import { authenticatedUser } from "@/lib/google-drive";
import { createServiceClient } from "@/lib/supabase-server";
import { decompressDevLogs } from "@/lib/devlogs-compression";
import { assertPublicUrl } from "@/lib/safe-url";
import { redactString } from "@/lib/redact";
import { isUuid } from "@/lib/google-drive-values";

export const runtime = "nodejs";

function summarizeDevLogs(devLogs: unknown): string {
  if (!devLogs) return "";
  if (Array.isArray(devLogs)) {
    const errorLogs = devLogs
      .filter((l) => l && typeof l === "object" && (l.type === "console" || l.level === "error" || l.status >= 400))
      .slice(0, 10)
      .map((l) => {
        const raw = `[${l.type || l.level || "error"}] ${l.message || l.text || l.url || JSON.stringify(l)}`;
        return `- ${redactString(raw)}`;
      });
    return errorLogs.length ? `\n\n### Console & Network Errors\n${errorLogs.join("\n")}` : "";
  }
  if (typeof devLogs === "object") {
    const summary = devLogs as { topErrors?: string[]; failedRequests?: number; errors?: number };
    const parts: string[] = [];
    if (summary.errors) parts.push(`Errors count: ${summary.errors}`);
    if (summary.failedRequests) parts.push(`Failed requests: ${summary.failedRequests}`);
    if (Array.isArray(summary.topErrors) && summary.topErrors.length) {
      parts.push(`Top errors:\n${summary.topErrors.map((e) => `- ${redactString(e)}`).join("\n")}`);
    }
    return parts.length ? `\n\n### DevTools Summary\n${parts.join("\n")}` : "";
  }
  return "";
}

interface IntegrationDeliveryEntry {
  success: number;
  fail: number;
  lastFailAt: string | null;
  lastFailMessage: string | null;
}

// O(1)-storage rolling counter, not a per-delivery log - same app_settings
// upsert pattern as the promo banner. Never let a stats failure break the
// actual integration response.
async function recordIntegrationDelivery(
  supabase: ReturnType<typeof createServiceClient>,
  service: string,
  ok: boolean,
  errorMessage?: string
) {
  try {
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "integration_delivery_stats")
      .maybeSingle();
    const stats = (data?.value as Record<string, IntegrationDeliveryEntry>) || {};
    const entry: IntegrationDeliveryEntry = stats[service] || {
      success: 0,
      fail: 0,
      lastFailAt: null,
      lastFailMessage: null,
    };
    if (ok) {
      entry.success += 1;
    } else {
      entry.fail += 1;
      entry.lastFailAt = new Date().toISOString();
      entry.lastFailMessage = redactString((errorMessage || "").slice(0, 300));
    }
    stats[service] = entry;
    await supabase
      .from("app_settings")
      .upsert({ key: "integration_delivery_stats", value: stats, updated_at: new Date().toISOString() });
  } catch (err) {
    console.warn("[Integration Delivery Stats] Failed to persist:", err);
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const user = await authenticatedUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await Promise.resolve(params);
    if (!id || !isUuid(id)) {
      return NextResponse.json({ error: "Invalid capture ID" }, { status: 400 });
    }
    const body = await req.json().catch(() => ({}));
    const service = (body.service || "").toLowerCase();

    if (!service) {
      return NextResponse.json({ error: "Integration service is required" }, { status: 400 });
    }

    const supabase = createServiceClient();

    // 1. Fetch capture
    const { data: capture, error: capError } = await supabase
      .from("captures")
      .select("id, title, description, type, drive_url, dev_logs, os, browser, site_url, window_size, workspace_id, project_id")
      .eq("id", id)
      .maybeSingle();

    if (capError) throw capError;
    if (!capture) return NextResponse.json({ error: "Capture not found" }, { status: 404 });
    if (!capture.workspace_id) return NextResponse.json({ error: "Capture is not assigned to a workspace" }, { status: 400 });

    // 2. Confirm user is workspace owner or team member
    const { data: ws } = await supabase
      .from("workspaces")
      .select("owner_user_id")
      .eq("id", capture.workspace_id)
      .maybeSingle();

    if (ws?.owner_user_id !== user.id) {
      const { data: membership, error: memError } = await supabase
        .from("workspace_members")
        .select("role")
        .eq("workspace_id", capture.workspace_id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (memError) throw memError;
      if (!membership) return NextResponse.json({ error: "Access denied to capture workspace" }, { status: 403 });
    }

    // 3. Read workspace integrations config
    const { data: wsSettings, error: wsError } = await supabase
      .from("workspace_settings")
      .select("integrations, webhook_url")
      .eq("workspace_id", capture.workspace_id)
      .maybeSingle();

    if (wsError) throw wsError;

    const integrations = (wsSettings?.integrations as Record<string, Record<string, string>>) || {};
    let config = integrations[service];

    // Fallback: If webhook is requested, allow fallback to legacy workspace_settings.webhook_url
    if (service === "webhook" && (!config || !config.url) && wsSettings?.webhook_url) {
      config = { url: wsSettings.webhook_url };
    }

    if (!config || Object.keys(config).length === 0) {
      return NextResponse.json(
        { error: `${service.toUpperCase()} integration is not configured. Please add your credentials in Settings > Integrations.` },
        { status: 400 }
      );
    }

    // 4. Build standard description and logs
    const envParts = [
      capture.os ? `OS: ${capture.os}` : null,
      capture.browser ? `Browser: ${capture.browser}` : null,
      capture.window_size ? `Viewport: ${capture.window_size}` : null,
      capture.site_url ? `URL: ${capture.site_url}` : null,
    ].filter(Boolean);

    const envBlock = envParts.length ? `\n\n### Environment\n${envParts.map((p) => `- ${p}`).join("\n")}` : "";
    const rawLogs = capture.dev_logs;
    const resolvedLogs = typeof rawLogs === "string" && rawLogs.startsWith("gz:")
      ? await decompressDevLogs(rawLogs)
      : rawLogs;
    const logSummary = summarizeDevLogs(resolvedLogs);
    const captureLink = capture.drive_url || `${process.env.NEXT_PUBLIC_APP_URL || "https://bugsnap.akusaraproject.my.id"}/v/${capture.id}`;
    const fullDescription = `${capture.description || "Bug report captured via BugSnap."}${envBlock}${logSummary}\n\n[View BugSnap Capture](${captureLink})`;
    const bugTitle = `[BugSnap] ${capture.title || "Captured Bug"}`;

    // 5. Dispatch per service
    let dispatchOk = true;
    let dispatchErrMsg: string | undefined;
    try {
      switch (service) {
      case "slack": {
        const webhookUrl = (config.webhookUrl || config.url)?.trim();
        if (!webhookUrl) throw new Error("Slack webhook URL is missing");
        await assertPublicUrl(webhookUrl);
        const slackRes = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: `*${bugTitle}*\n${capture.description || "New bug capture uploaded"}\n<${captureLink}|View Capture>`,
            ...(config.channel?.trim() ? { channel: config.channel.trim() } : {}),
            blocks: [
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `*${bugTitle}*\n${capture.description || "_No description provided_"}\n\n*Platform:* ${capture.os || "Unknown"} | *Browser:* ${capture.browser || "Unknown"}\n*URL:* ${capture.site_url || "N/A"}`,
                },
              },
              {
                type: "actions",
                elements: [
                  {
                    type: "button",
                    text: { type: "plain_text", text: "View BugSnap Capture" },
                    url: captureLink,
                    style: "primary",
                  },
                ],
              },
            ],
          }),
          redirect: "manual",
          signal: AbortSignal.timeout(10000),
        });
        if (!slackRes.ok) {
          const errText = await slackRes.text().catch(() => "");
          throw new Error(`Slack webhook error: ${errText || slackRes.statusText || slackRes.status}`);
        }
        return NextResponse.json({ ok: true, message: "Sent to Slack channel successfully!" });
      }

      case "webhook": {
        const webhookUrl = (config.url || (wsSettings as Record<string, unknown>)?.webhook_url as string | undefined)?.trim();
        if (!webhookUrl) throw new Error("Webhook URL is required");
        await assertPublicUrl(webhookUrl);

        const typeLabel = capture.type === "video" ? "Video" : "Screenshot";
        const errorLogs = Array.isArray(resolvedLogs)
          ? resolvedLogs.filter((l) => l && typeof l === "object" && (l.type === "console" || l.level === "error" || l.status >= 400))
          : [];
        const errorCount = errorLogs.length;

        // Multi-platform payload: text (Slack), content + embeds (Discord), event + capture (Zapier/Generic)
        const payload = {
          event: "capture.created",
          text: `[BugSnap] ${typeLabel} - ${capture.title || "Captured Bug"}\n${captureLink}`,
          content: `**[BugSnap]** ${typeLabel} - ${capture.title || "Captured Bug"}\n${capture.description ? `> ${capture.description}\n` : ""}${captureLink}`,
          embeds: [
            {
              title: bugTitle,
              url: captureLink,
              description: (capture.description || "Bug report captured via BugSnap.").slice(0, 2048),
              color: errorCount > 0 ? 0xef4444 : 0x89bd49,
              fields: [
                { name: "Platform", value: `${capture.os || "Unknown"} / ${capture.browser || "Unknown"}`, inline: true },
                { name: "URL", value: capture.site_url || "N/A", inline: true },
                { name: "Errors", value: String(errorCount), inline: true },
              ],
            },
          ],
          capture: {
            id: capture.id,
            title: capture.title,
            description: capture.description,
            url: captureLink,
            type: capture.type,
            os: capture.os,
            browser: capture.browser,
            site_url: capture.site_url,
            window_size: capture.window_size,
            dev_logs: resolvedLogs,
          },
        };

        const whRes = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          redirect: "manual",
          signal: AbortSignal.timeout(10000),
        });

        if (!whRes.ok) {
          const errText = await whRes.text().catch(() => "");
          throw new Error(errText ? `Webhook responded with status ${whRes.status}: ${errText.slice(0, 100)}` : `Webhook responded with status ${whRes.status}`);
        }

        return NextResponse.json({ ok: true, message: "Webhook delivered successfully!" });
      }

      case "github": {
        if (!config.token || !config.repo) throw new Error("GitHub token and repo are required");
        const cleanRepo = config.repo.trim().replace(/^https?:\/\/github\.com\//i, "").replace(/^\/+|\/+$/g, "");
        const ghRes = await fetch(`https://api.github.com/repos/${cleanRepo}/issues`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.token.trim()}`,
            Accept: "application/vnd.github.v3+json",
            "User-Agent": "BugSnap-App",
          },
          body: JSON.stringify({
            title: bugTitle,
            body: fullDescription,
            labels: ["bug"],
          }),
          redirect: "manual",
          signal: AbortSignal.timeout(10000),
        });
        const ghData = await ghRes.json().catch(() => ({}));
        if (!ghRes.ok) {
          const detail = ghData.errors ? `: ${JSON.stringify(ghData.errors)}` : "";
          throw new Error(`${ghData.message || "Failed to create GitHub issue"}${detail}`);
        }
        return NextResponse.json({ ok: true, message: `GitHub issue created: #${ghData.number}`, url: ghData.html_url });
      }

      case "linear": {
        if (!config.apiKey || !config.teamId) throw new Error("Linear API key and team ID are required");
        let resolvedTeamId = config.teamId.trim();

        // If teamId is a team key (e.g. "ENG") instead of a UUID, query Linear API to resolve to team UUID
        if (!isUuid(resolvedTeamId)) {
          const teamQuery = `
            query ResolveTeam($key: String!) {
              teams(filter: { key: { eqIgnoreCase: $key } }) {
                nodes { id key }
              }
            }
          `;
          const teamRes = await fetch("https://api.linear.app/graphql", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: config.apiKey.trim(),
            },
            body: JSON.stringify({ query: teamQuery, variables: { key: resolvedTeamId } }),
            signal: AbortSignal.timeout(10000),
          });
          const teamData = await teamRes.json().catch(() => ({}));
          const matchedTeam = teamData.data?.teams?.nodes?.[0];
          if (matchedTeam?.id) {
            resolvedTeamId = matchedTeam.id;
          }
        }

        const linearMutation = `
          mutation IssueCreate($input: IssueCreateInput!) {
            issueCreate(input: $input) {
              success
              issue {
                id
                url
                title
              }
            }
          }
        `;
        const linRes = await fetch("https://api.linear.app/graphql", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: config.apiKey.trim(),
          },
          body: JSON.stringify({
            query: linearMutation,
            variables: {
              input: {
                title: bugTitle,
                teamId: resolvedTeamId,
                description: fullDescription,
              },
            },
          }),
          signal: AbortSignal.timeout(10000),
        });
        const linData = await linRes.json().catch(() => ({}));
        if (!linRes.ok || linData.errors) {
          throw new Error(linData.errors?.[0]?.message || "Failed to create Linear issue");
        }
        const createdIssue = linData.data?.issueCreate?.issue;
        return NextResponse.json({ ok: true, message: "Linear issue created successfully!", url: createdIssue?.url });
      }

      case "jira": {
        if (!config.host || !config.email || !config.token || !config.projectKey) {
          throw new Error("Jira requires host URL, account email, API token, and project key");
        }
        const validatedHost = await assertPublicUrl(config.host);
        const hostUrl = validatedHost.origin.replace(/\/+$/, "");
        const authHeader = `Basic ${Buffer.from(`${config.email.trim()}:${config.token.trim()}`).toString("base64")}`;
        const jiraRes = await fetch(`${hostUrl}/rest/api/2/issue`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader,
          },
          body: JSON.stringify({
            fields: {
              project: { key: config.projectKey.trim().toUpperCase() },
              summary: bugTitle,
              description: fullDescription,
              issuetype: { name: "Bug" },
            },
          }),
          redirect: "manual",
          signal: AbortSignal.timeout(10000),
        });
        const jiraData = await jiraRes.json().catch(() => ({}));
        if (!jiraRes.ok) {
          const errs = jiraData.errorMessages?.join(", ") || JSON.stringify(jiraData.errors || "Failed to create Jira issue");
          throw new Error(errs);
        }
        const issueUrl = `${hostUrl}/browse/${jiraData.key}`;
        return NextResponse.json({ ok: true, message: `Jira issue created: ${jiraData.key}`, key: jiraData.key, url: issueUrl });
      }

      case "gitlab": {
        if (!config.token || !config.project) throw new Error("GitLab token and project path/id are required");
        const rawUrl = (config.url || "https://gitlab.com").trim();
        const validatedHost = await assertPublicUrl(rawUrl);
        const hostUrl = validatedHost.origin.replace(/\/+$/, "");
        const cleanProject = config.project.trim().replace(/^https?:\/\/[^/]+\//i, "").replace(/^\/+|\/+$/g, "");
        const projectParam = encodeURIComponent(cleanProject);
        const glRes = await fetch(`${hostUrl}/api/v4/projects/${projectParam}/issues`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "PRIVATE-TOKEN": config.token.trim(),
          },
          body: JSON.stringify({
            title: bugTitle,
            description: fullDescription,
            labels: "bug",
          }),
          redirect: "manual",
          signal: AbortSignal.timeout(10000),
        });
        const glData = await glRes.json().catch(() => ({}));
        if (!glRes.ok) {
          const msg = typeof glData.message === "object" ? JSON.stringify(glData.message) : (glData.message || "Failed to create GitLab issue");
          throw new Error(msg);
        }
        return NextResponse.json({ ok: true, message: `GitLab issue created: #${glData.iid}`, url: glData.web_url });
      }

      case "notion": {
        if (!config.token || !config.databaseId) throw new Error("Notion integration token and database ID are required");
        const cleanDbId = config.databaseId.trim().match(/[a-f0-9]{32}|[a-f0-9-]{36}/i)?.[0].replace(/-/g, "") || config.databaseId.trim().replace(/-/g, "");

        // Split fullDescription into paragraph blocks to respect Notion's 2000 char per block limit without dropping data
        const paragraphBlocks: Array<{ object: "block"; type: "paragraph"; paragraph: { rich_text: Array<{ type: "text"; text: { content: string } }> } }> = [];
        for (let i = 0; i < fullDescription.length && paragraphBlocks.length < 50; i += 1900) {
          paragraphBlocks.push({
            object: "block",
            type: "paragraph",
            paragraph: {
              rich_text: [{ type: "text", text: { content: fullDescription.slice(i, i + 1900) } }],
            },
          });
        }

        const notionRes = await fetch("https://api.notion.com/v1/pages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.token.trim()}`,
            "Notion-Version": "2022-06-28",
          },
          body: JSON.stringify({
            parent: { database_id: cleanDbId },
            properties: {
              Name: {
                title: [{ text: { content: bugTitle } }],
              },
            },
            children: paragraphBlocks.length ? paragraphBlocks : [
              {
                object: "block",
                type: "paragraph",
                paragraph: {
                  rich_text: [{ type: "text", text: { content: "Bug report captured via BugSnap." } }],
                },
              },
            ],
          }),
          signal: AbortSignal.timeout(10000),
        });
        const notionData = await notionRes.json().catch(() => ({}));
        if (!notionRes.ok) throw new Error(notionData.message || "Failed to create Notion page");
        return NextResponse.json({ ok: true, message: "Notion database page created!", url: notionData.url });
      }

      case "clickup": {
        if (!config.token || !config.listId) throw new Error("ClickUp API token and list ID are required");
        const cleanListId = config.listId.trim().replace(/.*\/li\//, "").replace(/[^0-9]/g, "") || config.listId.trim();
        const cuRes = await fetch(`https://api.clickup.com/api/v2/list/${cleanListId}/task`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: config.token.trim(),
          },
          body: JSON.stringify({
            name: bugTitle,
            description: fullDescription,
            priority: 2,
          }),
          signal: AbortSignal.timeout(10000),
        });
        const cuData = await cuRes.json().catch(() => ({}));
        if (!cuRes.ok) throw new Error(cuData.err || cuData.message || "Failed to create ClickUp task");
        return NextResponse.json({ ok: true, message: `ClickUp task created: ${cuData.name}`, url: cuData.url });
      }

      case "asana": {
        if (!config.token || !config.projectId) throw new Error("Asana token and project ID are required");
        const cleanProjectId = config.projectId.trim().replace(/^.*\/0\/(\d+).*/, "$1").replace(/[^0-9]/g, "") || config.projectId.trim();
        const asanaRes = await fetch("https://app.asana.com/api/1.0/tasks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.token.trim()}`,
          },
          body: JSON.stringify({
            data: {
              name: bugTitle,
              notes: fullDescription,
              projects: [cleanProjectId],
            },
          }),
          signal: AbortSignal.timeout(10000),
        });
        const asanaData = await asanaRes.json().catch(() => ({}));
        if (!asanaRes.ok) throw new Error(asanaData.errors?.[0]?.message || "Failed to create Asana task");
        return NextResponse.json({
          ok: true,
          message: "Asana task created successfully!",
          url: asanaData.data?.permalink_url,
        });
      }

      case "azure": {
        if (!config.orgUrl || !config.token || !config.project) {
          throw new Error("Azure DevOps requires organization URL, personal access token, and project name");
        }
        await assertPublicUrl(config.orgUrl);
        const cleanOrg = config.orgUrl.trim().replace(/\/+$/, "");
        const authHeader = `Basic ${Buffer.from(`:${config.token.trim()}`).toString("base64")}`;
        const htmlDescription = `<p>${(capture.description || "Bug captured via BugSnap").replace(/\n/g, "<br/>")}</p>${envBlock ? `<h3>Environment</h3><p>${envParts.join("<br/>")}</p>` : ""}${logSummary ? `<h3>DevTools Summary</h3><pre>${logSummary.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>` : ""}<p><a href="${captureLink}">View BugSnap Capture</a></p>`;
        const azureRes = await fetch(
          `${cleanOrg}/${encodeURIComponent(config.project.trim())}/_apis/wit/workitems/$Bug?api-version=7.0`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json-patch+json",
              Authorization: authHeader,
            },
            body: JSON.stringify([
              { op: "add", path: "/fields/System.Title", value: bugTitle },
              {
                op: "add",
                path: "/fields/System.Description",
                value: htmlDescription,
              },
            ]),
            redirect: "manual",
            signal: AbortSignal.timeout(10000),
          }
        );
        const azData = await azureRes.json().catch(() => ({}));
        if (!azureRes.ok) throw new Error(azData.message || "Failed to create Azure DevOps work item");
        return NextResponse.json({
          ok: true,
          message: `Azure DevOps work item #${azData.id} created!`,
          url: azData._links?.html?.href,
        });
      }

      case "aksora": {
        if (!config.url || !config.apiKey) throw new Error("Aksora URL and API key are required");
        await assertPublicUrl(config.url);
        const targetUrl = `${config.url.trim().replace(/\/+$/, "")}/api/public/v1/tasks`;
        const aksoraRes = await fetch(targetUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.apiKey.trim()}`,
          },
          body: JSON.stringify({
            data: {
              title: bugTitle,
              project: "General",
              relatedFeature: "BugSnap Capture",
              category: "Bug Fix",
              status: "todo",
              priority: "P1",
              description: fullDescription,
              acceptanceCriteria: "Verify bug reported in BugSnap capture is resolved.",
              evidence: captureLink,
            },
          }),
          redirect: "manual",
          signal: AbortSignal.timeout(10000),
        });
        const aksoraData = await aksoraRes.json().catch(() => ({}));
        if (!aksoraRes.ok) throw new Error(aksoraData.error || aksoraData.message || `Aksora error: ${aksoraRes.status}`);
        return NextResponse.json({ ok: true, message: "Aksora task created successfully!" });
      }

      case "snaptest": {
        if (!config.url) throw new Error("SnapTest URL is required");
        await assertPublicUrl(config.url);
        const snapRes = await fetch(`${config.url.trim().replace(/\/+$/, "")}/api/webhook/bugsnap`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey.trim()}` } : {}),
          },
          body: JSON.stringify({
            captureId: capture.id,
            title: capture.title,
            description: capture.description,
            type: capture.type,
            driveUrl: captureLink,
            siteUrl: capture.site_url,
            os: capture.os,
            browser: capture.browser,
            devLogs: resolvedLogs,
          }),
          redirect: "manual",
          signal: AbortSignal.timeout(10000),
        });
        const snapData = await snapRes.json().catch(() => ({}));
        if (!snapRes.ok) throw new Error(snapData.error || snapData.message || "Failed to forward capture to SnapTest");
        return NextResponse.json({ ok: true, message: "Forwarded to SnapTest AI QA Suite!" });
      }

      case "claude": {
        if (!config.apiKey) throw new Error("Anthropic API Key is required");
        const model = config.model?.trim() || "claude-3-5-sonnet-latest";
        const prompt = `You are a senior QA engineer. Analyze this bug report and dev logs. Provide:
1. Steps to Reproduce
2. Root Cause Analysis
3. Recommended Fix

Bug: ${capture.title}
Description: ${capture.description || "N/A"}
Environment: ${envParts.join(", ")}
${logSummary || "Dev Logs: None"}`;

        const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": config.apiKey.trim(),
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model,
            max_tokens: 1000,
            messages: [{ role: "user", content: prompt }],
          }),
          signal: AbortSignal.timeout(25000),
        });
        const cData = await claudeRes.json().catch(() => ({}));
        if (!claudeRes.ok) throw new Error(cData.error?.message || "Failed to generate Claude summary");
        const summaryText = cData.content?.[0]?.text;
        if (summaryText) {
          await supabase.from("captures").update({ ai_summary: summaryText }).eq("id", capture.id);
        }
        return NextResponse.json({ ok: true, message: "AI summary generated via Claude!", summary: summaryText });
      }

      case "chatgpt": {
        if (!config.apiKey) throw new Error("OpenAI API Key is required");
        const model = config.model?.trim() || "gpt-4o-mini";
        const prompt = `You are a senior QA engineer. Analyze this bug report and dev logs. Provide:
1. Steps to Reproduce
2. Root Cause Analysis
3. Recommended Fix

Bug: ${capture.title}
Description: ${capture.description || "N/A"}
Environment: ${envParts.join(", ")}
${logSummary || "Dev Logs: None"}`;

        const gptRes = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.apiKey.trim()}`,
          },
          body: JSON.stringify({
            model,
            messages: [{ role: "user", content: prompt }],
            max_tokens: 1000,
          }),
          signal: AbortSignal.timeout(25000),
        });
        const gData = await gptRes.json().catch(() => ({}));
        if (!gptRes.ok) throw new Error(gData.error?.message || "Failed to generate ChatGPT summary");
        const summaryText = gData.choices?.[0]?.message?.content;
        if (summaryText) {
          await supabase.from("captures").update({ ai_summary: summaryText }).eq("id", capture.id);
        }
        return NextResponse.json({ ok: true, message: "AI summary generated via ChatGPT!", summary: summaryText });
      }

      case "gemini": {
        if (!config.apiKey) throw new Error("Google Gemini API Key is required");
        const model = config.model?.trim() || "gemini-1.5-flash";
        const prompt = `You are a senior QA engineer. Analyze this bug report and dev logs. Provide:
1. Steps to Reproduce
2. Root Cause Analysis
3. Recommended Fix

Bug: ${capture.title}
Description: ${capture.description || "N/A"}
Environment: ${envParts.join(", ")}
${logSummary || "Dev Logs: None"}`;

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(config.apiKey.trim())}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [{ text: prompt }],
                },
              ],
            }),
            signal: AbortSignal.timeout(25000),
          }
        );
        const gemData = await geminiRes.json().catch(() => ({}));
        if (!geminiRes.ok) throw new Error(gemData.error?.message || "Failed to generate Google Gemini summary");
        const summaryText = gemData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (summaryText) {
          await supabase.from("captures").update({ ai_summary: summaryText }).eq("id", capture.id);
        }
        return NextResponse.json({ ok: true, message: "AI summary generated via Google Gemini!", summary: summaryText });
      }

      default:
        return NextResponse.json({ error: `Unsupported integration service: ${service}` }, { status: 400 });
      }
    } catch (dispatchErr) {
      dispatchOk = false;
      dispatchErrMsg = dispatchErr instanceof Error ? dispatchErr.message : String(dispatchErr);
      throw dispatchErr;
    } finally {
      await recordIntegrationDelivery(supabase, service, dispatchOk, dispatchErrMsg);
    }
  } catch (err: unknown) {
    const rawMsg = err instanceof Error ? err.message : "Failed to send to integration";
    console.error("[Send to Integration Error]:", redactString(rawMsg));
    return NextResponse.json(
      { error: redactString(rawMsg) },
      { status: 500 }
    );
  }
}
