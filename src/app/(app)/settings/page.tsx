"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useT } from "@/components/I18nProvider";
import { useTheme, type Theme } from "@/components/ThemeProvider";
import { hasBranding, normalizePlan, seatLimit, tierLabel, type Plan } from "@/lib/tiers";

// ── Integration catalogue (same order as extension editor.html) ─────────────
const INTEGRATIONS = [
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

type Tab = "general" | "members" | "billing" | "integrations" | "webhooks" | "account";

function SettingsContent() {
  const { t } = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, setTheme } = useTheme();

  const wsParam = searchParams.get("ws") || "";
  const rawTab = searchParams.get("tab") as Tab | null;
  const activeTab: Tab = rawTab && ["general","members","billing","integrations","webhooks","account"].includes(rawTab) ? rawTab : "general";

  useEffect(() => {
    // no-op: referrer-based navigation handled inline in the button
  }, []);

  // General / Drive
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
  const [userName, setUserName] = useState("");
  const activeWsId = searchParams.get("ws");

  // Drive tab
  const [driveConnected, setDriveConnected] = useState(false);
  const [driveEmail, setDriveEmail] = useState<string | null>(null);
  const [driveLoading, setDriveLoading] = useState(true);
  const [driveActionLoading, setDriveActionLoading] = useState(false);
  const [driveError, setDriveError] = useState<string | null>(null);
  const [driveSuccess, setDriveSuccess] = useState<string | null>(null);
  const [connectDriveModalOpen, setConnectDriveModalOpen] = useState(false);

  // Webhook
  const [webhookUrl, setWebhookUrl] = useState("");

  // Members
  const [members, setMembers] = useState<{ user_id: string; email: string; role: string }[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<{type:"ok"|"err"; text:string} | null>(null);

  // Integration search
  const [intSearch, setIntSearch] = useState("");

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
      setUserName(u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split("@")[0] || "");
      let plan: Plan = normalizePlan(u.user_metadata?.plan);
      if (u.email) {
        const { data: row } = await supabase.from("users").select("plan").ilike("email", u.email).maybeSingle();
        if (row?.plan) plan = normalizePlan(row.plan);
      }
      setUserPlan(plan);
      if (activeWsId) {
        const { data: ws } = await supabase.from("workspace_settings").select("*").eq("workspace_id", activeWsId).maybeSingle();
        if (ws) {
          setWebhookUrl(ws.webhook_url || "");
          setBrandName(ws.brand_name || "BugSnap");
          setLogoUrl(ws.custom_logo_url || "");
          setHideWatermark(!!ws.hide_watermark);
          setCustomDomain(ws.custom_domain || "");
          setAutoDeleteMonths(ws.auto_delete_months ?? 3);
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
      .then(r => { if (!c) { setDriveConnected(Boolean(r.connected)); setDriveEmail(r.email || null); } })
      .catch(() => {})
      .finally(() => { if (!c) setDriveLoading(false); });
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
    } catch (e) { setDriveError(e instanceof Error ? e.message : t("settings.connectError")); setDriveActionLoading(false); }
  }

  async function disconnectDrive() {
    if (driveActionLoading) return;
    setDriveActionLoading(true); setDriveError(null);
    try {
      await driveRequest("/api/google-drive/disconnect", { method: "DELETE" });
      setDriveConnected(false); setDriveEmail(null);
    } catch (e) { setDriveError(e instanceof Error ? e.message : t("settings.disconnectError")); }
    finally { setDriveActionLoading(false); }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setSaveError(null); setSaved(false);
    try {
      if (!activeWsId) throw new Error(t("settings.noWs"));
      const canBrand = hasBranding(normalizePlan(userPlan));
      const { error } = await supabase.from("workspace_settings").upsert({
        workspace_id: activeWsId,
        webhook_url: webhookUrl.trim(),
        brand_name: canBrand ? brandName.trim() || "BugSnap" : "BugSnap",
        custom_logo_url: canBrand ? logoUrl.trim() : "",
        hide_watermark: canBrand ? hideWatermark : false,
        custom_domain: canBrand ? customDomain.trim() : "",
        auto_delete_months: [0,3,6,12].includes(autoDeleteMonths) ? autoDeleteMonths : 3,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      setSaved(true); setTimeout(() => setSaved(false), 3000);
      if (autoDeleteMonths !== 0) {
        for (let i = 0; i < 20; i++) {
          const { data, error: e2 } = await supabase.rpc("delete_expired_captures", { p_workspace_id: activeWsId, p_batch_limit: 100 });
          if (e2 || !data || Number(data) <= 0) break;
        }
      }
    } catch (e) { setSaveError(e instanceof Error ? e.message : t("settings.failedSave")); }
    finally { setSaving(false); }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSaveError(null);
    setProfileSaved(false);
    try {
      const fullName = userName.trim();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Session expired");

      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: fullName },
      });
      if (authError) throw authError;

      const response = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fullName }),
      });
      const result = await response.json().catch(() => ({})) as { fullName?: string; error?: string };
      if (!response.ok) throw new Error(result.error || "Failed to save profile");

      setUserName(result.fullName ?? fullName);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (e) {
      setProfileSaveError(e instanceof Error ? e.message : "Failed to save profile");
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
      const { error } = await supabase.rpc("invite_member_by_email", { p_workspace_id: activeWsId, p_email: email });
      if (error) throw error;
      const { data: authData } = await supabase.auth.getSession();
      await fetch("/api/notifications/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(authData.session?.access_token ? { Authorization: `Bearer ${authData.session.access_token}` } : {}) },
        body: JSON.stringify({ email, workspaceId: activeWsId }),
      }).catch(() => null);
      setInviteEmail("");
      setInviteMsg({ type:"ok", text: `Invite sent to ${email}` });
      const { data: fresh } = await supabase.rpc("get_workspace_members", { p_workspace_id: activeWsId });
      setMembers((fresh as typeof members) ?? []);
    } catch (e) { setInviteMsg({ type:"err", text: (e as {message?:string})?.message || t("members.inviteFailed") }); }
    finally { setInviting(false); }
  }

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
        activeTab === tab ? "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 font-semibold" : "text-muted hover:bg-subtle hover:text-foreground"
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
    <div className="flex min-h-full">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-border bg-subtle px-3 py-5 flex flex-col gap-5">
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

        <div className="border-t border-border pt-3">
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined" && window.history.length > 1) {
                router.back();
              } else {
                router.push(wsParam ? `/captures?ws=${wsParam}` : "/captures");
              }
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-muted hover:text-foreground hover:bg-subtle rounded-lg transition-colors text-left font-medium"
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
        </div>
      </aside>

      {/* Panel */}
      <main className="flex-1 min-w-0 overflow-y-auto p-6 lg:p-8 w-full">

        {/* ── General ────────────────────────────────────────────────────── */}
        {activeTab === "general" && (
          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <h1 className="text-xl font-bold text-foreground">General</h1>
              <p className="text-sm text-muted mt-0.5">Workspace settings and data management.</p>
            </div>

            {/* Drive */}
            <div className="rounded-xl border border-border bg-subtle p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    Google Drive
                    {!driveLoading && <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${driveConnected ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40" : "text-muted bg-subtle border-border"}`}>{driveConnected ? "Connected" : "Not connected"}</span>}
                  </h2>
                  <p className="text-xs text-muted mt-0.5">{driveLoading ? "Checking..." : driveConnected ? `Dashboard actions using ${driveEmail || "connected account"}` : "Connect for server-side Drive actions."}</p>
                  <p className="text-[11px] text-muted">Extension connection is managed separately.</p>
                </div>
                {driveConnected ? (
                  <button type="button" onClick={disconnectDrive} disabled={driveActionLoading} className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-50">{driveActionLoading ? "Disconnecting…" : "Disconnect"}</button>
                ) : (
                  <button type="button" onClick={() => setConnectDriveModalOpen(true)} disabled={driveLoading || driveActionLoading} className="text-xs font-semibold text-indigo-600 hover:underline disabled:opacity-50">Connect</button>
                )}
              </div>
              {driveSuccess && <p className="text-xs text-emerald-600">{driveSuccess}</p>}
              {driveError && <p className="text-xs text-red-600">{driveError}</p>}
            </div>

            {/* Retention */}
            <div className="rounded-xl border border-border bg-subtle p-4 space-y-3">
              <h2 className="text-sm font-semibold text-foreground border-b border-border pb-2">Data Retention</h2>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <label className="text-sm text-foreground shrink-0">Delete captures older than</label>
                <select value={autoDeleteMonths} onChange={e => setAutoDeleteMonths(Number(e.target.value))}
                  className="w-full sm:w-40 text-sm rounded-lg border border-border px-3 py-2 outline-none focus:border-indigo-500 bg-subtle">
                  {[0,3,6,12].map(m => <option key={m} value={m}>{m === 0 ? "Never" : `${m} months`}</option>)}
                </select>
              </div>
              <p className="text-[11px] text-muted">Applies to future captures only. Existing captures are preserved.</p>
            </div>

            {/* Branding */}
            <div className={`rounded-xl border border-border bg-subtle p-4 space-y-3 ${userPlan === "free" ? "opacity-60" : ""}`}>
              <div className="flex items-center justify-between border-b border-border pb-2">
                <h2 className="text-sm font-semibold text-foreground">Custom Branding</h2>
                <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-800/40 px-2 py-0.5 rounded-full">{userPlan === "free" ? "Pro Only" : tierLabel(userPlan)}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Brand Name</label>
                  <input type="text" value={brandName} disabled={userPlan==="free"} onChange={e=>setBrandName(e.target.value)} placeholder={userPlan==="free" ? "Upgrade to Pro" : "Acme Corp"} className="w-full text-sm rounded-lg border border-border px-3 py-2 outline-none focus:border-indigo-500 bg-subtle disabled:bg-subtle disabled:cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Logo URL</label>
                  <input type="url" value={logoUrl} disabled={userPlan==="free"} onChange={e=>setLogoUrl(e.target.value)} placeholder={userPlan==="free" ? "Upgrade to Pro" : "https://logo.png"} className="w-full text-sm rounded-lg border border-border px-3 py-2 outline-none focus:border-indigo-500 bg-subtle disabled:bg-subtle disabled:cursor-not-allowed" />
                </div>
              </div>
              <label className={`flex items-center gap-3 ${userPlan==="free" ? "cursor-not-allowed" : "cursor-pointer"}`}>
                <input type="checkbox" checked={hideWatermark} disabled={userPlan==="free"} onChange={e=>setHideWatermark(e.target.checked)} className="w-4 h-4 rounded border-border text-indigo-600 focus:ring-indigo-500 disabled:opacity-50" />
                <span className="text-xs font-medium text-foreground">Hide &quot;Powered by BugSnap&quot; watermark</span>
              </label>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Custom Domain</label>
                <input type="text" value={customDomain} disabled={userPlan==="free"} onChange={e=>setCustomDomain(e.target.value)} placeholder={userPlan==="free" ? "Upgrade to Pro" : "captures.yourcompany.com"} className="w-full text-sm rounded-lg border border-border px-3 py-2 outline-none focus:border-indigo-500 bg-subtle font-mono disabled:bg-subtle disabled:cursor-not-allowed" />
              </div>
            </div>

            {saveError && <p className="text-xs text-red-600">{saveError}</p>}
            <div className="flex items-center gap-3">
              <button type="submit" disabled={saving} className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors">
                {saving ? "Saving…" : "Save changes"}
              </button>
              {saved && <span className="text-xs text-emerald-600 font-medium">✓ Saved</span>}
            </div>
          </form>
        )}

        {/* ── Members ────────────────────────────────────────────────────── */}
        {activeTab === "members" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-xl font-bold text-foreground">Members</h1>
              <p className="text-sm text-muted mt-0.5">Manage who has access to your workspace captures.</p>
            </div>

            {/* Invite */}
            <div className="rounded-xl border border-border bg-subtle p-4 space-y-3">
              <h2 className="text-sm font-semibold text-foreground">Invite member</h2>
              <p className="text-xs text-muted">If they don&apos;t have an account yet, we&apos;ll send them a join link + extension download.</p>
              <div className="flex gap-2">
                <input type="email" value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleInvite()}
                  disabled={seatLimit(userPlan) !== null && members.length >= (seatLimit(userPlan) ?? 0)}
                  placeholder="teammate@company.com"
                  className="flex-1 text-sm rounded-lg border border-border px-3 py-2 outline-none focus:border-indigo-500 bg-subtle disabled:bg-subtle disabled:cursor-not-allowed" />
                <button type="button" onClick={handleInvite} disabled={inviting || !inviteEmail.trim()}
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">
                  {inviting ? "Sending…" : "Invite"}
                </button>
              </div>
              {inviteMsg && <p className={`text-xs ${inviteMsg.type==="ok" ? "text-emerald-600" : "text-red-600"}`}>{inviteMsg.text}</p>}
            </div>

            {/* Members list */}
            <div className="rounded-xl border border-border bg-subtle overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-subtle/40 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">{membersLoading ? "Loading…" : `${members.length} member${members.length !== 1 ? "s" : ""}`}</h2>
              </div>
              {membersLoading ? (
                <div className="divide-y divide-border/60 animate-pulse">
                  {[0,1,2].map(i => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3">
                      <div className="w-8 h-8 rounded-full bg-subtle" />
                      <div className="flex-1 space-y-1.5"><div className="h-3 w-1/3 bg-subtle rounded" /><div className="h-2.5 w-1/4 bg-subtle rounded" /></div>
                    </div>
                  ))}
                </div>
              ) : members.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted">No members yet. Invite someone above.</div>
              ) : (
                <ul className="divide-y divide-border/60">
                  {members.map(m => (
                    <li key={m.user_id} className="flex items-center gap-3 px-4 py-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center justify-center shrink-0">
                        {(m.email || "?").charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{m.email}</p>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${m.role==="owner" ? "bg-subtle text-muted" : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400"}`}>{m.role}</span>
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
            <div>
              <h1 className="text-xl font-bold text-foreground">Billing</h1>
              <p className="text-sm text-muted mt-0.5">Your current plan and usage.</p>
            </div>
            <div className="rounded-xl border border-border bg-subtle p-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-muted uppercase tracking-widest font-semibold mb-1">Current plan</p>
                <h2 className="text-2xl font-bold text-foreground capitalize">{tierLabel(userPlan)}</h2>
                <p className="text-sm text-muted mt-1">
                  {seatLimit(userPlan) !== null ? `Up to ${seatLimit(userPlan)} team members` : "Unlimited team members"}
                </p>
              </div>
              {userPlan === "free" && (
                <Link href="/pricing" className="shrink-0 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors">
                  Upgrade
                </Link>
              )}
            </div>

            <div className="rounded-xl border border-border bg-subtle p-4 space-y-3">
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
            <div>
              <h1 className="text-xl font-bold text-foreground">Integrations</h1>
              <p className="text-sm text-muted mt-0.5">Connect your bug captures to your favourite tools.</p>
            </div>
            <input type="text" placeholder="Search integrations…" value={intSearch} onChange={e=>setIntSearch(e.target.value)}
              className="w-full text-sm rounded-lg border border-border px-3 py-2 outline-none focus:border-indigo-500 bg-subtle" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredIntegrations.map(int => (
                <div key={int.id} className="rounded-xl border border-border bg-subtle p-4 flex items-start gap-3 hover:border-indigo-200 transition-colors">
                  <div className="shrink-0 w-10 h-10 rounded-lg border border-border bg-subtle flex items-center justify-center">
                    {int.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{int.name}</p>
                    <p className="text-xs text-muted mt-0.5 leading-snug">{int.desc}</p>
                  </div>
                  <button type="button"
                    onClick={() => alert(`${int.name} integration coming soon!`)}
                    className="shrink-0 text-xs font-semibold text-indigo-600 hover:underline mt-0.5">
                    Connect
                  </button>
                </div>
              ))}
            </div>
            {filteredIntegrations.length === 0 && <p className="text-sm text-muted text-center py-8">No integrations match your search.</p>}
          </div>
        )}

        {/* ── Webhooks ───────────────────────────────────────────────────── */}
        {activeTab === "webhooks" && (
          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <h1 className="text-xl font-bold text-foreground">Webhooks</h1>
              <p className="text-sm text-muted mt-0.5">Receive notifications when new captures are saved.</p>
            </div>
            <div className="rounded-xl border border-border bg-subtle p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <h2 className="text-sm font-semibold text-foreground">Slack / Discord / Zapier</h2>
                {webhookUrl.trim() ? (
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/40 px-2 py-0.5 rounded-full">Active</span>
                ) : (
                  <span className="text-[10px] font-semibold text-muted bg-subtle border border-border px-2 py-0.5 rounded-full">Not configured</span>
                )}
              </div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Webhook URL</label>
              <input type="url" value={webhookUrl} onChange={e=>setWebhookUrl(e.target.value)}
                placeholder="https://hooks.slack.com/services/..."
                className="w-full text-sm rounded-lg border border-border px-3 py-2 outline-none focus:border-indigo-500 bg-subtle font-mono" />
              <p className="text-[11px] text-muted">We POST a JSON payload with capture URL, thumbnail, and metadata when a new bug is saved.</p>
            </div>
            {saveError && <p className="text-xs text-red-600">{saveError}</p>}
            <div className="flex items-center gap-3">
              <button type="submit" disabled={saving} className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors">{saving ? "Saving…" : "Save"}</button>
              {saved && <span className="text-xs text-emerald-600 font-medium">✓ Saved</span>}
            </div>
          </form>
        )}

        {/* ── Account ────────────────────────────────────────────────────── */}
        {activeTab === "account" && (
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div>
              <h1 className="text-xl font-bold text-foreground">Account</h1>
              <p className="text-sm text-muted mt-0.5">Your personal profile information.</p>
            </div>
            <div className="rounded-xl border border-border bg-subtle p-4 space-y-4">
              <div className="flex items-center justify-between gap-3 border-b border-border pb-2">
                <h2 className="text-sm font-semibold text-foreground">Profile</h2>
                {profileSaved && <span className="text-xs text-emerald-600 font-medium">✓ Saved</span>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Full Name</label>
                  <input type="text" value={userName} onChange={e=>setUserName(e.target.value)}
                    className="w-full text-sm rounded-lg border border-border px-3 py-2 outline-none focus:border-indigo-500 bg-subtle" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Email</label>
                  <input type="email" value={userEmail} disabled
                    className="w-full text-sm rounded-lg border border-border px-3 py-2 outline-none bg-subtle text-muted cursor-not-allowed" />
                </div>
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
                        } catch {}
                      }}
                      aria-pressed={theme === opt.id}
                      className={`flex flex-col items-center gap-1.5 rounded-lg border px-3 py-3 text-xs font-semibold transition-colors ${
                        theme === opt.id
                          ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300"
                          : "border-border bg-subtle text-muted hover:text-foreground hover:bg-neutral-200/60 dark:hover:bg-neutral-800/60"
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
                  {userPlan === "free" && <Link href="/pricing" className="text-xs text-indigo-600 hover:underline font-semibold">Upgrade</Link>}
                </div>
              </div>
            </div>

            {profileSaveError && <p className="text-xs text-red-600">{profileSaveError}</p>}
            <div className="flex items-center gap-3">
              <button type="submit" disabled={profileSaving} className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors">
                {profileSaving ? "Saving…" : "Save profile"}
              </button>
              {profileSaved && <span className="text-xs text-emerald-600 font-medium">✓ Saved</span>}
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
      </main>

      {/* Drive modal */}
      {connectDriveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <button className="absolute inset-0 bg-black/40" aria-label="Close" onClick={() => !driveActionLoading && setConnectDriveModalOpen(false)} />
          <div className="relative w-full max-w-sm rounded-xl border border-border bg-subtle p-6 shadow-xl">
            <h2 className="text-lg font-bold text-foreground">{t("settings.connectDriveQ")}</h2>
            <p className="text-sm text-muted mt-2">{t("settings.connectDriveDesc")}</p>
            {driveError && <p className="text-xs text-red-600 mt-3">{driveError}</p>}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
              <button type="button" onClick={() => setConnectDriveModalOpen(false)} disabled={driveActionLoading} className="px-4 py-2 text-sm font-medium text-foreground hover:bg-subtle rounded-lg disabled:opacity-50">{t("common.cancel")}</button>
              <button type="button" onClick={connectDrive} disabled={driveActionLoading} className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">{driveActionLoading ? t("settings.connecting") : t("settings.continueToGoogle")}</button>
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
