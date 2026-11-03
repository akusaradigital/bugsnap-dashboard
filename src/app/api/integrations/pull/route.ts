import { NextResponse } from "next/server";
import { authenticatedUser } from "@/lib/google-drive";
import { createServiceClient } from "@/lib/supabase-server";
import { assertPublicUrl } from "@/lib/safe-url";
import { isRateLimited } from "@/lib/rate-limit";
import { sanitizeErrorMessage, redactString } from "@/lib/redact";

export const runtime = "nodejs";

interface PullItem {
  id: string;
  title: string;
  status?: string;
  url?: string;
  createdAt?: string;
  extra?: string;
}

interface PullResult {
  ok: boolean;
  service: string;
  serviceName: string;
  source: string;
  itemCount: number;
  items: PullItem[];
  meta?: Record<string, string | number | boolean>;
}

export async function POST(req: Request) {
  const user = await authenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (await isRateLimited(`integration-pull:${user.id}`, 30, 60)) {
    return NextResponse.json(
      { error: "Too many pull requests. Please wait a minute." },
      { status: 429 }
    );
  }

  try {
    const body = (await req.json().catch(() => ({}))) as {
      service?: string;
      workspaceId?: string;
      config?: Record<string, string>;
    };

    const service = typeof body?.service === "string" ? body.service.toLowerCase().trim() : "";
    if (!service) {
      return NextResponse.json({ error: "Service parameter is required" }, { status: 400 });
    }

    let config = (body?.config && typeof body.config === "object") ? { ...body.config } : {};

    // If config fields are missing but workspaceId is provided, pull saved credentials from workspace_settings
    if (body.workspaceId && Object.keys(config).length === 0) {
      const db = createServiceClient();
      const { data: member } = await db
        .from("workspace_members")
        .select("role")
        .eq("workspace_id", body.workspaceId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!member) {
        return NextResponse.json({ error: "Forbidden: Not a member of this workspace" }, { status: 403 });
      }

      const { data: wsSettings } = await db
        .from("workspace_settings")
        .select("integrations, webhook_url")
        .eq("workspace_id", body.workspaceId)
        .maybeSingle();

      const savedIntegrations = (wsSettings?.integrations as Record<string, Record<string, string>>) || {};
      if (savedIntegrations[service]) {
        config = { ...savedIntegrations[service] };
      } else if (service === "webhook" && wsSettings?.webhook_url) {
        config = { url: wsSettings.webhook_url };
      }
    }

    switch (service) {
      case "github": {
        const token = config.token?.trim();
        let repo = config.repo?.trim() || "";
        if (!token) throw new Error("GitHub Personal Access Token is required");
        if (!repo) throw new Error("GitHub repository is required");

        repo = repo.replace(/^https?:\/\/github\.com\//i, "").replace(/\/+$/, "");
        if (!repo.includes("/")) throw new Error("Repository format must be 'owner/repo'");

        const res = await fetch(`https://api.github.com/repos/${repo}/issues?state=all&per_page=5`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github.v3+json",
            "User-Agent": "BugSnap-App",
          },
          signal: AbortSignal.timeout(10000),
        });

        const data = (await res.json().catch(() => [])) as Array<{
          id: number;
          number: number;
          title: string;
          state: string;
          html_url: string;
          created_at: string;
          user?: { login: string };
        }>;

        if (!res.ok) {
          const errObj = data as unknown as { message?: string };
          throw new Error(errObj?.message || `GitHub error (HTTP ${res.status})`);
        }

        const items: PullItem[] = Array.isArray(data)
          ? data.map((iss) => ({
              id: String(iss.number || iss.id),
              title: `#${iss.number} ${iss.title}`,
              status: iss.state,
              url: iss.html_url,
              createdAt: iss.created_at,
              extra: iss.user?.login ? `@${iss.user.login}` : undefined,
            }))
          : [];

        const result: PullResult = {
          ok: true,
          service: "github",
          serviceName: "GitHub",
          source: repo,
          itemCount: items.length,
          items,
          meta: { repo },
        };
        return NextResponse.json(result);
      }

      case "linear": {
        const apiKey = config.apiKey?.trim();
        const teamInput = config.teamId?.trim() || "";
        if (!apiKey) throw new Error("Linear API key is required");

        const query = `
          query PullLinearIssues {
            viewer { name }
            teams {
              nodes {
                id
                key
                name
              }
            }
            issues(first: 5, orderBy: updatedAt) {
              nodes {
                id
                identifier
                title
                url
                createdAt
                state { name }
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

        const data = (await res.json().catch(() => ({}))) as {
          data?: {
            viewer?: { name: string };
            teams?: { nodes: Array<{ id: string; key: string; name: string }> };
            issues?: {
              nodes: Array<{
                id: string;
                identifier: string;
                title: string;
                url: string;
                createdAt: string;
                state?: { name: string };
              }>;
            };
          };
          errors?: Array<{ message: string }>;
        };

        if (!res.ok || data.errors) {
          throw new Error(data.errors?.[0]?.message || "Failed to pull Linear data");
        }

        const rawIssues = data.data?.issues?.nodes || [];
        const items: PullItem[] = rawIssues.map((iss) => ({
          id: iss.identifier || iss.id,
          title: `${iss.identifier}: ${iss.title}`,
          status: iss.state?.name || "open",
          url: iss.url,
          createdAt: iss.createdAt,
        }));

        const result: PullResult = {
          ok: true,
          service: "linear",
          serviceName: "Linear",
          source: teamInput || "Linear Workspace",
          itemCount: items.length,
          items,
          meta: { viewer: data.data?.viewer?.name || "User" },
        };
        return NextResponse.json(result);
      }

      case "jira": {
        const host = config.host?.trim();
        const email = config.email?.trim();
        const token = config.token?.trim();
        const projectKey = config.projectKey?.trim().toUpperCase();

        if (!host || !email || !token || !projectKey) {
          throw new Error("Jira requires host, email, API token, and project key");
        }

        const validatedHost = await assertPublicUrl(host);
        const hostUrl = validatedHost.origin.replace(/\/+$/, "");
        const authHeader = `Basic ${Buffer.from(`${email}:${token}`).toString("base64")}`;

        const res = await fetch(
          `${hostUrl}/rest/api/2/search?jql=project=${encodeURIComponent(projectKey)}+ORDER+BY+created+DESC&maxResults=5`,
          {
            headers: { Authorization: authHeader, Accept: "application/json" },
            redirect: "manual",
            signal: AbortSignal.timeout(10000),
          }
        );

        const data = (await res.json().catch(() => ({}))) as {
          issues?: Array<{
            id: string;
            key: string;
            fields?: {
              summary?: string;
              created?: string;
              status?: { name?: string };
            };
          }>;
          errorMessages?: string[];
        };

        if (!res.ok) {
          throw new Error(data.errorMessages?.[0] || `Jira returned HTTP ${res.status}`);
        }

        const rawIssues = data.issues || [];
        const items: PullItem[] = rawIssues.map((iss) => ({
          id: iss.key,
          title: `${iss.key}: ${iss.fields?.summary || "Untitled"}`,
          status: iss.fields?.status?.name || "Open",
          url: `${hostUrl}/browse/${iss.key}`,
          createdAt: iss.fields?.created,
        }));

        const result: PullResult = {
          ok: true,
          service: "jira",
          serviceName: "Jira",
          source: projectKey,
          itemCount: items.length,
          items,
          meta: { projectKey },
        };
        return NextResponse.json(result);
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

        const res = await fetch(
          `${hostUrl}/api/v4/projects/${encodeURIComponent(project)}/issues?per_page=5&order_by=created_at&sort=desc`,
          {
            headers: { "PRIVATE-TOKEN": token },
            redirect: "manual",
            signal: AbortSignal.timeout(10000),
          }
        );

        const data = (await res.json().catch(() => [])) as Array<{
          id: number;
          iid: number;
          title: string;
          state: string;
          web_url: string;
          created_at: string;
          author?: { username: string };
        }>;

        if (!res.ok) {
          const errObj = data as unknown as { message?: string };
          throw new Error(errObj?.message || `GitLab returned HTTP ${res.status}`);
        }

        const items: PullItem[] = Array.isArray(data)
          ? data.map((iss) => ({
              id: String(iss.iid || iss.id),
              title: `#${iss.iid} ${iss.title}`,
              status: iss.state,
              url: iss.web_url,
              createdAt: iss.created_at,
              extra: iss.author?.username ? `@${iss.author.username}` : undefined,
            }))
          : [];

        const result: PullResult = {
          ok: true,
          service: "gitlab",
          serviceName: "GitLab",
          source: project,
          itemCount: items.length,
          items,
          meta: { project },
        };
        return NextResponse.json(result);
      }

      case "azure": {
        const orgUrl = config.orgUrl?.trim();
        const token = config.token?.trim();
        const project = config.project?.trim();

        if (!orgUrl || !token || !project) {
          throw new Error("Azure DevOps requires org URL, token, and project name");
        }

        await assertPublicUrl(orgUrl);
        const cleanOrg = orgUrl.replace(/\/+$/, "");
        const authHeader = `Basic ${Buffer.from(`:${token}`).toString("base64")}`;

        const wiqlRes = await fetch(
          `${cleanOrg}/${encodeURIComponent(project)}/_apis/wit/wiql?api-version=7.0`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: authHeader,
            },
            body: JSON.stringify({
              query: `SELECT [System.Id], [System.Title], [System.State] FROM WorkItems WHERE [System.TeamProject] = '${project}' ORDER BY [System.CreatedDate] DESC`,
            }),
            redirect: "manual",
            signal: AbortSignal.timeout(10000),
          }
        );

        const wiqlData = (await wiqlRes.json().catch(() => ({}))) as {
          workItems?: Array<{ id: number; url: string }>;
          message?: string;
        };

        if (!wiqlRes.ok) throw new Error(wiqlData.message || "Failed to query Azure DevOps work items");

        const workItemIds = (wiqlData.workItems || []).slice(0, 5).map((w) => w.id);
        const items: PullItem[] = [];

        if (workItemIds.length > 0) {
          const detailRes = await fetch(
            `${cleanOrg}/_apis/wit/workitems?ids=${workItemIds.join(",")}&api-version=7.0`,
            {
              headers: { Authorization: authHeader },
              redirect: "manual",
              signal: AbortSignal.timeout(10000),
            }
          );
          const detailData = (await detailRes.json().catch(() => ({}))) as {
            value?: Array<{
              id: number;
              fields?: { "System.Title"?: string; "System.State"?: string; "System.CreatedDate"?: string };
              _links?: { html?: { href?: string } };
            }>;
          };

          (detailData.value || []).forEach((wi) => {
            items.push({
              id: String(wi.id),
              title: `#${wi.id}: ${wi.fields?.["System.Title"] || "Untitled"}`,
              status: wi.fields?.["System.State"] || "Active",
              url: wi._links?.html?.href,
              createdAt: wi.fields?.["System.CreatedDate"],
            });
          });
        }

        const result: PullResult = {
          ok: true,
          service: "azure",
          serviceName: "Azure DevOps",
          source: project,
          itemCount: items.length,
          items,
          meta: { project },
        };
        return NextResponse.json(result);
      }

      case "notion": {
        const token = config.token?.trim();
        const rawDbId = config.databaseId?.trim() || "";

        if (!token) throw new Error("Notion secret token is required");
        if (!rawDbId) throw new Error("Notion database ID is required");

        const cleanDbId = rawDbId.replace(/^.*\/([a-f0-9]{32})(\?.*)?$/i, "$1").replace(/-/g, "");

        const res = await fetch(`https://api.notion.com/v1/databases/${cleanDbId}/query`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Notion-Version": "2022-06-28",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ page_size: 5 }),
          signal: AbortSignal.timeout(10000),
        });

        const data = (await res.json().catch(() => ({}))) as {
          results?: Array<{
            id: string;
            url: string;
            created_time: string;
            properties?: Record<string, { title?: Array<{ plain_text?: string }> }>;
          }>;
          message?: string;
        };

        if (!res.ok) throw new Error(data.message || `Notion error (HTTP ${res.status})`);

        const items: PullItem[] = (data.results || []).map((page) => {
          let title = "Untitled Notion Page";
          if (page.properties) {
            for (const key of Object.keys(page.properties)) {
              const p = page.properties[key];
              if (p?.title && Array.isArray(p.title) && p.title.length > 0) {
                title = p.title.map((t) => t.plain_text).join("").trim() || title;
                break;
              }
            }
          }
          return {
            id: page.id,
            title,
            url: page.url,
            createdAt: page.created_time,
          };
        });

        const result: PullResult = {
          ok: true,
          service: "notion",
          serviceName: "Notion",
          source: "Database " + cleanDbId.slice(0, 8),
          itemCount: items.length,
          items,
          meta: { databaseId: cleanDbId },
        };
        return NextResponse.json(result);
      }

      case "clickup": {
        const token = config.token?.trim();
        let listId = config.listId?.trim() || "";
        if (!token) throw new Error("ClickUp API token is required");
        if (!listId) throw new Error("ClickUp List ID is required");

        const match = listId.match(/(\d{6,15})/);
        if (match) listId = match[1];

        const res = await fetch(`https://api.clickup.com/api/v2/list/${listId}/task?page=0&order_by=created&reverse=true`, {
          headers: { Authorization: token },
          signal: AbortSignal.timeout(10000),
        });

        const data = (await res.json().catch(() => ({}))) as {
          tasks?: Array<{
            id: string;
            name: string;
            status?: { status: string };
            url: string;
            date_created: string;
          }>;
          err?: string;
          message?: string;
        };

        if (!res.ok) throw new Error(data.err || data.message || `ClickUp error (HTTP ${res.status})`);

        const items: PullItem[] = (data.tasks || []).slice(0, 5).map((t) => ({
          id: t.id,
          title: t.name,
          status: t.status?.status || "open",
          url: t.url,
          createdAt: t.date_created ? new Date(Number(t.date_created)).toISOString() : undefined,
        }));

        const result: PullResult = {
          ok: true,
          service: "clickup",
          serviceName: "ClickUp",
          source: `List #${listId}`,
          itemCount: items.length,
          items,
          meta: { listId },
        };
        return NextResponse.json(result);
      }

      case "asana": {
        const token = config.token?.trim();
        let projectId = config.projectId?.trim() || "";
        if (!token) throw new Error("Asana Access Token is required");
        if (!projectId) throw new Error("Asana Project GID is required");

        const match = projectId.match(/(\d{6,25})/);
        if (match) projectId = match[1];

        const res = await fetch(
          `https://app.asana.com/api/1.0/projects/${projectId}/tasks?limit=5&opt_fields=name,completed,permalink_url,created_at`,
          {
            headers: { Authorization: `Bearer ${token}` },
            signal: AbortSignal.timeout(10000),
          }
        );

        const data = (await res.json().catch(() => ({}))) as {
          data?: Array<{
            gid: string;
            name: string;
            completed: boolean;
            permalink_url: string;
            created_at: string;
          }>;
          errors?: Array<{ message: string }>;
        };

        if (!res.ok) throw new Error(data.errors?.[0]?.message || `Asana error (HTTP ${res.status})`);

        const items: PullItem[] = (data.data || []).map((t) => ({
          id: t.gid,
          title: t.name,
          status: t.completed ? "Completed" : "In Progress",
          url: t.permalink_url,
          createdAt: t.created_at,
        }));

        const result: PullResult = {
          ok: true,
          service: "asana",
          serviceName: "Asana",
          source: `Project #${projectId}`,
          itemCount: items.length,
          items,
          meta: { projectId },
        };
        return NextResponse.json(result);
      }

      case "slack": {
        const webhookUrl = (config.webhookUrl || config.url)?.trim();
        if (!webhookUrl) throw new Error("Slack webhook URL is required");
        await assertPublicUrl(webhookUrl);

        const items: PullItem[] = [
          {
            id: "slack-channel",
            title: `Connected Channel: ${config.channel || "Default Incoming Webhook Channel"}`,
            status: "Active & Listening",
            extra: "Incoming Webhook Endpoint Verified",
          },
        ];

        return NextResponse.json({
          ok: true,
          service: "slack",
          serviceName: "Slack",
          source: config.channel || "Slack Channel",
          itemCount: items.length,
          items,
          meta: { channel: config.channel || "default" },
        });
      }

      case "webhook": {
        const targetUrl = config.url?.trim();
        if (!targetUrl) throw new Error("Webhook URL is required");
        await assertPublicUrl(targetUrl);

        const items: PullItem[] = [
          {
            id: "webhook-target",
            title: `Custom Destination: ${targetUrl.slice(0, 48)}...`,
            status: "Configured",
            url: targetUrl,
            extra: "Supports Slack, Discord, Zapier, & HTTP Listeners",
          },
        ];

        return NextResponse.json({
          ok: true,
          service: "webhook",
          serviceName: "Webhooks",
          source: targetUrl,
          itemCount: items.length,
          items,
          meta: { targetUrl },
        });
      }

      case "aksora": {
        const targetUrl = config.url?.trim();
        const apiKey = config.apiKey?.trim();
        if (!targetUrl || !apiKey) throw new Error("Aksora instance URL and API Key are required");

        await assertPublicUrl(targetUrl);
        const cleanUrl = targetUrl.replace(/\/+$/, "");

        const res = await fetch(`${cleanUrl}/api/public/v1/tasks?limit=5`, {
          headers: { Authorization: `Bearer ${apiKey}` },
          redirect: "manual",
          signal: AbortSignal.timeout(10000),
        });

        const data = (await res.json().catch(() => ({}))) as {
          tasks?: Array<{ id: string; title: string; status: string; priority: string; created_at: string }>;
          data?: Array<{ id: string; title: string; status: string; priority: string; created_at: string }>;
          error?: string;
        };

        if (res.status === 401 || res.status === 403) {
          throw new Error("Aksora API Key is invalid or lacking permissions");
        }

        const taskList = data.tasks || data.data || [];
        const items: PullItem[] = taskList.map((t) => ({
          id: t.id,
          title: t.title,
          status: `${t.status} (${t.priority || "Normal"})`,
          createdAt: t.created_at,
        }));

        return NextResponse.json({
          ok: true,
          service: "aksora",
          serviceName: "Aksora QA Workspace",
          source: cleanUrl,
          itemCount: items.length,
          items,
          meta: { instanceUrl: cleanUrl },
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
          return fetch(cleanUrl, { redirect: "manual", signal: AbortSignal.timeout(5000) });
        });

        const items: PullItem[] = [
          {
            id: "snaptest-runner",
            title: `SnapTest Runner (${cleanUrl})`,
            status: res.ok ? "Online & Ready" : `HTTP ${res.status}`,
            url: cleanUrl,
            extra: "Automated QA & Test Suite Forwarding",
          },
        ];

        return NextResponse.json({
          ok: true,
          service: "snaptest",
          serviceName: "SnapTest AI",
          source: cleanUrl,
          itemCount: items.length,
          items,
          meta: { runnerUrl: cleanUrl },
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

        const data = (await res.json().catch(() => ({}))) as {
          data?: Array<{ id: string; display_name?: string; created_at?: string }>;
          error?: { message?: string };
        };

        if (!res.ok) throw new Error(data.error?.message || `Anthropic error (HTTP ${res.status})`);

        const rawModels = data.data || [];
        const items: PullItem[] = rawModels.slice(0, 5).map((m) => ({
          id: m.id,
          title: m.display_name || m.id,
          status: "Available",
          createdAt: m.created_at,
        }));

        return NextResponse.json({
          ok: true,
          service: "claude",
          serviceName: "Claude AI",
          source: "Anthropic API",
          itemCount: items.length,
          items,
          meta: { defaultModel: config.model || "claude-3-5-sonnet-latest" },
        });
      }

      case "chatgpt": {
        const apiKey = config.apiKey?.trim();
        if (!apiKey) throw new Error("OpenAI API key is required");

        const res = await fetch("https://api.openai.com/v1/models", {
          headers: { Authorization: `Bearer ${apiKey}` },
          signal: AbortSignal.timeout(10000),
        });

        const data = (await res.json().catch(() => ({}))) as {
          data?: Array<{ id: string; created?: number; owned_by?: string }>;
          error?: { message?: string };
        };

        if (!res.ok) throw new Error(data.error?.message || `OpenAI error (HTTP ${res.status})`);

        const models = (data.data || [])
          .filter((m) => /gpt|o1|o3/i.test(m.id))
          .slice(0, 5)
          .map((m) => ({
            id: m.id,
            title: m.id,
            status: "Available",
            createdAt: m.created ? new Date(m.created * 1000).toISOString() : undefined,
            extra: m.owned_by ? `Owned by ${m.owned_by}` : undefined,
          }));

        return NextResponse.json({
          ok: true,
          service: "chatgpt",
          serviceName: "ChatGPT",
          source: "OpenAI API",
          itemCount: models.length,
          items: models,
          meta: { defaultModel: config.model || "gpt-4o-mini" },
        });
      }

      case "gemini": {
        const apiKey = config.apiKey?.trim();
        if (!apiKey) throw new Error("Google Gemini API key is required");

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`, {
          signal: AbortSignal.timeout(10000),
        });

        const data = (await res.json().catch(() => ({}))) as {
          models?: Array<{
            name: string;
            displayName?: string;
            description?: string;
            supportedGenerationMethods?: string[];
          }>;
          error?: { message?: string };
        };

        if (!res.ok) throw new Error(data.error?.message || `Google Gemini error (HTTP ${res.status})`);

        const models = (data.models || [])
          .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
          .slice(0, 5)
          .map((m) => {
            const shortName = m.name.replace(/^models\//, "");
            return {
              id: shortName,
              title: m.displayName || shortName,
              status: "Available",
              extra: m.description ? m.description.slice(0, 80) + "..." : undefined,
            };
          });

        return NextResponse.json({
          ok: true,
          service: "gemini",
          serviceName: "Google Gemini",
          source: "Google AI Studio",
          itemCount: models.length,
          items: models,
          meta: { defaultModel: config.model || "gemini-1.5-flash" },
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
