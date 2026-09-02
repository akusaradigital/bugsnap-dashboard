"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useT } from "@/components/I18nProvider";
import { useToast } from "@/components/Toast";
import { useTheme, type Theme } from "@/components/ThemeProvider";
import { hasBranding, normalizePlan, seatLimit, tierLabel, type Plan } from "@/lib/tiers";
import { pickAvatar, isRealAvatar, initialOf } from "@/lib/avatar";
import { Dropdown } from "@/components/Dropdown";

// ── Integration catalogue (same order as extension editor.html) ─────────────
const INTEGRATIONS = [
  {
    id: "aksora",
    name: "Aksora",
    desc: "Connect your Aksora QA Workspace to push bug tickets directly.",
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
        <rect width="24" height="24" rx="5" fill="#6366F1" />
        <path d="M7 17L12 7L17 17M9 14H15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "snaptest",
    name: "SnapTest AI",
    desc: "Forward captures directly into automated test suites and test runs.",
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
        <rect width="24" height="24" rx="5" fill="#EC4899" />
        <path d="M13 3L4 14H11L10 21L19 10H12L13 3Z" fill="white" />
      </svg>
    ),
  },
  {
    id: "slack",
    name: "Slack",
    desc: "Send bug captures directly to Slack channels.",
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
        <path d="M5.042 15.165a2.528 2.528 0 01-2.52 2.523A2.528 2.528 0 010 15.165a2.527 2.527 0 012.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 012.521-2.52 2.527 2.527 0 012.521 2.52v6.313A2.528 2.528 0 018.834 24a2.528 2.528 0 01-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 01-2.521-2.52A2.528 2.528 0 018.834 0a2.527 2.527 0 012.521 2.522v2.52H8.834zM8.834 6.313a2.527 2.527 0 012.521 2.521 2.527 2.527 0 01-2.521 2.521H2.522A2.528 2.528 0 010 8.834a2.528 2.528 0 012.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 012.522-2.521A2.528 2.528 0 0124 8.834a2.527 2.527 0 01-2.522 2.521h-2.522V8.834zM17.687 8.834a2.527 2.527 0 01-2.521 2.521 2.527 2.527 0 01-2.521-2.521V2.522A2.528 2.528 0 0115.166 0a2.528 2.528 0 012.521 2.522v6.312zM15.166 18.956a2.528 2.528 0 012.521 2.522A2.528 2.528 0 0115.166 24a2.527 2.527 0 01-2.521-2.522v-2.522h2.521zM15.166 17.687a2.527 2.527 0 01-2.521-2.521 2.527 2.527 0 012.521-2.522h6.313A2.528 2.528 0 0124 15.166a2.528 2.528 0 01-2.522 2.521h-6.312z" fill="#E01E5A" />
      </svg>
    ),
  },
  {
    id: "jira",
    name: "Jira",
    desc: "Create Jira tickets automatically from captures.",
    icon: (
      <svg viewBox="0 0 32 32" className="w-6 h-6" fill="none">
        <path d="M15.977 0L8.065 7.91c-.44.441-.44 1.157 0 1.598L16 17.44l7.935-7.934a1.13 1.13 0 000-1.598L15.977 0z" fill="#2684FF" />
        <path d="M8.065 9.508L0 17.572a1.13 1.13 0 000 1.598l7.912 7.912L16 19.14 8.065 9.508z" fill="url(#jira_b)" />
        <path d="M23.935 9.508L16 17.44l8.088 8.088L32 17.572a1.13 1.13 0 000-1.598l-8.065-8.466z" fill="url(#jira_a)" />
        <defs>
          <linearGradient id="jira_a" x1="24.176" y1="17.38" x2="20.29" y2="21.262" gradientUnits="userSpaceOnUse"><stop stopColor="#0052CC" /><stop offset="1" stopColor="#2684FF" /></linearGradient>
          <linearGradient id="jira_b" x1="7.817" y1="17.38" x2="11.697" y2="21.256" gradientUnits="userSpaceOnUse"><stop stopColor="#0052CC" /><stop offset="1" stopColor="#2684FF" /></linearGradient>
        </defs>
      </svg>
    ),
  },
  {
    id: "github",
    name: "GitHub",
    desc: "Open GitHub issues directly from a capture.",
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
        <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
      </svg>
    ),
  },
  {
    id: "linear",
    name: "Linear",
    desc: "Create Linear issues from bug captures instantly.",
    icon: (
      <svg viewBox="0 0 100 100" className="w-6 h-6" fill="none">
        <path d="M1.22 51.5a50 50 0 0047.29 47.29L1.22 51.5zM.14 41.38l58.49 58.49A50 50 0 0087.5 85.53L14.47 12.5A50 50 0 00.14 41.38zM22.37 6.33l71.3 71.3A50 50 0 0022.37 6.33zm17.9-5.38L99.05 59.73A50 50 0 0040.27.95z" fill="#5E6AD2" />
      </svg>
    ),
  },
  {
    id: "claude",
    name: "Claude",
    desc: "Use Claude AI to summarize bug reports automatically.",
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
        <rect width="24" height="24" rx="4" fill="#D97706" />
        <text x="12" y="16" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">C</text>
      </svg>
    ),
  },
  {
    id: "chatgpt",
    name: "ChatGPT",
    desc: "Generate AI bug reports and summaries via ChatGPT.",
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
        <rect width="24" height="24" rx="4" fill="#10A37F" />
        <text x="12" y="16" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">GPT</text>
      </svg>
    ),
  },
  {
    id: "clickup",
    name: "ClickUp",
    desc: "Create ClickUp tasks from captures with one click.",
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
        <rect width="24" height="24" rx="4" fill="#7B68EE" />
        <text x="12" y="15" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold">CU</text>
      </svg>
    ),
  },
  {
    id: "notion",
    name: "Notion",
    desc: "Log captures as Notion pages in your workspace.",
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
        <rect width="24" height="24" rx="4" fill="#1A1A1A" />
        <text x="12" y="15.5" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold">N</text>
      </svg>
    ),
  },
  {
    id: "asana",
    name: "Asana",
    desc: "Create Asana tasks and attach captures automatically.",
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
        <rect width="24" height="24" rx="4" fill="#F06A6A" />
        <text x="12" y="15" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold">A</text>
      </svg>
    ),
  },
  {
    id: "azure",
    name: "Azure DevOps",
    desc: "File Azure DevOps work items directly from captures.",
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
        <rect width="24" height="24" rx="4" fill="#0078D4" />
        <text x="12" y="15" textAnchor="middle" fill="white" fontSize="6" fontWeight="bold">ADO</text>
      </svg>
    ),
  },
  {
    id: "gitlab",
    name: "GitLab",
    desc: "Open GitLab issues from bug captures instantly.",
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
        <path d="M23.955 13.587l-1.342-4.135-2.664-8.189a.455.455 0 00-.867 0L16.418 9.45H7.582L4.918 1.263a.455.455 0 00-.867 0L1.386 9.449.044 13.587a.924.924 0 00.331 1.023L12 23.054l11.625-8.444a.92.92 0 00.33-1.023z" fill="#FC6D26" />
      </svg>
    ),
  },
];

type Tab = "general" | "members" | "billing" | "integrations" | "webhooks" | "account" | "notifications";

const TAB_TITLES: Record<Tab, { title: string; subtitle: string }> = {
  general: { title: "General", subtitle: "Manage your workspace name, access, and data controls." },
  members: { title: "Members", subtitle: "Manage who has access to your workspace captures." },
  billing: { title: "Billing", subtitle: "Your current plan and usage." },
  integrations: { title: "Integrations", subtitle: "Connect your bug captures to your favourite tools." },
  webhooks: { title: "Webhooks", subtitle: "Receive notifications when new captures are saved." },
  account: { title: "Account", subtitle: "Your personal profile information." },
  notifications: { title: "Notifications", subtitle: "Choose which emails BugSnap sends you." },
};

const ROLE_OPTIONS = ["Customer success", "Support", "Engineering", "Design", "Product", "QA", "Sales", "Other"];

function SettingsContent() {
  const { t } = useT();
  const { showToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, setTheme } = useTheme();

  const wsParam = searchParams.get("ws") || "";
  const rawTab = searchParams.get("tab") as Tab | null;
  const activeTab: Tab = rawTab && ["general","members","billing","integrations","webhooks","account","notifications"].includes(rawTab) ? rawTab : "general";

  useEffect(() => {
    // no-op: referrer-based navigation handled inline in the button
  }, []);

  // General / Workspace
  const [workspaceName, setWorkspaceName] = useState("My Workspace");
  const [workspaceAvatar, setWorkspaceAvatar] = useState("");
  const [editingWsName, setEditingWsName] = useState(false);
  const [ssoRequired, setSsoRequired] = useState(false);
  const [defaultLinkAccess, setDefaultLinkAccess] = useState<"anyone" | "team" | "private">("anyone");
  const [allowAi, setAllowAi] = useState(true);
  const [autoDeleteEnabled, setAutoDeleteEnabled] = useState(false);
  const [auditLogsEnabled, setAuditLogsEnabled] = useState(false);
  const [brandName, setBrandName] = useState("BugSnap");
  const [logoUrl, setLogoUrl] = useState("");
  const [hideWatermark, setHideWatermark] = useState(false);
  const [customDomain, setCustomDomain] = useState("");
  const [autoDeleteMonths, setAutoDeleteMonths] = useState(3);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<Plan>("free");
  const [userEmail, setUserEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState<{ comment: boolean; mention: boolean; digest: boolean }>({ comment: true, mention: true, digest: true });
  const [notifSaving, setNotifSaving] = useState(false);
  const [userAvatar, setUserAvatar] = useState("");
  const activeWsId = searchParams.get("ws");

  // Drive tab
  const [driveStatus, setDriveStatus] = useState<"connected" | "reconnect_required" | "not_connected">("not_connected");
  const [driveEmail, setDriveEmail] = useState<string | null>(null);
  const [driveQuota, setDriveQuota] = useState<{ usedBytes: number | null; totalBytes: number | null } | null>(null);
  const [driveLoading, setDriveLoading] = useState(true);
  const [driveActionLoading, setDriveActionLoading] = useState(false);
  const [driveError, setDriveError] = useState<string | null>(null);
  const [driveSuccess, setDriveSuccess] = useState<string | null>(null);
  const [connectDriveModalOpen, setConnectDriveModalOpen] = useState(false);
  const [integrationsHealth, setIntegrationsHealth] = useState<{
    drive: { state: "healthy" | "action_required" | "not_configured"; status: "connected" | "reconnect_required" | "not_connected"; email: string | null; message: string };
    email: { state: "healthy" | "action_required" | "not_configured"; provider: string | null; message: string };
    ai: { state: "healthy" | "action_required" | "not_configured"; provider: string | null; message: string };
  } | null>(null);
  const [integrationsLoading, setIntegrationsLoading] = useState(true);

  // Webhook
  const [webhookUrl, setWebhookUrl] = useState("");

  // Members
  const [members, setMembers] = useState<{ user_id: string; email: string; role: string }[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"creator" | "viewer">("creator");
  const [inviteRoleMenuOpen, setInviteRoleMenuOpen] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<{type:"ok"|"err"; text:string} | null>(null);

  // Integration search & settings
  const [intSearch, setIntSearch] = useState("");
  const [wsIntegrations, setWsIntegrations] = useState<Record<string, Record<string, string>>>({});
  const [activeModalInt, setActiveModalInt] = useState<string | null>(null);
  const [intModalForm, setIntModalForm] = useState<{ url: string; apiKey: string }>({ url: "", apiKey: "" });
  const [intModalSaving, setIntModalSaving] = useState(false);

  // BugSnap API Keys state
  const [apiKeys, setApiKeys] = useState<Array<{ id: string; name: string; prefix: string; createdAt: string; lastUsedAt: string | null }>>([]);
  const [apiKeysLoading, setApiKeysLoading] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [creatingKey, setCreatingKey] = useState(false);
  const [revokingKeyId, setRevokingKeyId] = useState<string | null>(null);
  const [revealedBugsnapKey, setRevealedBugsnapKey] = useState<{ rawKey: string; name: string } | null>(null);

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const url = new URL(window.location.href);
    const driveResult = url.searchParams.get("drive");
    if (driveResult === "connected") { setDriveSuccess(t("settings.driveConnectedOk")); }
    else if (driveResult === "error") { setDriveError(t("settings.driveError")); }
    if (driveResult) {
      url.searchParams.delete("drive");
      router.replace(`${url.pathname}${url.search}${url.hash}`, { scroll: false });
    }
  }, [router, t]);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const u = data.session?.user;
      if (!u) return;
      setUserEmail(u.email ?? "");
      const initialName = u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split("@")[0] || "";
      const [fn, ...rest] = initialName.trim().split(/\s+/);
      setFirstName(fn || "");
      setLastName(rest.join(" "));
      setUserAvatar(pickAvatar(u.user_metadata?.avatar_url, u.user_metadata?.picture));
      let plan: Plan = normalizePlan(u.user_metadata?.plan);
      if (u.email) {
        const { data: row } = await supabase.from("users").select("plan, avatar_url, full_name, job_role, notification_prefs").ilike("email", u.email).maybeSingle();
        if (row?.plan) plan = normalizePlan(row.plan);
        if (isRealAvatar(row?.avatar_url)) setUserAvatar(row.avatar_url);
        if (row?.full_name) {
          const [rfn, ...rrest] = row.full_name.trim().split(/\s+/);
          setFirstName(rfn || "");
          setLastName(rrest.join(" "));
        }
        if (row?.job_role) setJobRole(row.job_role);
        if (row?.notification_prefs) setNotifPrefs((prev) => ({ ...prev, ...row.notification_prefs }));
      }
      setUserPlan(plan);
      if (activeWsId) {
        const [{ data: wsData }, { data: wsSet }] = await Promise.all([
          supabase.from("workspaces").select("name, avatar_url").eq("id", activeWsId).maybeSingle(),
          supabase.from("workspace_settings").select("*").eq("workspace_id", activeWsId).maybeSingle()
        ]);
        if (wsData?.name) setWorkspaceName(wsData.name);
        if (wsData?.avatar_url) setWorkspaceAvatar(wsData.avatar_url);
        if (wsSet) {
          setWebhookUrl(wsSet.webhook_url || "");
          setBrandName(wsSet.brand_name || "BugSnap");
          setLogoUrl(wsSet.custom_logo_url || "");
          setHideWatermark(!!wsSet.hide_watermark);
          setCustomDomain(wsSet.custom_domain || "");
          setAutoDeleteMonths(wsSet.auto_delete_months ?? 3);
          setAutoDeleteEnabled(wsSet.auto_delete_months !== 0);
          if (wsSet.integrations && typeof wsSet.integrations === "object") {
            setWsIntegrations(wsSet.integrations as Record<string, Record<string, string>>);
          }
        }
      } else {
        const { data: myWs } = await supabase.rpc("get_my_workspaces");
        if (myWs && myWs.length > 0) {
          setWorkspaceName(myWs[0].name || "My Workspace");
        }
      }
    });
  }, [activeWsId]);

  useEffect(() => {
    if (!activeWsId || activeTab !== "members") return;
    setMembersLoading(true);
    (async () => {
      try {
        const { data } = await supabase.rpc("get_workspace_members", { p_workspace_id: activeWsId });
        setMembers((data as typeof members) ?? []);
      } finally {
        setMembersLoading(false);
      }
    })();
  }, [activeWsId, activeTab]);

  function formatDriveBytes(bytes: number | null) {
    if (!Number.isFinite(bytes) || bytes == null || bytes < 0) return null;
    const units = ["B", "KB", "MB", "GB", "TB", "PB"];
    let value = bytes;
    let idx = 0;
    while (value >= 1024 && idx < units.length - 1) {
      value /= 1024;
      idx++;
    }
    const fixed = value >= 100 || idx === 0 ? 0 : value >= 10 ? 1 : 2;
    return `${value.toFixed(fixed)} ${units[idx]}`;
  }

  async function driveRequest(path: string, init?: RequestInit) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error(t("settings.sessionExpired"));
    const res = await fetch(path, { ...init, headers: { ...init?.headers, Authorization: `Bearer ${token}` } });
    const result = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(result.error || t("settings.driveError"));
    return result;
  }

  useEffect(() => {
    let c = false;
    driveRequest("/api/google-drive/status")
      .then(r => {
        if (!c) {
          setDriveStatus((r.status as "connected" | "reconnect_required" | "not_connected") || (r.connected ? "connected" : "not_connected"));
          setDriveEmail(r.email || null);
          setDriveQuota(r.quota || null);
        }
      })
      .catch(() => {})
      .finally(() => { if (!c) setDriveLoading(false); });
    return () => { c = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let c = false;
    driveRequest("/api/integrations/health")
      .then((r) => {
        if (!c) setIntegrationsHealth(r as typeof integrationsHealth);
      })
      .catch(() => {})
      .finally(() => { if (!c) setIntegrationsLoading(false); });
    return () => { c = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function connectDrive() {
    if (driveActionLoading) return;
    setDriveActionLoading(true); setDriveError(null);
    try {
      const r = await driveRequest("/api/google-drive/connect", { method: "POST" });
      if (!r.url) throw new Error(t("settings.noAuthUrl"));
      window.location.assign(r.url);
    } catch (e) { setDriveError(e instanceof Error ? e.message : t("settings.connectError")); showToast("Drive connection failed", "error"); setDriveActionLoading(false); }
  }

  async function disconnectDrive() {
    if (driveActionLoading) return;
    setDriveActionLoading(true); setDriveError(null);
    try {
      await driveRequest("/api/google-drive/disconnect", { method: "DELETE" });
      setDriveStatus("not_connected"); setDriveEmail(null); setDriveQuota(null);
      setIntegrationsHealth((prev) => prev ? { ...prev, drive: { state: "not_configured", status: "not_connected", email: null, message: "Google Drive is not connected" } } : prev);
      showToast("Drive disconnected", "success");
    } catch (e) { setDriveError(e instanceof Error ? e.message : t("settings.disconnectError")); showToast("Drive disconnect failed", "error"); }
    finally { setDriveActionLoading(false); }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setSaveError(null); setSaved(false);
    try {
      if (!activeWsId) throw new Error(t("settings.noWs"));
      const canBrand = hasBranding(normalizePlan(userPlan));

      // Update workspace name if changed
      if (workspaceName.trim() || workspaceAvatar !== undefined) {
        await supabase.from("workspaces").update({ 
          name: workspaceName.trim() || undefined,
          avatar_url: workspaceAvatar.trim() || null
        }).eq("id", activeWsId);
      }

      const effectiveAutoDelete = autoDeleteEnabled ? autoDeleteMonths : 0;
      const { error } = await supabase.from("workspace_settings").upsert({
        workspace_id: activeWsId,
        webhook_url: webhookUrl.trim(),
        brand_name: canBrand ? brandName.trim() || "BugSnap" : "BugSnap",
        custom_logo_url: canBrand ? logoUrl.trim() : "",
        hide_watermark: canBrand ? hideWatermark : false,
        custom_domain: canBrand ? customDomain.trim() : "",
        auto_delete_months: [0,3,6,12].includes(effectiveAutoDelete) ? effectiveAutoDelete : 3,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      setSaved(true); setTimeout(() => setSaved(false), 3000);
      showToast("Saved", "success");
      if (effectiveAutoDelete !== 0) {
        for (let i = 0; i < 20; i++) {
          const { data, error: e2 } = await supabase.rpc("delete_expired_captures", { p_workspace_id: activeWsId, p_batch_limit: 100 });
          if (e2 || !data || Number(data) <= 0) break;
        }
      }
    } catch (e) { setSaveError(e instanceof Error ? e.message : t("settings.failedSave")); showToast("Save failed", "error"); }
    finally { setSaving(false); }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSaveError(null);
    setProfileSaved(false);
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      const avatarUrl = userAvatar.trim();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Session expired");

      // ponytail: auth metadata is best-effort (large data: avatars can exceed its size limit); public.users below is the source of truth
      try {
        await supabase.auth.updateUser({ data: { full_name: fullName } });
      } catch {}

      const response = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fullName, avatarUrl, jobRole }),
      });
      const result = await response.json().catch(() => ({})) as { full_name?: string; avatar_url?: string; job_role?: string; error?: string };
      if (!response.ok) throw new Error(result.error || "Failed to save profile");

      if (isRealAvatar(result.avatar_url)) setUserAvatar(result.avatar_url);
      if (result.job_role !== undefined) setJobRole(result.job_role || "");
      window.dispatchEvent(new CustomEvent("bugsnap:profile-updated", { detail: { fullName, avatarUrl: result.avatar_url ?? avatarUrl } }));
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
      showToast("Profile saved", "success");
    } catch (e) {
      setProfileSaveError(e instanceof Error ? e.message : "Failed to save profile");
      showToast("Profile save failed", "error");
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleInvite() {
    const email = inviteEmail.trim();
    if (!email || !activeWsId || inviting) return;
    const cap = seatLimit(userPlan);
    if (cap !== null && members.length >= cap) { setInviteMsg({ type:"err", text: t("members.seatLimit", { cap }) }); return; }
    setInviting(true); setInviteMsg(null);
    try {
      const { error } = await supabase.rpc("invite_member_by_email", { p_workspace_id: activeWsId, p_email: email, p_role: inviteRole });
      if (error) throw error;
      const { data: authData } = await supabase.auth.getSession();
      await fetch("/api/notifications/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(authData.session?.access_token ? { Authorization: `Bearer ${authData.session.access_token}` } : {}) },
        body: JSON.stringify({ email, workspaceId: activeWsId }),
      }).catch(() => null);
      setInviteEmail("");
      setInviteMsg({ type:"ok", text: `Invite sent to ${email}` });
      showToast("Invite sent", "success");
      const { data: fresh } = await supabase.rpc("get_workspace_members", { p_workspace_id: activeWsId });
      setMembers((fresh as typeof members) ?? []);
    } catch (e) { setInviteMsg({ type:"err", text: (e as {message?:string})?.message || t("members.inviteFailed") }); showToast("Invite failed", "error"); }
    finally { setInviting(false); }
  }

  async function handleSaveIntegration(id: string) {
    if (!activeWsId) {
      showToast(t("settings.noWs"), "error");
      return;
    }
    setIntModalSaving(true);
    try {
      const updatedIntegrations = {
        ...wsIntegrations,
        [id]: {
          url: intModalForm.url.trim(),
          apiKey: intModalForm.apiKey.trim(),
        }
      };

      const { error } = await supabase.from("workspace_settings").upsert({
        workspace_id: activeWsId,
        integrations: updatedIntegrations,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      setWsIntegrations(updatedIntegrations);
      setActiveModalInt(null);
      showToast(`${id === "aksora" ? "Aksora" : "SnapTest"} integration saved`, "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save integration";
      showToast(msg, "error");
    } finally {
      setIntModalSaving(false);
    }
  }

  async function handleDisconnectIntegration(id: string) {
    if (!activeWsId) return;
    setIntModalSaving(true);
    try {
      const updatedIntegrations = { ...wsIntegrations };
      delete updatedIntegrations[id];

      const { error } = await supabase.from("workspace_settings").upsert({
        workspace_id: activeWsId,
        integrations: updatedIntegrations,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      setWsIntegrations(updatedIntegrations);
      setActiveModalInt(null);
      showToast("Integration disconnected", "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to disconnect";
      showToast(msg, "error");
    } finally {
      setIntModalSaving(false);
    }
  }

  // BugSnap API Keys handlers
  async function loadBugsnapApiKeys() {
    if (!activeWsId) return;
    setApiKeysLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;
      const res = await fetch(`/api/settings/api-keys?workspaceId=${encodeURIComponent(activeWsId)}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setApiKeys(data.keys || []);
      }
    } catch {
      // Non-blocking
    } finally {
      setApiKeysLoading(false);
    }
  }

  async function handleCreateBugsnapApiKey(e: React.FormEvent) {
    e.preventDefault();
    if (!activeWsId || !newKeyName.trim()) return;
    setCreatingKey(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Not authenticated");
      const res = await fetch("/api/settings/api-keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ workspaceId: activeWsId, name: newKeyName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create API key");
      setRevealedBugsnapKey({ rawKey: data.key.rawKey, name: data.key.name });
      setNewKeyName("");
      showToast("BugSnap API key created", "success");
      await loadBugsnapApiKeys();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create key";
      showToast(msg, "error");
    } finally {
      setCreatingKey(false);
    }
  }

  async function handleRevokeBugsnapApiKey(id: string) {
    if (!activeWsId || !confirm("Revoke this BugSnap API key? Any tools using it will lose access immediately.")) return;
    setRevokingKeyId(id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Not authenticated");
      const res = await fetch(`/api/settings/api-keys?workspaceId=${encodeURIComponent(activeWsId)}&id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to revoke API key");
      showToast("API key revoked", "success");
      await loadBugsnapApiKeys();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to revoke key";
      showToast(msg, "error");
    } finally {
      setRevokingKeyId(null);
    }
  }

  useEffect(() => {
    if (activeTab === "integrations" && activeWsId) {
      loadBugsnapApiKeys();
    }
  }, [activeTab, activeWsId]);

  // ── Helper ────────────────────────────────────────────────────────────────
  function setTab(tab: Tab) {
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    router.replace(`${url.pathname}${url.search}`, { scroll: false });
  }

  const navItem = (tab: Tab, label: string, icon: React.ReactNode) => (
    <button
      type="button"
      onClick={() => setTab(tab)}
      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-colors text-left ${
        activeTab === tab ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 font-semibold" : "text-muted hover:bg-border/30 hover:text-foreground"
      }`}
    >
      <span className="shrink-0 w-4 h-4 flex items-center justify-center">{icon}</span>
      {label}
    </button>
  );

  const filteredIntegrations = INTEGRATIONS.filter(i =>
    i.name.toLowerCase().includes(intSearch.toLowerCase()) ||
    i.desc.toLowerCase().includes(intSearch.toLowerCase())
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-border bg-background px-4 py-7 flex flex-col gap-7 h-full overflow-y-auto">
        <div className="px-3 py-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon.svg" alt="BugSnap" className="w-7 h-7 shrink-0 object-contain" />
            <div>
              <h1 className="text-sm font-bold tracking-tight text-foreground leading-none">
                BugSnap
              </h1>
              <p className="text-[9px] text-muted mt-1 leading-none font-medium">Workspace Settings</p>
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-5">
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined" && window.history.length > 1) {
                router.back();
              } else {
                router.push(wsParam ? `/captures?ws=${wsParam}` : "/captures");
              }
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-muted hover:text-foreground hover:bg-border/30 rounded-lg transition-colors text-left font-medium"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to app
          </button>
        </div>

        <div>
          <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted">Workspace</p>
          {navItem("general","General",<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>)}
          {navItem("members","Members",<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>)}
          {navItem("billing","Billing",<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>)}
        </div>

        <div>
          <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted">Apps & Tools</p>
          {navItem("integrations","Integrations",<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>)}
          {navItem("webhooks","Webhooks",<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>)}
        </div>

        <div>
          <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted">Account</p>
          {navItem("account","Account",<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>)}
          {navItem("notifications","Notifications",<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>)}
        </div>
      </aside>

      {/* Panel */}
      <main className="flex-1 min-w-0 overflow-y-auto w-full bg-background">
        <div className="sticky top-0 z-10 bg-background border-b border-border px-8 lg:px-10 py-7">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{TAB_TITLES[activeTab].title}</h1>
          <p className="text-[15px] text-muted mt-2">{TAB_TITLES[activeTab].subtitle}</p>
        </div>
        <div className="max-w-5xl mx-auto w-full p-8 lg:p-10">

        {/* ── General (Jam.dev styled) ────────────────────────────── */}
        {activeTab === "general" && (
          <form onSubmit={handleSave} className="space-y-6">

            {/* Workspace Name & Avatar Section */}
            <div className="rounded-xl border border-border bg-background p-5 space-y-5">
              <div>
                <h2 className="text-sm font-bold text-foreground mb-3">Workspace name</h2>
                <div className="flex items-center gap-3.5">
                  {workspaceAvatar ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={workspaceAvatar} alt={workspaceName} className="w-11 h-11 rounded-lg object-cover shrink-0 border border-border" />
                  ) : (
                    <div className="w-11 h-11 rounded-lg bg-indigo-600 text-white font-bold text-lg flex items-center justify-center shadow-sm shrink-0 uppercase select-none">
                      {(workspaceName || "W").charAt(0)}
                    </div>
                  )}
                  {editingWsName ? (
                    <input
                      autoFocus
                      type="text"
                      value={workspaceName}
                      onChange={(e) => setWorkspaceName(e.target.value)}
                      onBlur={() => setEditingWsName(false)}
                      onKeyDown={(e) => e.key === "Enter" && setEditingWsName(false)}
                      placeholder="My Workspace"
                      className="flex-1 text-sm font-medium rounded-lg border border-border px-3.5 py-2.5 outline-none focus:border-indigo-500 bg-background text-foreground transition-colors shadow-sm"
                    />
                  ) : (
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{workspaceName || "My Workspace"}</p>
                      <p className="text-xs text-muted mt-0.5">This is the name of your workspace.</p>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setEditingWsName((v) => !v)}
                    className="text-xs font-semibold rounded-lg border border-border px-3.5 py-2 bg-background hover:bg-border/30 transition-colors shrink-0"
                  >
                    {editingWsName ? "Done" : "Edit"}
                  </button>
                </div>
              </div>
              
              <div className="border-t border-border pt-4">
                <label className="block text-xs font-semibold text-foreground mb-1">Workspace Icon URL</label>
                <input
                  type="url"
                  value={workspaceAvatar}
                  onChange={(e) => setWorkspaceAvatar(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="w-full text-xs rounded-lg border border-border px-3 py-2 outline-none focus:border-indigo-500 bg-subtle font-mono text-foreground"
                />
                <p className="text-[11px] text-muted mt-1.5">Leave blank to use the default initial letter icon. Square images work best.</p>
              </div>
            </div>

            {/* Access Section */}
            <div className="rounded-xl border border-border bg-background p-5 space-y-4">
              <h2 className="text-sm font-bold text-foreground border-b border-border pb-2.5">
                Access
              </h2>

              {/* Single Sign-On (SSO) */}
              <div className="flex items-start justify-between gap-4 pt-1">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">Single Sign-On</span>
                    <span className="text-[10px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/40 px-1.5 py-0.5 rounded">
                      Enterprise
                    </span>
                  </div>
                  <p className="text-xs text-muted">
                    Require workspace members to authenticate using SAML / Okta SSO.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={ssoRequired}
                  onClick={() => {
                    if (userPlan !== "enterprise") {
                      router.push("/upgrade");
                      return;
                    }
                    setSsoRequired(!ssoRequired);
                  }}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out mt-0.5 ${
                    ssoRequired ? "bg-indigo-600" : "bg-border"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out ${
                      ssoRequired ? "translate-x-4" : "translate-x-0.5"
                    } mt-0.5`}
                  />
                </button>
              </div>

              {/* Default Link Access */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border/60">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">Default link access</span>
                    <span className="text-[10px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/40 px-1.5 py-0.5 rounded">
                      Team
                    </span>
                  </div>
                  <p className="text-xs text-muted">
                    Default visibility applied when recording links are generated.
                  </p>
                </div>
                <Dropdown
                  variant="field"
                  className="w-full sm:w-56"
                  value={defaultLinkAccess}
                  onChange={(v) => setDefaultLinkAccess(v as "anyone" | "team" | "private")}
                  options={[
                    { value: "anyone", label: "Anyone with link can view" },
                    { value: "team", label: "Workspace members only" },
                    { value: "private", label: "Only invited participants" },
                  ]}
                />
              </div>
            </div>

            {/* Data Section */}
            <div className="rounded-xl border border-border bg-background p-5 space-y-4">
              <h2 className="text-sm font-bold text-foreground border-b border-border pb-2.5">
                Data
              </h2>

              {/* AI summaries */}
              <div className="flex items-start justify-between gap-4 pt-1">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">AI Summaries & Repro Steps</span>
                  </div>
                  <p className="text-xs text-muted">
                    Allow AI generated summaries and repro steps on new captures.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={allowAi}
                  onClick={() => setAllowAi(!allowAi)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out mt-0.5 ${
                    allowAi ? "bg-indigo-600" : "bg-border"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out ${
                      allowAi ? "translate-x-4" : "translate-x-0.5"
                    } mt-0.5`}
                  />
                </button>
              </div>

              {/* Auto-delete captures */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border/60">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">Auto-delete captures</span>
                    <span className="text-[10px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/40 px-1.5 py-0.5 rounded">
                      Enterprise
                    </span>
                  </div>
                  <p className="text-xs text-muted">
                    Automatically delete captures older than the selected retention window.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={autoDeleteEnabled}
                    onClick={() => {
                      if (userPlan !== "enterprise" && userPlan !== "pro_plus") {
                        router.push("/upgrade");
                        return;
                      }
                      setAutoDeleteEnabled(!autoDeleteEnabled);
                    }}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out ${
                      autoDeleteEnabled ? "bg-indigo-600" : "bg-border"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out ${
                        autoDeleteEnabled ? "translate-x-4" : "translate-x-0.5"
                      } mt-0.5`}
                    />
                  </button>
                  {autoDeleteEnabled && (
                    <Dropdown
                      variant="field"
                      className="w-auto"
                      value={String(autoDeleteMonths)}
                      onChange={(v) => setAutoDeleteMonths(Number(v))}
                      options={[3, 6, 12].map((m) => ({ value: String(m), label: `${m} months` }))}
                    />
                  )}
                </div>
              </div>

              {/* Audit logs */}
              <div className="flex items-start justify-between gap-4 pt-3 border-t border-border/60">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">Audit logs</span>
                    <span className="text-[10px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/40 px-1.5 py-0.5 rounded">
                      Enterprise
                    </span>
                  </div>
                  <p className="text-xs text-muted">
                    Track workspace events, captures access, exports, and security audits.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={auditLogsEnabled}
                  onClick={() => {
                    if (userPlan !== "enterprise") {
                      router.push("/upgrade");
                      return;
                    }
                    setAuditLogsEnabled(!auditLogsEnabled);
                  }}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out mt-0.5 ${
                    auditLogsEnabled ? "bg-indigo-600" : "bg-border"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out ${
                      auditLogsEnabled ? "translate-x-4" : "translate-x-0.5"
                    } mt-0.5`}
                  />
                </button>
              </div>
            </div>

            {/* Custom Branding (Integrated) */}
            <div className="rounded-xl border border-border bg-background p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <h2 className="text-sm font-bold text-foreground">
                  Custom branding
                </h2>
                <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 px-2 py-0.5 rounded-full">
                  Included
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">Brand Name</label>
                  <input
                    type="text"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="Acme Corp"
                    className="w-full text-sm rounded-lg border border-border px-3 py-2 outline-none focus:border-indigo-500 bg-background text-foreground shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">Logo URL</label>
                  <input
                    type="url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://logo.png"
                    className="w-full text-sm rounded-lg border border-border px-3 py-2 outline-none focus:border-indigo-500 bg-background text-foreground shadow-sm"
                  />
                </div>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hideWatermark}
                  onChange={(e) => setHideWatermark(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs font-medium text-foreground">
                  Hide &quot;Powered by BugSnap&quot; watermark
                </span>
              </label>
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Custom Domain</label>
                <input
                  type="text"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  placeholder="captures.yourcompany.com"
                  className="w-full text-sm rounded-lg border border-border px-3 py-2 outline-none focus:border-indigo-500 bg-background text-foreground font-mono shadow-sm"
                />
              </div>
            </div>

            {saveError && <p className="text-xs text-red-600">{saveError}</p>}
            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-all shadow-sm active:scale-[0.99] min-w-[130px]"
              >
                {saving ? "Saving…" : saved ? "Saved" : "Save changes"}
              </button>
            </div>
          </form>
        )}

        {/* ── Members ────────────────────────────────────────────────────── */}
        {activeTab === "members" && (
          <div className="space-y-7">

            {/* Invite */}
            <div className="rounded-xl border border-border bg-background p-6 space-y-5 shadow-sm">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-foreground">Invite member</h2>
                <p className="text-[15px] text-muted mt-3">If they don&apos;t have an account yet, we&apos;ll send them a join link + extension download.</p>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_190px_96px] gap-3">
                <input type="email" value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleInvite()}
                  disabled={seatLimit(userPlan) !== null && members.length >= (seatLimit(userPlan) ?? 0)}
                  placeholder="Enter email address"
                  className="h-12 min-w-0 text-[15px] rounded-lg border border-border px-4 outline-none focus:border-indigo-500 bg-background disabled:bg-border/30 disabled:cursor-not-allowed" />
                <div className="relative">
                  <button type="button" onClick={() => setInviteRoleMenuOpen(o => !o)}
                    className="h-12 w-full flex items-center justify-between text-[15px] rounded-lg border border-border px-4 bg-background hover:bg-border/30 transition-colors">
                    {inviteRole === "creator" ? "Creator" : "Viewer"}
                    <svg className={`w-4 h-4 text-muted transition-transform ${inviteRoleMenuOpen ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {inviteRoleMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setInviteRoleMenuOpen(false)} />
                      <div className="absolute right-0 mt-1 w-64 rounded-lg border border-border bg-background shadow-lg z-50 py-1">
                        {([
                          { value: "creator", label: "Creator", hint: "Can create and comment" },
                          { value: "viewer", label: "Viewer", hint: "Can view and comment" },
                        ] as const).map(opt => (
                          <button key={opt.value} type="button" onClick={() => { setInviteRole(opt.value); setInviteRoleMenuOpen(false); }}
                            className="w-full flex items-start justify-between gap-2 px-3.5 py-2 text-left hover:bg-border/30 transition-colors">
                            <span>
                              <span className="block text-sm font-medium text-foreground">{opt.label}</span>
                              <span className="block text-xs text-muted">{opt.hint}</span>
                            </span>
                            {inviteRole === opt.value && (
                              <svg className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <button type="button" onClick={handleInvite} disabled={inviting || !inviteEmail.trim()}
                  className="h-12 rounded-lg bg-indigo-600 text-white text-[15px] font-semibold hover:bg-indigo-700 disabled:opacity-50">
                  {inviting ? "Sending…" : "Invite"}
                </button>
              </div>
              {inviteMsg && <p className={`text-sm ${inviteMsg.type==="ok" ? "text-emerald-600" : "text-red-600"}`}>{inviteMsg.text}</p>}
            </div>

            {/* Members list */}
            <div className="rounded-xl border border-border bg-background overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <h2 className="text-lg font-bold tracking-tight text-foreground">{membersLoading ? "Loading…" : `${members.length} member${members.length !== 1 ? "s" : ""}`}</h2>
              </div>
              {membersLoading ? (
                <div className="divide-y divide-border/60 animate-pulse">
                  {[0,1,2].map(i => (
                    <div key={i} className="flex items-center gap-4 px-6 py-5">
                      <div className="w-12 h-12 rounded-full bg-border/40" />
                      <div className="flex-1 space-y-2"><div className="h-4 w-1/3 bg-border/40 rounded" /><div className="h-3 w-1/4 bg-border/40 rounded" /></div>
                    </div>
                  ))}
                </div>
              ) : members.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted">No members yet. Invite someone above.</div>
              ) : (
                <ul className="divide-y divide-border/60">
                  {members.map(m => (
                    <li key={m.user_id} className="flex items-center gap-5 px-6 py-5">
                      <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-700 text-base font-bold flex items-center justify-center shrink-0">
                        {(m.email || "?").charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-bold text-foreground truncate">{m.email}</p>
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider text-muted">{m.role==="owner" ? "Owner" : m.role==="viewer" ? "Viewer" : "Creator"}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* ── Billing ────────────────────────────────────────────────────── */}
        {activeTab === "billing" && (
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-background p-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-muted uppercase tracking-widest font-semibold mb-1">Current plan</p>
                <h2 className="text-2xl font-bold text-foreground capitalize">{tierLabel(userPlan)}</h2>
                <p className="text-sm text-muted mt-1">
                  {seatLimit(userPlan) !== null ? `Up to ${seatLimit(userPlan)} team members` : "Unlimited team members"}
                </p>
              </div>
              {userPlan === "free" && (
                <Link
                  href="/upgrade"
                  className="shrink-0 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors inline-block"
                >
                  Upgrade
                </Link>
              )}
            </div>

            <div className="rounded-xl border border-border bg-background p-4 space-y-3">
              <h2 className="text-sm font-semibold text-foreground border-b border-border pb-2">Plan features</h2>
              {[
                { label:"Weekly capture quota", value: userPlan==="free" ? "5 captures/week" : "Unlimited" },
                { label:"Team seats", value: seatLimit(userPlan) !== null ? `${seatLimit(userPlan)}` : "Unlimited" },
                { label:"AI bug reports", value: userPlan==="pro_plus"||userPlan==="enterprise" ? "✓ Included" : "Pro+ only" },
                { label:"Custom branding", value: hasBranding(userPlan) ? "✓ Included" : "Pro+ only" },
              ].map(r => (
                <div key={r.label} className="flex items-center justify-between text-sm">
                  <span className="text-muted">{r.label}</span>
                  <span className="font-medium text-foreground">{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Integrations ───────────────────────────────────────────────── */}
        {activeTab === "integrations" && (
          <div className="space-y-6">
            <input type="text" placeholder="Search integrations…" value={intSearch} onChange={e=>setIntSearch(e.target.value)}
              className="w-full text-sm rounded-lg border border-border px-3 py-2 outline-none focus:border-indigo-500 bg-background" />

            {/* Drive */}
            <div className="rounded-xl border border-border bg-background p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    Google Drive
                    {!driveLoading && <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${driveStatus === "connected" ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40" : driveStatus === "reconnect_required" ? "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/40" : "text-muted bg-background border-border"}`}>{driveStatus === "connected" ? t("settings.connected") : driveStatus === "reconnect_required" ? t("settings.reconnectRequired") : t("settings.notConnected")}</span>}
                  </h2>
                  <p className="text-xs text-muted mt-0.5">{driveLoading ? "Checking..." : driveStatus === "connected" ? `Dashboard actions using ${driveEmail || "connected account"}` : driveStatus === "reconnect_required" ? "Reconnect Drive for server-side actions." : "Connect for server-side Drive actions."}</p>
                  {!driveLoading && driveStatus === "connected" && driveQuota?.usedBytes != null && driveQuota?.totalBytes != null && driveQuota.totalBytes > 0 && (() => {
                    const pct = Math.max(0, Math.min(100, (driveQuota.usedBytes / driveQuota.totalBytes) * 100));
                    const barColor = pct >= 90 ? "bg-red-500" : pct >= 75 ? "bg-amber-500" : "bg-indigo-500";
                    return (
                      <div className="mt-2 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] text-muted">{formatDriveBytes(driveQuota.usedBytes)} of {formatDriveBytes(driveQuota.totalBytes)} used</p>
                          <p className="text-[11px] text-muted">{pct.toFixed(pct < 1 ? 1 : 0)}%</p>
                        </div>
                        <div className="h-1.5 rounded-full bg-border overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })()}
                  <p className="text-[11px] text-muted">Extension connection is managed separately.</p>
                </div>
                {driveStatus === "connected" ? (
                  <button type="button" onClick={disconnectDrive} disabled={driveActionLoading} className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-50">{driveActionLoading ? "Disconnecting…" : "Disconnect"}</button>
                ) : (
                  <button type="button" onClick={() => setConnectDriveModalOpen(true)} disabled={driveLoading || driveActionLoading} className="text-xs font-semibold text-indigo-600 hover:underline disabled:opacity-50">{driveStatus === "reconnect_required" ? "Reconnect" : "Connect"}</button>
                )}
              </div>
              {driveSuccess && <p className="text-xs text-emerald-600">{driveSuccess}</p>}
              {driveError && <p className="text-xs text-red-600">{driveError}</p>}
            </div>

            <div className="rounded-xl border border-border bg-background p-4 space-y-3">
              <div>
                <h2 className="text-sm font-semibold text-foreground">{t("settings.integrationsHealth")}</h2>
                <p className="text-xs text-muted mt-0.5">{t("settings.integrationsHealthHint")}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: "Email delivery", item: integrationsHealth?.email, meta: integrationsHealth?.email?.provider || null },
                  { label: "AI summaries", item: integrationsHealth?.ai, meta: integrationsHealth?.ai?.provider || null },
                ].map(({ label, item, meta }) => {
                  const state = item?.state;
                  const badge = integrationsLoading
                    ? "Checking..."
                    : state === "healthy"
                    ? t("settings.healthHealthy")
                    : state === "action_required"
                    ? t("settings.healthActionRequired")
                    : t("settings.healthNotConfigured");
                  const badgeClass = integrationsLoading
                    ? "text-muted bg-background border-border"
                    : state === "healthy"
                    ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40"
                    : state === "action_required"
                    ? "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/40"
                    : "text-muted bg-background border-border";
                  return (
                    <div key={label} className="rounded-lg border border-border bg-background dark:bg-background p-3 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold text-foreground">{label}</p>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badgeClass}`}>{badge}</span>
                      </div>
                      <p className="text-xs text-muted leading-snug">{integrationsLoading ? "Checking integration health..." : item?.message || "No status available."}</p>
                      {meta && <p className="text-[11px] text-foreground/80 font-medium break-all">{meta}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredIntegrations.map(int => {
                const isCustomConfigurable = int.id === "aksora" || int.id === "snaptest";
                const config = wsIntegrations[int.id];
                const isConnected = !!(config && (config.url || config.apiKey));

                return (
                  <div key={int.id} className="rounded-xl border border-border bg-background p-4 flex items-start gap-3 hover:border-indigo-200 transition-colors">
                    <div className="shrink-0 w-10 h-10 rounded-lg border border-border bg-background flex items-center justify-center">
                      {int.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{int.name}</p>
                        {isCustomConfigurable && isConnected && (
                          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/40 px-1.5 py-0.2 rounded-full">
                            Connected
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted mt-0.5 leading-snug">{int.desc}</p>
                      {isCustomConfigurable && isConnected && config.url && (
                        <p className="text-[11px] text-muted font-mono truncate mt-1">{config.url}</p>
                      )}
                    </div>
                    {isCustomConfigurable ? (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveModalInt(int.id);
                          setIntModalForm({
                            url: config?.url || (int.id === "snaptest" ? "http://localhost:3000" : ""),
                            apiKey: config?.apiKey || ""
                          });
                        }}
                        className={`shrink-0 text-xs font-semibold hover:underline mt-0.5 ${isConnected ? "text-muted hover:text-foreground" : "text-indigo-600"}`}
                      >
                        {isConnected ? "Configure" : "Connect"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => alert(`${int.name} integration coming soon!`)}
                        className="shrink-0 text-xs font-semibold text-indigo-600 hover:underline mt-0.5"
                      >
                        Connect
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            {filteredIntegrations.length === 0 && <p className="text-sm text-muted text-center py-8">No integrations match your search.</p>}

            {/* ── BugSnap Public API Keys ─────────────────────────────────── */}
            <div className="rounded-xl border border-border bg-background p-4 space-y-4 pt-5 border-t-2">
              <div>
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <span>BugSnap API Keys</span>
                  <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/40 px-2 py-0.5 rounded-full">
                    Inbound API
                  </span>
                </h2>
                <p className="text-xs text-muted mt-0.5">
                  Generate API keys to let Aksora, SnapTest, CI/CD pipelines, and other external services push captures directly into this workspace.
                </p>
              </div>

              {revealedBugsnapKey && (
                <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 space-y-2">
                  <p className="text-xs font-semibold">Save your BugSnap API Key: &ldquo;{revealedBugsnapKey.name}&rdquo;</p>
                  <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80">
                    This key will never be shown again. Copy it now to authenticate requests with <code className="font-mono bg-black/10 px-1 py-0.5 rounded">Authorization: Bearer bugsnap_...</code>
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <code className="flex-1 px-3 py-1.5 bg-black/10 dark:bg-black/40 rounded text-xs font-mono select-all overflow-x-auto">
                      {revealedBugsnapKey.rawKey}
                    </code>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(revealedBugsnapKey.rawKey);
                        showToast("API key copied!", "success");
                      }}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded text-xs font-medium"
                    >
                      Copy
                    </button>
                    <button
                      type="button"
                      onClick={() => setRevealedBugsnapKey(null)}
                      className="px-3 py-1.5 bg-border hover:bg-border/80 text-foreground rounded text-xs"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={handleCreateBugsnapApiKey} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Key name (e.g. SnapTest AI Integration)"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="flex-1 text-xs rounded-lg border border-border px-3 py-2 outline-none focus:border-indigo-500 bg-background"
                />
                <button
                  type="submit"
                  disabled={creatingKey || !newKeyName.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shrink-0"
                >
                  {creatingKey ? "Generating…" : "Generate Key"}
                </button>
              </form>

              <div className="space-y-2 pt-2">
                <h3 className="text-[11px] font-semibold text-muted uppercase tracking-wider">Active Workspace Keys</h3>
                {apiKeysLoading ? (
                  <p className="text-xs text-muted py-2">Loading API keys…</p>
                ) : apiKeys.length === 0 ? (
                  <p className="text-xs text-muted py-2 italic">No active API keys for this workspace.</p>
                ) : (
                  <div className="divide-y divide-border/60">
                    {apiKeys.map((k) => (
                      <div key={k.id} className="py-2 flex items-center justify-between gap-3">
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-foreground truncate">{k.name}</span>
                            <code className="text-[10px] px-1.5 py-0.5 rounded bg-border/40 font-mono text-muted">{k.prefix}...</code>
                          </div>
                          <p className="text-[10px] text-muted">
                            Created: {new Date(k.createdAt).toLocaleDateString()} &bull; Last used:{" "}
                            {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : "Never"}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRevokeBugsnapApiKey(k.id)}
                          disabled={revokingKeyId === k.id}
                          className="text-xs text-red-600 hover:underline disabled:opacity-50 shrink-0"
                        >
                          {revokingKeyId === k.id ? "Revoking…" : "Revoke"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Webhooks ───────────────────────────────────────────────────── */}
        {activeTab === "webhooks" && (
          <form onSubmit={handleSave} className="space-y-6">
            <div className="rounded-xl border border-border bg-background p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <h2 className="text-sm font-semibold text-foreground">Slack / Discord / Zapier</h2>
                {webhookUrl.trim() ? (
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/40 px-2 py-0.5 rounded-full">Active</span>
                ) : (
                  <span className="text-[10px] font-semibold text-muted bg-background border border-border px-2 py-0.5 rounded-full">Not configured</span>
                )}
              </div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Webhook URL</label>
              <input type="url" value={webhookUrl} onChange={e=>setWebhookUrl(e.target.value)}
                placeholder="https://hooks.slack.com/services/..."
                className="w-full text-sm rounded-lg border border-border px-3 py-2 outline-none focus:border-indigo-500 bg-background font-mono" />
              <p className="text-[11px] text-muted">We POST a JSON payload with capture URL, thumbnail, and metadata when a new bug is saved.</p>
            </div>
            {saveError && <p className="text-xs text-red-600">{saveError}</p>}
            <div>
              <button type="submit" disabled={saving} className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors min-w-[100px]">{saving ? "Saving…" : saved ? "Saved" : "Save"}</button>
            </div>
          </form>
        )}

        {/* ── Account ────────────────────────────────────────────────────── */}
        {activeTab === "account" && (
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="rounded-xl border border-border bg-background p-4 space-y-4">
              <div className="flex items-center justify-between gap-3 border-b border-border pb-2">
                <h2 className="text-sm font-semibold text-foreground">Profile</h2>
                {profileSaved && <span className="text-xs text-emerald-600 font-medium">✓ Saved</span>}
              </div>
              <div className="pb-2 flex items-center gap-3">
                <div className="group relative h-16 w-16 shrink-0">
                  {userAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={userAvatar}
                      alt="Profile Avatar"
                      referrerPolicy="no-referrer"
                      onError={() => setUserAvatar("")}
                      className="h-16 w-16 rounded-full object-cover border-2 border-border bg-background shadow-sm"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full border-2 border-border bg-indigo-600 text-white text-xl font-semibold flex items-center justify-center shadow-sm">
                      {initialOf(`${firstName} ${lastName}`.trim() || userEmail)}
                    </div>
                  )}
                  <div className="absolute inset-0 rounded-full overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    <label className="absolute inset-x-0 top-0 h-1/2 flex items-center justify-center bg-amber-700/90 hover:bg-amber-700 text-white text-[9px] font-semibold cursor-pointer">
                      Upload
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/svg+xml,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 2 * 1024 * 1024) {
                            setProfileSaveError("Image file size must be less than 2MB");
                            return;
                          }
                          const reader = new FileReader();
                          reader.onload = () => {
                            if (typeof reader.result === "string") {
                              setUserAvatar(reader.result);
                            }
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setUserAvatar("")}
                      className="absolute inset-x-0 bottom-0 h-1/2 flex items-center justify-center bg-amber-900/90 hover:bg-amber-900 text-white text-[9px] font-semibold"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">First name</label>
                <input type="text" value={firstName} onChange={e=>setFirstName(e.target.value)}
                  className="w-full text-sm rounded-lg border border-border px-3 py-2 outline-none focus:border-indigo-500 bg-background" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Last name</label>
                <input type="text" value={lastName} onChange={e=>setLastName(e.target.value)}
                  className="w-full text-sm rounded-lg border border-border px-3 py-2 outline-none focus:border-indigo-500 bg-background" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Role</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setRoleMenuOpen((o) => !o)}
                    className="w-full flex items-center justify-between text-sm rounded-lg border border-border px-3 py-2 bg-background text-left"
                  >
                    <span className={jobRole ? "text-foreground" : "text-muted"}>{jobRole || "Select a role"}</span>
                    <svg className={`w-3.5 h-3.5 text-muted transition-transform ${roleMenuOpen ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {roleMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setRoleMenuOpen(false)} />
                      <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-background border border-border rounded-xl shadow-xl py-1 px-1 flex flex-col gap-0.5 max-h-64 overflow-y-auto">
                        {ROLE_OPTIONS.map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => { setJobRole(opt); setRoleMenuOpen(false); }}
                            className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                          >
                            <span>{opt}</span>
                            {jobRole === opt && (
                              <svg className="w-3.5 h-3.5 shrink-0 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M20 6L9 17l-5-5" />
                              </svg>
                            )}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Email</label>
                <input type="email" value={userEmail} disabled
                  className="w-full text-sm rounded-lg border border-border px-3 py-2 outline-none bg-background text-muted cursor-not-allowed" />
              </div>

              {/* Theme preference */}
              <div className="pt-2 border-t border-border/60">
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">Appearance</label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { id: "light", label: "Light", icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4" /><path strokeLinecap="round" d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></svg> },
                    { id: "dark", label: "Dark", icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg> },
                    { id: "system", label: "System", icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" /><path strokeLinecap="round" d="M8 21h8m-4-4v4" /></svg> },
                  ] as { id: Theme; label: string; icon: React.ReactNode }[]).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={async () => {
                        setTheme(opt.id);
                        try {
                          await supabase.rpc("update_user_theme", { p_theme: opt.id });
                        } catch { showToast("Theme save failed", "error"); }
                      }}
                      aria-pressed={theme === opt.id}
                      className={`flex flex-col items-center gap-1.5 rounded-lg border px-3 py-3 text-xs font-semibold transition-colors ${
                        theme === opt.id
                          ? "border-indigo-400 bg-indigo-50  text-indigo-700 dark:text-indigo-300"
                          : "border-border bg-background text-muted hover:text-foreground hover:bg-neutral-200/60 dark:hover:bg-neutral-800/60"
                      }`}
                    >
                      {opt.icon}
                      {opt.label}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-muted mt-2">Choose your preferred theme for the whole dashboard. System follows your device setting.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Plan</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground capitalize">{tierLabel(userPlan)}</span>
                  {userPlan === "free" && (
                    <Link
                      href="/upgrade"
                      className="text-xs text-indigo-600 hover:underline font-semibold"
                    >
                      Upgrade
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {profileSaveError && <p className="text-xs text-red-600">{profileSaveError}</p>}
            <div>
              <button type="submit" disabled={profileSaving} className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors min-w-[120px]">
                {profileSaving ? "Saving…" : profileSaved ? "Saved" : "Save profile"}
              </button>
            </div>

            <div className="rounded-xl border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-950/20 p-4 space-y-3">
              <h2 className="text-sm font-semibold text-red-700 dark:text-red-400 border-b border-red-200 dark:border-red-800/40 pb-2">Danger zone</h2>
              <p className="text-xs text-red-600 dark:text-red-400">Permanently delete your BugSnap account and all associated data. This cannot be undone.</p>
              <button type="button"
                onClick={() => { if (confirm("Delete your BugSnap account permanently? This cannot be undone.")) { supabase.auth.signOut().then(() => window.location.assign("/")); }}}
                className="text-xs font-semibold text-red-600 dark:text-red-400 border border-red-300 dark:border-red-800/40 px-3 py-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-950/30 transition-colors">
                Delete Account
              </button>
            </div>
          </form>
        )}

        {/* ── Notifications ─────────────────────────────────────────────── */}
        {activeTab === "notifications" && (
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-background p-4 space-y-1">
              {([
                { key: "comment", label: "When someone comments on your capture" },
                { key: "mention", label: "When you're @mentioned in a comment" },
                { key: "digest", label: "Weekly digest email" },
              ] as { key: keyof typeof notifPrefs; label: string }[]).map((row, i) => (
                <div key={row.key} className={`flex items-center justify-between gap-4 py-3 ${i > 0 ? "border-t border-border" : ""}`}>
                  <span className="text-sm text-foreground">{row.label}</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={notifPrefs[row.key]}
                    disabled={notifSaving}
                    onClick={async () => {
                      const next = { ...notifPrefs, [row.key]: !notifPrefs[row.key] };
                      setNotifPrefs(next);
                      setNotifSaving(true);
                      try {
                        await supabase.rpc("update_user_notification_prefs", { p_prefs: next });
                      } catch { showToast("Preference save failed", "error"); }
                      finally { setNotifSaving(false); }
                    }}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-60 ${notifPrefs[row.key] ? "bg-indigo-600" : "bg-border"}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-background shadow transition-transform ${notifPrefs[row.key] ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        </div>
      </main>

      {/* Drive modal */}
      {connectDriveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <button className="absolute inset-0 bg-black/40" aria-label="Close" onClick={() => !driveActionLoading && setConnectDriveModalOpen(false)} />
          <div className="relative w-full max-w-sm rounded-xl border border-border bg-background p-6 shadow-xl">
            <h2 className="text-lg font-bold text-foreground">{t("settings.connectDriveQ")}</h2>
            <p className="text-sm text-muted mt-2">{t("settings.connectDriveDesc")}</p>
            {driveError && <p className="text-xs text-red-600 mt-3">{driveError}</p>}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
              <button type="button" onClick={() => setConnectDriveModalOpen(false)} disabled={driveActionLoading} className="px-4 py-2 text-sm font-medium text-foreground hover:bg-border/30 rounded-lg disabled:opacity-50">{t("common.cancel")}</button>
              <button type="button" onClick={connectDrive} disabled={driveActionLoading} className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">{driveActionLoading ? t("settings.connecting") : driveStatus === "reconnect_required" ? "Reconnect with Google" : t("settings.continueToGoogle")}</button>
            </div>
          </div>
        </div>
      )}

      {/* Integration Modal (Aksora & SnapTest) */}
      {activeModalInt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <button className="absolute inset-0 bg-black/40 backdrop-blur-xs" aria-label="Close" onClick={() => !intModalSaving && setActiveModalInt(null)} />
          <div className="relative w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="shrink-0 w-8 h-8 rounded-lg border border-border bg-background flex items-center justify-center">
                {INTEGRATIONS.find(i => i.id === activeModalInt)?.icon}
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">
                  {activeModalInt === "aksora" ? "Aksora QA Workspace" : "SnapTest AI QA Suite"}
                </h2>
                <p className="text-xs text-muted">Configure workspace integration credentials</p>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Instance URL
                </label>
                <input
                  type="url"
                  placeholder={activeModalInt === "aksora" ? "https://your-aksora-instance.com" : "http://localhost:3000"}
                  value={intModalForm.url}
                  onChange={(e) => setIntModalForm(prev => ({ ...prev, url: e.target.value }))}
                  className="w-full text-sm rounded-lg border border-border px-3 py-2 outline-none focus:border-indigo-500 bg-background font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  API Key / Token {activeModalInt === "snaptest" && <span className="text-muted font-normal">(Optional)</span>}
                </label>
                <input
                  type="password"
                  placeholder={activeModalInt === "aksora" ? "aksora_..." : "Token (optional)"}
                  value={intModalForm.apiKey}
                  onChange={(e) => setIntModalForm(prev => ({ ...prev, apiKey: e.target.value }))}
                  className="w-full text-sm rounded-lg border border-border px-3 py-2 outline-none focus:border-indigo-500 bg-background font-mono text-xs"
                />
                {activeModalInt === "aksora" && (
                  <p className="text-[11px] text-muted mt-1">
                    Generate an API key with write permissions from Aksora &gt; Settings &gt; API Keys.
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-4 border-t border-border">
              {wsIntegrations[activeModalInt] ? (
                <button
                  type="button"
                  onClick={() => handleDisconnectIntegration(activeModalInt)}
                  disabled={intModalSaving}
                  className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-50"
                >
                  Disconnect
                </button>
              ) : <div />}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveModalInt(null)}
                  disabled={intModalSaving}
                  className="px-3 py-1.5 text-xs font-medium text-foreground hover:bg-border/30 rounded-lg disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveIntegration(activeModalInt)}
                  disabled={intModalSaving}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50"
                >
                  {intModalSaving ? "Saving..." : "Save Credentials"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted">Loading settings…</div>}>
      <SettingsContent />
    </Suspense>
  );
}
