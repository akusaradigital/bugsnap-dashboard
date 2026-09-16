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
      .select("integrations")
      .eq("workspace_id", capture.workspace_id)
      .maybeSingle();

    if (wsError) throw wsError;

    const integrations = (wsSettings?.integrations as Record<string, Record<string, string>>) || {};
    const config = integrations[service];

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
    switch (service) {
      case "slack": {
        if (!config.webhookUrl) throw new Error("Slack webhook URL is missing");
        await assertPublicUrl(config.webhookUrl);
        const slackRes = await fetch(config.webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: `🐞 *${bugTitle}*\n${capture.description || "New bug capture uploaded"}\n🔗 <${captureLink}|View Capture>`,
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
        if (!slackRes.ok) throw new Error(`Slack webhook error: ${slackRes.statusText}`);
        return NextResponse.json({ ok: true, message: "Sent to Slack channel successfully!" });
      }

      case "github": {
        if (!config.token || !config.repo) throw new Error("GitHub token and repo are required");
        const ghRes = await fetch(`https://api.github.com/repos/${config.repo.trim()}/issues`, {
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
        });
        const ghData = await ghRes.json().catch(() => ({}));
        if (!ghRes.ok) throw new Error(ghData.message || "Failed to create GitHub issue");
        return NextResponse.json({ ok: true, message: `GitHub issue created: #${ghData.number}`, url: ghData.html_url });
      }

      case "linear": {
        if (!config.apiKey || !config.teamId) throw new Error("Linear API key and team ID are required");
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
                teamId: config.teamId.trim(),
                description: fullDescription,
              },
            },
          }),
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
        if (!jiraRes.ok) throw new Error(JSON.stringify(jiraData.errors || jiraData.errorMessages || "Failed to create Jira issue"));
        return NextResponse.json({ ok: true, message: `Jira issue created: ${jiraData.key}`, key: jiraData.key });
      }

      case "gitlab": {
        if (!config.token || !config.project) throw new Error("GitLab token and project path/id are required");
        const rawUrl = (config.url || "https://gitlab.com").trim();
        const validatedHost = await assertPublicUrl(rawUrl);
        const hostUrl = validatedHost.origin.replace(/\/+$/, "");
        const projectParam = encodeURIComponent(config.project.trim());
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
        if (!glRes.ok) throw new Error(glData.message || "Failed to create GitLab issue");
        return NextResponse.json({ ok: true, message: `GitLab issue created: #${glData.iid}`, url: glData.web_url });
      }

      case "notion": {
        if (!config.token || !config.databaseId) throw new Error("Notion integration token and database ID are required");
        const cleanDbId = config.databaseId.trim().replace(/-/g, "");
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
            children: [
              {
                object: "block",
                type: "paragraph",
                paragraph: {
                  rich_text: [{ type: "text", text: { content: fullDescription.slice(0, 1900) } }],
                },
              },
            ],
          }),
        });
        const notionData = await notionRes.json().catch(() => ({}));
        if (!notionRes.ok) throw new Error(notionData.message || "Failed to create Notion page");
        return NextResponse.json({ ok: true, message: "Notion database page created!", url: notionData.url });
      }

      case "clickup": {
        if (!config.token || !config.listId) throw new Error("ClickUp API token and list ID are required");
        const cuRes = await fetch(`https://api.clickup.com/api/v2/list/${config.listId.trim()}/task`, {
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
        });
        const cuData = await cuRes.json().catch(() => ({}));
        if (!cuRes.ok) throw new Error(cuData.err || cuData.message || "Failed to create ClickUp task");
        return NextResponse.json({ ok: true, message: `ClickUp task created: ${cuData.name}`, url: cuData.url });
      }

      case "asana": {
        if (!config.token || !config.projectId) throw new Error("Asana token and project ID are required");
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
              projects: [config.projectId.trim()],
            },
          }),
        });
        const asanaData = await asanaRes.json().catch(() => ({}));
        if (!asanaRes.ok) throw new Error(asanaData.errors?.[0]?.message || "Failed to create Asana task");
        return NextResponse.json({ ok: true, message: "Asana task created successfully!" });
      }

      case "azure": {
        if (!config.orgUrl || !config.token || !config.project) {
          throw new Error("Azure DevOps requires organization URL, personal access token, and project name");
        }
        await assertPublicUrl(config.orgUrl);
        const cleanOrg = config.orgUrl.trim().replace(/\/+$/, "");
        const authHeader = `Basic ${Buffer.from(`:${config.token.trim()}`).toString("base64")}`;
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
                value: `<p>${(capture.description || "Bug captured via BugSnap").replace(/\n/g, "<br/>")}</p><p><a href="${captureLink}">View BugSnap Capture</a></p>`,
              },
            ]),
            redirect: "manual",
            signal: AbortSignal.timeout(10000),
          }
        );
        const azData = await azureRes.json().catch(() => ({}));
        if (!azureRes.ok) throw new Error(azData.message || "Failed to create Azure DevOps work item");
        return NextResponse.json({ ok: true, message: `Azure DevOps work item #${azData.id} created!` });
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
        if (!aksoraRes.ok) throw new Error(aksoraData.error || "Failed to create task in Aksora");
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
            driveUrl: captureLink,
            devLogs: resolvedLogs,
          }),
          redirect: "manual",
          signal: AbortSignal.timeout(10000),
        });
        const snapData = await snapRes.json().catch(() => ({}));
        if (!snapRes.ok) throw new Error(snapData.error || "Failed to forward capture to SnapTest");
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
Dev Logs: ${JSON.stringify(resolvedLogs || {})}`;

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
Dev Logs: ${JSON.stringify(resolvedLogs || {})}`;

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
        });
        const gData = await gptRes.json().catch(() => ({}));
        if (!gptRes.ok) throw new Error(gData.error?.message || "Failed to generate ChatGPT summary");
        const summaryText = gData.choices?.[0]?.message?.content;
        if (summaryText) {
          await supabase.from("captures").update({ ai_summary: summaryText }).eq("id", capture.id);
        }
        return NextResponse.json({ ok: true, message: "AI summary generated via ChatGPT!", summary: summaryText });
      }

      default:
        return NextResponse.json({ error: `Unsupported integration service: ${service}` }, { status: 400 });
    }
  } catch (err: unknown) {
    console.error("[Send to Integration Error]:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to send to integration" },
      { status: 500 }
    );
  }
}
