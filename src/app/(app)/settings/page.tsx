"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useT } from "@/components/I18nProvider";
import { useToast } from "@/components/Toast";
import { useTheme, type Theme } from "@/components/ThemeProvider";
import { hasBranding, normalizePlan, seatLimit, tierLabel, type Plan } from "@/lib/tiers";
import { openPaddleCustomerPortal, getEffectivePlan } from "@/lib/paddle";
import { pickAvatar, isRealAvatar, initialOf } from "@/lib/avatar";
import { Dropdown } from "@/components/Dropdown";
import { ShimmerLockBadge } from "@/components/ShimmerLockBadge";
import { INTEGRATIONS } from "@/lib/integrations";
import { type Tab, TAB_TITLES, ROLE_OPTIONS } from "./constants";
import { DeleteAccountModal } from "./DeleteAccountModal";
import { RemoveMemberModal } from "./RemoveMemberModal";
import { RetentionModal } from "./RetentionModal";
import { ConnectDriveModal } from "./ConnectDriveModal";

function SettingsContent() {
  const { t } = useT();
  const { showToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, setTheme } = useTheme();

  const wsParam = searchParams.get("ws") || "";
  const rawTab = searchParams.get("tab") as string | null;
  const activeTab: Tab = rawTab === "webhooks" ? "integrations" : rawTab && ["general","members","billing","integrations","account","notifications"].includes(rawTab) ? (rawTab as Tab) : "general";

  useEffect(() => {
    // no-op: referrer-based navigation handled inline in the button
  }, []);

  // General / Workspace
  const [workspaceName, setWorkspaceName] = useState("My Workspace");
  const [workspaceAvatar, setWorkspaceAvatar] = useState("");
  const [editingWsName, setEditingWsName] = useState(false);
  const [autoDeleteEnabled, setAutoDeleteEnabled] = useState(false);
  const [brandName, setBrandName] = useState("BugSnap");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoPreviewError, setLogoPreviewError] = useState(false);
  const [hideWatermark, setHideWatermark] = useState(false);
  const [customDomain, setCustomDomain] = useState("");
  const [autoDeleteMonths, setAutoDeleteMonths] = useState(3);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState<string | null>(null);
  const [accountDeleting, setAccountDeleting] = useState(false);
  const [deleteAccountModalOpen, setDeleteAccountModalOpen] = useState(false);
  const [userPlan, setUserPlan] = useState<Plan>("free");
  const [trialInfo, setTrialInfo] = useState<{ isTrial: boolean; trialDaysLeft: number }>({ isTrial: false, trialDaysLeft: 0 });
  const [checkoutStatus, setCheckoutStatus] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState<{ comment: boolean; mention: boolean; digest: boolean }>({
    comment: true,
    mention: true,
    digest: true,
  });
  const [notifSavingKey, setNotifSavingKey] = useState<string | null>(null);
  const [notifSyncStatus, setNotifSyncStatus] = useState<"synced" | "saving" | "error">("synced");
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
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<{ user_id: string; email: string; role: string } | null>(null);

  // Integration search & settings
  const [intSearch, setIntSearch] = useState("");
  const [wsIntegrations, setWsIntegrations] = useState<Record<string, Record<string, string> | string>>({});
  const [driveFolderName, setDriveFolderName] = useState("BugSnap Captures");
  const [activeModalInt, setActiveModalInt] = useState<string | null>(null);
  const [intModalForm, setIntModalForm] = useState<Record<string, string>>({});
  const [intModalSaving, setIntModalSaving] = useState(false);

  // Webhook test state
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [webhookTestResult, setWebhookTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

  // BugSnap API Keys state
  const [apiKeys, setApiKeys] = useState<Array<{ id: string; name: string; prefix: string; createdAt: string; lastUsedAt: string | null }>>([]);
  const [apiKeysLoading, setApiKeysLoading] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [creatingKey, setCreatingKey] = useState(false);
  const [revokingKeyId, setRevokingKeyId] = useState<string | null>(null);
  const [revealedBugsnapKey, setRevealedBugsnapKey] = useState<{ rawKey: string; name: string } | null>(null);

  // Churn Prevention Retention Modal state
  const [showRetentionModal, setShowRetentionModal] = useState(false);

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const url = new URL(window.location.href);
    const driveResult = url.searchParams.get("drive");
    if (driveResult === "connected") { setDriveSuccess(t("settings.driveConnectedOk")); }
    else if (driveResult === "scope_denied") { setDriveError(t("settings.driveScopeError")); }
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
        const { data: row } = await supabase.from("users").select("plan, created_at, checkout_status, avatar_url, full_name, job_role, notification_prefs").ilike("email", u.email).maybeSingle();
        if (row?.plan) plan = normalizePlan(row.plan);
        if (row?.checkout_status) setCheckoutStatus(row.checkout_status);
        const effective = getEffectivePlan(plan, row?.created_at);
        setTrialInfo({ isTrial: effective.isTrial, trialDaysLeft: effective.trialDaysLeft });
        if (effective.isTrial && plan === "free") {
          plan = "pro";
        }
        if (isRealAvatar(row?.avatar_url)) setUserAvatar(row.avatar_url);
        if (row?.full_name) {
          const [rfn, ...rrest] = row.full_name.trim().split(/\s+/);
          setFirstName(rfn || "");
          setLastName(rrest.join(" "));
        }
        if (row?.job_role) setJobRole(row.job_role);
        if (row?.notification_prefs && typeof row.notification_prefs === "object") {
          const p = row.notification_prefs as Record<string, unknown>;
          setNotifPrefs({
            comment: typeof p.comment === "boolean" ? p.comment : true,
            mention: typeof p.mention === "boolean" ? p.mention : true,
            digest: typeof p.digest === "boolean" ? p.digest : true,
          });
        }
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
          const loadedWebhook = wsSet.webhook_url || "";
          setWebhookUrl(loadedWebhook);
          setBrandName(wsSet.brand_name || "BugSnap");
          setLogoUrl(wsSet.custom_logo_url || "");
          setHideWatermark(!!wsSet.hide_watermark);
          setCustomDomain(wsSet.custom_domain || "");
          const months = wsSet.auto_delete_months ?? 0;
          setAutoDeleteMonths(months > 0 ? months : 3);
          setAutoDeleteEnabled(months > 0);
          if (wsSet.integrations && typeof wsSet.integrations === "object") {
            const integrationsObj = { ...(wsSet.integrations as Record<string, Record<string, string> | string>) };
            if (loadedWebhook && !integrationsObj.webhook) {
              integrationsObj.webhook = { url: loadedWebhook };
            } else if (integrationsObj.webhook && typeof integrationsObj.webhook === "object") {
              const hookUrl = (integrationsObj.webhook as Record<string, string>).url;
              if (hookUrl) setWebhookUrl(hookUrl);
            }
            setWsIntegrations(integrationsObj);
            if (typeof integrationsObj.drive_folder_name === "string" && integrationsObj.drive_folder_name.trim()) {
              setDriveFolderName(integrationsObj.drive_folder_name.trim());
            }
          } else if (loadedWebhook) {
            setWsIntegrations({ webhook: { url: loadedWebhook } });
          }
        }
      } else {
        const { data: myWs } = await supabase.rpc("get_my_workspaces");
        if (myWs && myWs.length > 0) {
          setWorkspaceName(myWs[0].name || "My Workspace");
          const url = new URL(window.location.href);
          url.searchParams.set("ws", myWs[0].id);
          router.replace(`${url.pathname}${url.search}`, { scroll: false });
        }
      }
    });
  }, [activeWsId, router]);

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
        const { error: wsError } = await supabase.from("workspaces").update({
          name: workspaceName.trim() || undefined,
          avatar_url: workspaceAvatar.trim() || null
        }).eq("id", activeWsId);
        if (wsError) throw wsError;
        window.dispatchEvent(new CustomEvent("bugsnap:workspace-updated", {
          detail: { id: activeWsId, name: workspaceName.trim() || undefined, avatarUrl: workspaceAvatar.trim() || null }
        }));
      }

      const effectiveAutoDelete = autoDeleteEnabled ? autoDeleteMonths : 0;
      const updatedIntegrations = {
        ...(wsIntegrations || {}),
        drive_folder_name: driveFolderName.trim() || "BugSnap Captures",
      };
      const { error } = await supabase.from("workspace_settings").upsert({
        workspace_id: activeWsId,
        webhook_url: webhookUrl.trim(),
        brand_name: canBrand ? brandName.trim() || "BugSnap" : "BugSnap",
        custom_logo_url: canBrand ? logoUrl.trim() : "",
        hide_watermark: canBrand ? hideWatermark : false,
        custom_domain: canBrand ? customDomain.trim() : "",
        auto_delete_months: [0,3,6,12].includes(effectiveAutoDelete) ? effectiveAutoDelete : 0,
        integrations: updatedIntegrations,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      setWsIntegrations(updatedIntegrations);
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

  async function handleWorkspaceIconUpload(file: File) {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast("Image file size must be less than 2MB", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === "string") {
        const dataUrl = reader.result;
        const previousAvatar = workspaceAvatar;
        setWorkspaceAvatar(dataUrl);
        if (activeWsId) {
          try {
            const { error } = await supabase.from("workspaces").update({ avatar_url: dataUrl }).eq("id", activeWsId);
            if (error) throw error;
            window.dispatchEvent(new CustomEvent("bugsnap:workspace-updated", {
              detail: { id: activeWsId, name: workspaceName.trim() || undefined, avatarUrl: dataUrl }
            }));
            showToast("Workspace icon updated", "success");
          } catch (err) {
            setWorkspaceAvatar(previousAvatar);
            showToast(err instanceof Error ? err.message : "Failed to save workspace icon", "error");
          }
        }
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleWorkspaceIconDelete() {
    const previousAvatar = workspaceAvatar;
    setWorkspaceAvatar("");
    if (activeWsId) {
      try {
        const { error } = await supabase.from("workspaces").update({ avatar_url: null }).eq("id", activeWsId);
        if (error) throw error;
        window.dispatchEvent(new CustomEvent("bugsnap:workspace-updated", {
          detail: { id: activeWsId, name: workspaceName.trim() || undefined, avatarUrl: null }
        }));
        showToast("Workspace icon removed", "success");
      } catch (err) {
        setWorkspaceAvatar(previousAvatar);
        showToast(err instanceof Error ? err.message : "Failed to remove workspace icon", "error");
      }
    }
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

      if (result.avatar_url !== undefined) setUserAvatar(result.avatar_url || "");
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

  async function handleDeleteAccount() {
    setAccountDeleting(true);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Session expired");

      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.error || "Failed to delete account");

      showToast("Account deleted successfully", "success");
      await supabase.auth.signOut();
      window.location.assign("/login");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to delete account", "error");
      setAccountDeleting(false);
      setDeleteAccountModalOpen(false);
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

  async function handleUpdateMemberRole(userId: string, newRole: "creator" | "viewer") {
    if (!activeWsId || updatingMemberId) return;
    setUpdatingMemberId(userId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Session expired");

      const res = await fetch("/api/settings/members", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          workspaceId: activeWsId,
          userId,
          role: newRole,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string };
      if (!res.ok) throw new Error(json.error || "Failed to update member role");

      setMembers((prev) => prev.map((m) => (m.user_id === userId ? { ...m, role: newRole } : m)));
      showToast(`Member role updated to ${newRole === "creator" ? "Creator" : "Viewer"}`, "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to update member role", "error");
    } finally {
      setUpdatingMemberId(null);
    }
  }

  async function handleRemoveMember(member: { user_id: string; email: string; role: string }) {
    if (!activeWsId || member.role === "owner" || removingMemberId) return;
    setRemovingMemberId(member.user_id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Session expired");

      const res = await fetch(`/api/settings/members?workspaceId=${encodeURIComponent(activeWsId)}&userId=${encodeURIComponent(member.user_id)}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const json = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string };
      if (!res.ok) throw new Error(json.error || "Failed to remove member");

      setMembers((prev) => prev.filter((m) => m.user_id !== member.user_id));
      setMemberToRemove(null);
      showToast(`${member.email} removed from workspace`, "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to remove member", "error");
    } finally {
      setRemovingMemberId(null);
    }
  }

  async function handleSaveIntegration(id: string) {
    if (!activeWsId) {
      showToast(t("settings.noWs"), "error");
      return;
    }
    setIntModalSaving(true);
    try {
      const sanitizedForm: Record<string, string> = {};
      Object.entries(intModalForm).forEach(([k, v]) => {
        if (typeof v === "string") sanitizedForm[k] = v.trim();
      });

      const updatedIntegrations = {
        ...wsIntegrations,
        [id]: sanitizedForm,
      };

      const payload: Record<string, unknown> = {
        workspace_id: activeWsId,
        integrations: updatedIntegrations,
        updated_at: new Date().toISOString(),
      };

      if (id === "webhook") {
        payload.webhook_url = sanitizedForm.url || "";
        setWebhookUrl(sanitizedForm.url || "");
      }

      const { error } = await supabase.from("workspace_settings").upsert(payload);
      if (error) throw error;
      setWsIntegrations(updatedIntegrations);
      setActiveModalInt(null);
      const intDef = INTEGRATIONS.find(i => i.id === id);
      showToast(`${intDef?.name || "Integration"} saved successfully`, "success");
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

      const payload: Record<string, unknown> = {
        workspace_id: activeWsId,
        integrations: updatedIntegrations,
        updated_at: new Date().toISOString(),
      };

      if (id === "webhook") {
        payload.webhook_url = "";
        setWebhookUrl("");
      }

      const { error } = await supabase.from("workspace_settings").upsert(payload);
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
  const loadBugsnapApiKeys = useCallback(async () => {
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
  }, [activeWsId]);

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
  }, [activeTab, activeWsId, loadBugsnapApiKeys]);

  useEffect(() => {
    if (activeTab !== "notifications") return;
    let isMounted = true;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token || !isMounted) return;
        const res = await fetch("/api/account/notifications", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data?.notification_prefs && isMounted) {
          setNotifPrefs(data.notification_prefs);
          setNotifSyncStatus("synced");
        }
      } catch {
        // Keep existing loaded state if fetch fails
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [activeTab]);

  const handleToggleNotifPref = async (key: "comment" | "mention" | "digest") => {
    const previous = { ...notifPrefs };
    const nextVal = !notifPrefs[key];
    const next = { ...notifPrefs, [key]: nextVal };

    setNotifPrefs(next);
    setNotifSavingKey(key);
    setNotifSyncStatus("saving");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      let saved = false;
      if (token) {
        const res = await fetch("/api/account/notifications", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ [key]: nextVal }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.notification_prefs) {
            setNotifPrefs(json.notification_prefs);
            saved = true;
          }
        }
      }

      if (!saved) {
        const { error: rpcError } = await supabase.rpc("update_user_notification_prefs", {
          p_prefs: { [key]: nextVal },
        });
        if (rpcError) throw rpcError;
      }

      setNotifSyncStatus("synced");
      showToast("Notification preferences updated", "success");
    } catch (err) {
      console.error("Failed to update notification preferences:", err);
      setNotifPrefs(previous);
      setNotifSyncStatus("error");
      showToast("Failed to save notification preference", "error");
    } finally {
      setNotifSavingKey(null);
    }
  };

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
      className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg border-l-2 transition-colors text-left ${
        activeTab === tab
          ? "bg-[#89BD49]/10 dark:bg-[#89BD49]/20 border-[#89BD49] text-[#6B9A35] dark:text-[#A8D666]"
          : "border-transparent text-muted hover:text-foreground hover:bg-border/30"
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
      {/* Sidebar - desktop only */}
      <aside className="hidden lg:flex w-60 shrink-0 border-r border-border bg-subtle flex-col h-full overflow-hidden">
        <div className="px-5 py-5 border-b border-border flex items-center gap-2.5 shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.svg" alt="BugSnap" className="w-7 h-7 shrink-0 object-contain" />
          <div>
            <h1 className="text-sm font-bold tracking-tight text-foreground leading-none">
              BugSnap
            </h1>
            <p className="text-[10px] text-muted mt-1 leading-none font-medium">Workspace Settings</p>
          </div>
        </div>

        <div className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
          <div>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined" && window.history.length > 1) {
                  router.back();
                } else {
                  router.push(wsParam ? `/captures?ws=${wsParam}` : "/captures");
                }
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-muted hover:text-foreground hover:bg-border/30 rounded-lg transition-colors text-left"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back to app
            </button>
          </div>

          <div className="space-y-1">
            <p className="px-3 mb-1 text-[10px] font-bold uppercase tracking-wider text-muted">Workspace</p>
            {navItem("general","General",<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>)}
            {navItem("members","Members",<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>)}
            {navItem("billing","Billing",<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>)}
          </div>

          <div className="space-y-1">
            <p className="px-3 mb-1 text-[10px] font-bold uppercase tracking-wider text-muted">Apps & Tools</p>
            {navItem("integrations","Integrations",<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>)}
          </div>

          <div className="space-y-1">
            <p className="px-3 mb-1 text-[10px] font-bold uppercase tracking-wider text-muted">Account</p>
            {navItem("account","Account",<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>)}
            {navItem("notifications","Notifications",<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>)}
          </div>
        </div>
      </aside>

      {/* Panel */}
      <main className="flex-1 min-w-0 overflow-y-auto w-full bg-background">
        {/* Mobile Settings Header & Horizontal Tab Bar (visible on <lg) */}
        <div className="lg:hidden sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined" && window.history.length > 1) {
                  router.back();
                } else {
                  router.push(wsParam ? `/captures?ws=${wsParam}` : "/captures");
                }
              }}
              className="flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-foreground transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back to app</span>
            </button>
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon.svg" alt="BugSnap" className="w-5 h-5 object-contain" />
              <span className="text-xs font-bold text-foreground">Settings</span>
            </div>
          </div>

          {/* Horizontal scrollable tab pills */}
          <div className="overflow-x-auto no-scrollbar flex items-center gap-1.5 px-3 py-2.5">
            {[
              { id: "general", label: "General" },
              { id: "members", label: "Members" },
              { id: "billing", label: "Billing" },
              { id: "integrations", label: "Integrations" },
              { id: "account", label: "Account" },
              { id: "notifications", label: "Notifications" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id as Tab)}
                className={`shrink-0 px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
                  activeTab === t.id
                    ? "bg-[#89BD49] text-white font-semibold shadow-xs shadow-[#89BD49]/25"
                    : "text-muted hover:text-foreground hover:bg-subtle"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Desktop Sticky Header */}
        <div className="hidden lg:block sticky top-0 z-10 bg-background border-b border-border px-8 lg:px-10 py-7">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t(TAB_TITLES[activeTab].title)}</h1>
          <p className="text-[15px] text-muted mt-2">{t(TAB_TITLES[activeTab].subtitle)}</p>
        </div>

        {/* Mobile Page Title */}
        <div className="lg:hidden px-4 pt-4 pb-1">
          <h1 className="text-xl font-bold text-foreground">{t(TAB_TITLES[activeTab].title)}</h1>
          <p className="text-xs text-muted mt-1">{t(TAB_TITLES[activeTab].subtitle)}</p>
        </div>

        <div className="max-w-5xl mx-auto w-full p-4 sm:p-6 lg:p-10">

        {/* ── General ────────────────────────────── */}
        {activeTab === "general" && (
          <form onSubmit={handleSave} className="space-y-6">

            {/* Workspace Name & Avatar Section */}
            <div className="rounded-xl border border-border bg-subtle p-5 shadow-xs">
              <h2 className="text-sm font-bold text-foreground mb-3">Workspace name</h2>
              <div className="flex items-center gap-4">
                {/* Workspace Avatar with Hover Upload/Delete (like Account profile) */}
                <div className="group relative w-14 h-14 shrink-0 rounded-xl overflow-hidden border-2 border-border bg-subtle shadow-sm">
                  {workspaceAvatar ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={workspaceAvatar}
                      alt={workspaceName}
                      referrerPolicy="no-referrer"
                      onError={() => setWorkspaceAvatar("")}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#89BD49] text-white font-bold text-xl flex items-center justify-center shadow-sm uppercase select-none">
                      {(workspaceName || "W").charAt(0)}
                    </div>
                  )}
                  <div className="absolute inset-0 rounded-xl overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex flex-col">
                    <label className={`w-full flex items-center justify-center bg-blue-600/90 hover:bg-blue-600 text-white text-[10px] font-semibold cursor-pointer transition-colors ${workspaceAvatar ? "h-1/2" : "h-full"}`}>
                      Upload
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/svg+xml,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleWorkspaceIconUpload(file);
                        }}
                      />
                    </label>
                    {workspaceAvatar && (
                      <button
                        type="button"
                        onClick={handleWorkspaceIconDelete}
                        className="w-full h-1/2 flex items-center justify-center bg-blue-950/90 hover:bg-blue-900 text-white text-[10px] font-semibold transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>

                {editingWsName ? (
                  <input
                    autoFocus
                    type="text"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    onBlur={() => setEditingWsName(false)}
                    onKeyDown={(e) => e.key === "Enter" && setEditingWsName(false)}
                    placeholder="My Workspace"
                    className="flex-1 text-sm font-medium rounded-lg border border-border px-3.5 py-2.5 outline-none focus:border-[#89BD49] focus:ring-1 focus:ring-[#89BD49]/20 bg-background text-foreground transition-colors shadow-sm"
                  />
                ) : (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{workspaceName || "My Workspace"}</p>
                    <p className="text-xs text-muted mt-0.5">This is the name of your workspace.</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <label className="text-[11px] font-medium text-[#6B9A35] dark:text-[#A8D666] hover:underline cursor-pointer">
                        Upload icon
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/svg+xml,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleWorkspaceIconUpload(file);
                          }}
                        />
                      </label>
                      {workspaceAvatar && (
                        <>
                          <span className="text-muted text-[11px]">·</span>
                          <button
                            type="button"
                            onClick={handleWorkspaceIconDelete}
                            className="text-[11px] font-medium text-red-600 dark:text-red-400 hover:underline"
                          >
                            Remove icon
                          </button>
                        </>
                      )}
                      <span className="text-muted text-[11px]">· Square image up to 2MB</span>
                    </div>
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

            {/* Data Retention Section */}
            <div className="rounded-xl border border-border bg-subtle p-5 space-y-4 shadow-xs">
              <h2 className="text-sm font-bold text-foreground border-b border-border pb-2.5">
                Data retention
              </h2>

              {/* Auto-delete captures */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">Auto-delete captures</span>
                    <span className="text-[10px] font-semibold text-[#6B9A35] dark:text-[#A8D666] bg-[#89BD49]/10 dark:bg-[#89BD49]/20 border border-[#89BD49]/30 dark:border-[#89BD49]/40 px-1.5 py-0.5 rounded">
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
                      autoDeleteEnabled ? "bg-[#89BD49]" : "bg-border"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
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
            </div>

            {/* Custom Branding (Integrated) */}
            <div className="rounded-xl border border-border bg-subtle p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <h2 className="text-sm font-bold text-foreground">
                  Custom branding
                </h2>
                {!hasBranding(userPlan) ? (
                  <ShimmerLockBadge label="PRO+" onClick={() => router.push("/upgrade")} />
                ) : (
                  <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 px-2 py-0.5 rounded-md">
                    Included
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">Brand Name</label>
                  <input
                    type="text"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="Acme Corp"
                    className="w-full text-sm rounded-lg border border-border px-3 py-2 outline-none focus:border-[#89BD49] focus:ring-1 focus:ring-[#89BD49]/20 bg-background text-foreground shadow-sm"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-muted">Logo URL or Image</label>
                    <div className="flex items-center gap-2">
                      <label className="text-[11px] font-medium text-[#6B9A35] dark:text-[#A8D666] hover:underline cursor-pointer">
                        Upload file
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/svg+xml,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 2 * 1024 * 1024) {
                                showToast("Logo file size must be less than 2MB", "error");
                                return;
                              }
                              const reader = new FileReader();
                              reader.onload = () => {
                                if (typeof reader.result === "string") {
                                  setLogoUrl(reader.result);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                      {logoUrl && (
                        <>
                          <span className="text-muted text-[11px]">·</span>
                          <button
                            type="button"
                            onClick={() => setLogoUrl("")}
                            className="text-[11px] font-medium text-red-600 dark:text-red-400 hover:underline"
                          >
                            Clear
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <input
                    type="text"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="w-full text-sm rounded-lg border border-border px-3 py-2 outline-none focus:border-[#89BD49] focus:ring-1 focus:ring-[#89BD49]/20 bg-background text-foreground shadow-sm"
                  />
                </div>
              </div>

              {/* Live Preview of Header & Watermark on /v/[id] */}
              <div className="rounded-xl border border-border bg-subtle/50 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between text-[11px] font-medium text-muted">
                  <span>Preview on public capture page (<code className="font-mono text-[10px]">/v/[id]</code>)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-background border border-border text-foreground">
                    {hideWatermark ? "Watermark & promo: Hidden" : "Watermark & promo: Visible"}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-background shadow-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {logoUrl.trim() && !logoPreviewError ? (
                      <img
                        src={logoUrl}
                        alt="Logo preview"
                        className="h-7 w-auto max-w-[130px] object-contain"
                        onError={() => setLogoPreviewError(true)}
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <img src="/icon.svg" alt="BugSnap" className="w-6 h-6 shrink-0 object-contain" />
                        <span className="text-sm font-bold tracking-tight text-foreground truncate max-w-[180px]">
                          {brandName.trim() || "BugSnap"}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="text-[11px] text-muted font-medium shrink-0">
                    Header Preview
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hideWatermark}
                  onChange={(e) => {
                    if (!hasBranding(userPlan)) {
                      router.push("/upgrade");
                      return;
                    }
                    setHideWatermark(e.target.checked);
                  }}
                  className="w-4 h-4 rounded border-border text-[#89BD49] focus:ring-[#89BD49]/20"
                />
                <span className="text-xs font-medium text-foreground flex items-center gap-2">
                  <span>Hide &quot;Powered by BugSnap&quot; watermark</span>
                  {!hasBranding(userPlan) && (
                    <ShimmerLockBadge label="PRO+" onClick={() => router.push("/upgrade")} />
                  )}
                </span>
              </label>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-muted">Custom Domain</label>
                  {!hasBranding(userPlan) && (
                    <ShimmerLockBadge label="PRO+" onClick={() => router.push("/upgrade")} />
                  )}
                </div>
                <input
                  type="text"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  placeholder="captures.yourcompany.com"
                  className="w-full text-sm rounded-lg border border-border px-3 py-2 outline-none focus:border-[#89BD49] focus:ring-1 focus:ring-[#89BD49]/20 bg-background text-foreground font-mono shadow-sm"
                />
              </div>
            </div>

            {saveError && <p className="text-xs text-red-600 dark:text-red-400">{saveError}</p>}
            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className={`rounded-xl px-6 py-2.5 text-sm font-semibold transition-all shadow-xs shadow-[#89BD49]/25 active:scale-[0.99] min-w-[145px] flex items-center justify-center gap-2 ${
                  saved
                    ? "bg-emerald-600 text-white"
                    : "bg-[#89BD49] text-white hover:bg-[#6B9A35] disabled:opacity-60"
                }`}
              >
                {saving ? (
                  <>
                    <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Saving…</span>
                  </>
                ) : saved ? (
                  <>
                    <svg className="w-4 h-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Saved</span>
                  </>
                ) : (
                  <span>Save changes</span>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ── Members ────────────────────────────────────────────────────── */}
        {activeTab === "members" && (
          <div className="space-y-7">

            {/* Invite */}
            <div className="rounded-xl border border-border bg-subtle p-6 space-y-5 shadow-sm">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-foreground">Invite member</h2>
                <p className="text-[15px] text-muted mt-3">If they don&apos;t have an account yet, we&apos;ll send them a join link + extension download.</p>
              </div>
              <div className="flex flex-col sm:grid sm:grid-cols-[minmax(0,1fr)_180px_96px] gap-3">
                <input type="email" value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleInvite()}
                  disabled={seatLimit(userPlan) !== null && members.length >= (seatLimit(userPlan) ?? 0)}
                  placeholder="Enter email address"
                  className="h-12 min-w-0 text-[15px] rounded-lg border border-border px-4 outline-none focus:border-[#89BD49] focus:ring-1 focus:ring-[#89BD49]/20 bg-subtle disabled:bg-border/30 disabled:cursor-not-allowed" />
                <div className="relative">
                  <button type="button" onClick={() => setInviteRoleMenuOpen(o => !o)}
                    className="h-12 w-full flex items-center justify-between text-[15px] rounded-lg border border-border px-4 bg-subtle hover:bg-border/30 transition-colors">
                    {inviteRole === "creator" ? "Creator" : "Viewer"}
                    <svg className={`w-4 h-4 text-muted transition-transform ${inviteRoleMenuOpen ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {inviteRoleMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setInviteRoleMenuOpen(false)} />
                      <div className="absolute right-0 mt-1 w-64 rounded-lg border border-border bg-subtle shadow-lg z-50 py-1">
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
                              <svg className="w-4 h-4 text-[#6B9A35] dark:text-[#A8D666] shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                  className="h-12 px-6 rounded-lg bg-[#89BD49] text-white text-[15px] font-semibold hover:bg-[#6B9A35] shadow-xs shadow-[#89BD49]/25 disabled:opacity-50 min-w-[110px] flex items-center justify-center gap-2">
                  {inviting ? (
                    <>
                      <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Sending…</span>
                    </>
                  ) : (
                    <span>Invite</span>
                  )}
                </button>
              </div>
              {inviteMsg && <p className={`text-sm ${inviteMsg.type==="ok" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>{inviteMsg.text}</p>}
            </div>

            {/* Members list */}
            <div className="rounded-xl border border-border bg-subtle overflow-hidden shadow-sm">
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
                  {members.map((m) => {
                    const isOwner = m.role === "owner";
                    const isUpdating = updatingMemberId === m.user_id;
                    const isRemoving = removingMemberId === m.user_id;

                    return (
                      <li key={m.user_id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-[#89BD49]/10 dark:bg-[#89BD49]/20 text-[#6B9A35] dark:text-[#A8D666] border border-[#89BD49]/30 dark:border-[#89BD49]/40 text-sm font-bold flex items-center justify-center shrink-0 shadow-2xs">
                            {(m.email || "?").charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-foreground truncate">{m.email}</p>
                            <p className="text-xs text-muted">
                              {isOwner
                                ? "Full workspace administrator"
                                : m.role === "viewer"
                                ? "Can view captures and participate in discussions"
                                : "Can record, upload, and comment"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                          {isOwner ? (
                            <span className="px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700 select-none">
                              Owner
                            </span>
                          ) : (
                            <div className="flex items-center gap-2">
                              {/* Role Selector */}
                              <div className="relative">
                                <select
                                  value={m.role === "viewer" ? "viewer" : "creator"}
                                  disabled={isUpdating || isRemoving}
                                  onChange={(e) => handleUpdateMemberRole(m.user_id, e.target.value as "creator" | "viewer")}
                                  className="text-xs font-semibold rounded-lg border border-border bg-background px-2.5 py-1.5 outline-none focus:border-[#89BD49] focus:ring-1 focus:ring-[#89BD49]/20 text-foreground cursor-pointer disabled:opacity-50 transition-colors shadow-2xs"
                                >
                                  <option value="creator">Creator</option>
                                  <option value="viewer">Viewer</option>
                                </select>
                              </div>

                              {/* Remove Button */}
                              <button
                                type="button"
                                onClick={() => setMemberToRemove(m)}
                                disabled={isUpdating || isRemoving}
                                className="px-2.5 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors disabled:opacity-50 inline-flex items-center gap-1"
                              >
                                {isRemoving ? (
                                  <>
                                    <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    <span>Removing…</span>
                                  </>
                                ) : (
                                  <span>Remove</span>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* ── Billing ────────────────────────────────────────────────────── */}
        {activeTab === "billing" && (
          <div className="space-y-6">
            {checkoutStatus === "past_due" && (
              <div className="rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm">
                <div>
                  <p className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                    <span>⚠️</span> {t("settings.pastDueWarning")}
                  </p>
                  <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                    {t("settings.pastDueDesc")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openPaddleCustomerPortal()}
                  className="shrink-0 px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs"
                >
                  {t("settings.updatePayment")}
                </button>
              </div>
            )}

            {checkoutStatus === "paused" && (
              <div className="rounded-xl border border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm">
                <div>
                  <p className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                    <span>⏸️</span> {t("settings.pausedNotice")}
                  </p>
                  <p className="text-xs text-blue-800 dark:text-blue-300 mt-0.5">
                    {t("settings.pausedDesc")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openPaddleCustomerPortal()}
                  className="shrink-0 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs"
                >
                  {t("settings.openPortal")}
                </button>
              </div>
            )}

            <div className="rounded-xl border border-border bg-subtle p-6 flex items-center justify-between gap-4 shadow-xs">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-xs text-muted uppercase tracking-widest font-semibold">{t("settings.currentPlan")}</p>
                  {trialInfo.isTrial && (
                    <span className="text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-md">
                      {t("settings.trialDaysLeft", { days: trialInfo.trialDaysLeft })}
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-bold text-foreground capitalize">{tierLabel(userPlan)}</h2>
                <p className="text-sm text-muted mt-1">
                  {seatLimit(userPlan) !== null ? `Up to ${seatLimit(userPlan)} team members` : "Unlimited team members"}
                </p>
              </div>
              {(userPlan === "free" || trialInfo.isTrial) && (
                <Link
                  href="/upgrade"
                  className="shrink-0 px-4 py-2 rounded-lg bg-[#89BD49] text-white text-sm font-semibold hover:bg-[#6B9A35] shadow-xs shadow-[#89BD49]/25 transition-colors inline-block"
                >
                  {t("settings.upgradeToPro")}
                </Link>
              )}
            </div>

            {/* Customer Portal Management */}
            <div className="rounded-xl border border-border bg-subtle p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
              <div>
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  {t("settings.customerPortal")}
                  <span className="text-[10px] uppercase tracking-wider font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 px-2 py-0.5 rounded-md border border-neutral-200 dark:border-neutral-700">
                    Paddle Billing
                  </span>
                </h3>
                <p className="text-xs text-muted mt-1 max-w-xl">
                  {t("settings.customerPortalHint")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => openPaddleCustomerPortal()}
                className="shrink-0 px-4 py-2 rounded-lg border border-border hover:bg-subtle text-foreground text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <span>{t("settings.openPortal")}</span>
                <svg className="w-3.5 h-3.5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </button>
            </div>

            {userPlan !== "free" && !trialInfo.isTrial && (
              <div className="flex items-center justify-end px-1 -mt-2">
                <button
                  type="button"
                  onClick={() => setShowRetentionModal(true)}
                  className="text-xs text-muted hover:text-rose-600 dark:hover:text-rose-400 transition-colors underline underline-offset-4"
                >
                  {t("settings.cancelSub")} / {t("settings.pauseSub")}
                </button>
              </div>
            )}

            <div className="rounded-xl border border-border bg-subtle p-4 space-y-3 shadow-xs">
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
              className="w-full text-sm rounded-lg border border-border px-3 py-2 outline-none focus:border-[#89BD49] focus:ring-1 focus:ring-[#89BD49]/20 bg-subtle text-foreground" />

            {/* Drive */}
            <div className="rounded-xl border border-border bg-subtle p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    Google Drive
                    {!driveLoading && <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${driveStatus === "connected" ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40" : driveStatus === "reconnect_required" ? "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/40" : "text-muted bg-background border-border"}`}>{driveStatus === "connected" ? t("settings.connected") : driveStatus === "reconnect_required" ? t("settings.reconnectRequired") : t("settings.notConnected")}</span>}
                  </h2>
                  <p className="text-xs text-muted mt-0.5">{driveLoading ? "Checking..." : driveStatus === "connected" ? `Dashboard actions using ${driveEmail || "connected account"}` : driveStatus === "reconnect_required" ? "Reconnect Drive for server-side actions." : "Connect for server-side Drive actions."}</p>
                  {!driveLoading && driveStatus === "connected" && driveQuota?.usedBytes != null && driveQuota?.totalBytes != null && driveQuota.totalBytes > 0 && (() => {
                    const pct = Math.max(0, Math.min(100, (driveQuota.usedBytes / driveQuota.totalBytes) * 100));
                    const barColor = pct >= 90 ? "bg-red-500" : pct >= 75 ? "bg-amber-500" : "bg-[#89BD49]";
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
                  <button type="button" onClick={disconnectDrive} disabled={driveActionLoading} className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline disabled:opacity-50">{driveActionLoading ? "Disconnecting…" : "Disconnect"}</button>
                ) : (
                  <button type="button" onClick={() => setConnectDriveModalOpen(true)} disabled={driveLoading || driveActionLoading} className="text-xs font-semibold text-[#6B9A35] dark:text-[#A8D666] hover:underline disabled:opacity-50">{driveStatus === "reconnect_required" ? "Reconnect" : "Connect"}</button>
                )}
              </div>
              {driveSuccess && <p className="text-xs text-emerald-600 dark:text-emerald-400">{driveSuccess}</p>}
              {driveError && <p className="text-xs text-red-600 dark:text-red-400">{driveError}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredIntegrations.map(int => {
                const rawConfig = wsIntegrations[int.id];
                const config = rawConfig && typeof rawConfig === "object" ? (rawConfig as Record<string, string>) : null;
                const isConnected = !!(config && Object.values(config).some(v => typeof v === "string" && v.trim().length > 0));

                return (
                  <div key={int.id} className="rounded-xl border border-border bg-subtle p-4 flex items-start gap-3 hover:border-[#89BD49]/40 transition-colors shadow-xs">
                    <div className="shrink-0 w-10 h-10 rounded-lg border border-border bg-subtle flex items-center justify-center p-2">
                      <img src={int.iconSrc} alt={int.name} className="w-6 h-6 object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{int.name}</p>
                        {isConnected && (
                          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/40 px-1.5 py-0.2 rounded-md">
                            Connected
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted mt-0.5 leading-snug">{int.desc}</p>
                      {isConnected && (config?.repo || config?.channel || config?.project || config?.projectKey || config?.url || config?.webhookUrl) && (
                        <p className="text-[11px] text-muted font-mono truncate mt-1">
                          {config?.repo || config?.channel || config?.project || config?.projectKey || config?.url || config?.webhookUrl}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveModalInt(int.id);
                        setWebhookTestResult(null);
                        const initialForm: Record<string, string> = {};
                        int.fields.forEach(f => {
                          initialForm[f.key] = config?.[f.key] || (f.key === "url" && int.id === "webhook" ? webhookUrl : f.key === "url" && int.id === "gitlab" ? "https://gitlab.com" : f.key === "url" && int.id === "snaptest" ? "http://localhost:3000" : "");
                        });
                        setIntModalForm(initialForm);
                      }}
                      className={`shrink-0 text-xs font-semibold hover:underline mt-0.5 ${isConnected ? "text-muted hover:text-foreground" : "text-[#6B9A35] dark:text-[#A8D666]"}`}
                    >
                      {isConnected ? "Configure" : "Connect"}
                    </button>
                  </div>
                );
              })}
            </div>
            {filteredIntegrations.length === 0 && <p className="text-sm text-muted text-center py-8">No integrations match your search.</p>}

            {/* ── BugSnap Public API Keys ─────────────────────────────────── */}
            <div className="rounded-xl border border-border bg-subtle p-4 space-y-4 pt-5 border-t-2 shadow-xs">
              <div>
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <span>BugSnap API Keys</span>
                  <span className="text-[10px] font-semibold text-[#6B9A35] dark:text-[#A8D666] bg-[#89BD49]/10 dark:bg-[#89BD49]/20 border border-[#89BD49]/30 dark:border-[#89BD49]/40 px-2 py-0.5 rounded-md">
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
                    This key will never be shown again. Copy it now to authenticate requests with <code className="font-mono bg-black/10 dark:bg-black/40 px-1 py-0.5 rounded">Authorization: Bearer bugsnap_...</code>
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

              <form onSubmit={handleCreateBugsnapApiKey} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Key name (e.g. SnapTest AI Integration)"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="flex-1 text-xs rounded-lg border border-border px-3 py-2.5 outline-none focus:border-[#89BD49] focus:ring-1 focus:ring-[#89BD49]/20 bg-background"
                />
                <button
                  type="submit"
                  disabled={creatingKey || !newKeyName.trim()}
                  className="px-4 py-2.5 bg-[#89BD49] hover:bg-[#6B9A35] shadow-xs shadow-[#89BD49]/25 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shrink-0 min-w-[115px] inline-flex items-center justify-center gap-1.5"
                >
                  {creatingKey ? (
                    <>
                      <svg className="w-3.5 h-3.5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Generating…</span>
                    </>
                  ) : (
                    <span>Generate Key</span>
                  )}
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
                          className="text-xs text-red-600 dark:text-red-400 hover:underline disabled:opacity-50 shrink-0"
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

        {/* ── Account ────────────────────────────────────────────────────── */}
        {activeTab === "account" && (
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="rounded-xl border border-border bg-subtle p-4 space-y-4 shadow-xs">
              <div className="flex items-center justify-between gap-3 border-b border-border pb-2">
                <h2 className="text-sm font-semibold text-foreground">Profile</h2>
                {profileSaved && <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">✓ Saved</span>}
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
                      className="h-16 w-16 rounded-full object-cover border-2 border-border bg-subtle shadow-sm"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full border-2 border-border bg-[#89BD49] text-white text-xl font-semibold flex items-center justify-center shadow-sm">
                      {initialOf(`${firstName} ${lastName}`.trim() || userEmail)}
                    </div>
                  )}
                  <div className="absolute inset-0 rounded-full overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex flex-col">
                    <label className={`w-full flex items-center justify-center bg-blue-600/90 hover:bg-blue-600 text-white text-[10px] font-semibold cursor-pointer transition-colors ${userAvatar ? "h-1/2" : "h-full"}`}>
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
                    {userAvatar && (
                      <button
                        type="button"
                        onClick={() => setUserAvatar("")}
                        className="w-full h-1/2 flex items-center justify-center bg-blue-950/90 hover:bg-blue-900 text-white text-[10px] font-semibold transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">First name</label>
                <input type="text" value={firstName} onChange={e=>setFirstName(e.target.value)}
                  className="w-full text-sm rounded-lg border border-border px-3 py-2 outline-none focus:border-[#89BD49] focus:ring-1 focus:ring-[#89BD49]/20 bg-background" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Last name</label>
                <input type="text" value={lastName} onChange={e=>setLastName(e.target.value)}
                  className="w-full text-sm rounded-lg border border-border px-3 py-2 outline-none focus:border-[#89BD49] focus:ring-1 focus:ring-[#89BD49]/20 bg-background" />
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
                              <svg className="w-3.5 h-3.5 shrink-0 text-[#6B9A35] dark:text-[#A8D666]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                          ? "border-[#89BD49] bg-[#89BD49]/10 dark:bg-[#89BD49]/20 text-[#6B9A35] dark:text-[#A8D666] shadow-xs"
                          : "border-border bg-subtle text-muted hover:text-foreground hover:bg-border/30"
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
                      className="text-xs text-[#6B9A35] dark:text-[#A8D666] hover:underline font-semibold"
                    >
                      Upgrade
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {profileSaveError && <p className="text-xs text-red-600 dark:text-red-400">{profileSaveError}</p>}
            <div>
              <button
                type="submit"
                disabled={profileSaving}
                className={`rounded-lg px-5 py-2 text-sm font-semibold transition-all shadow-sm active:scale-[0.99] min-w-[130px] inline-flex items-center justify-center gap-2 ${
                  profileSaved
                    ? "bg-emerald-600 text-white"
                    : "bg-[#89BD49] text-white hover:bg-[#6B9A35] shadow-xs shadow-[#89BD49]/25 disabled:opacity-60"
                }`}
              >
                {profileSaving ? (
                  <>
                    <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Saving…</span>
                  </>
                ) : profileSaved ? (
                  <>
                    <svg className="w-4 h-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Saved</span>
                  </>
                ) : (
                  <span>Save profile</span>
                )}
              </button>
            </div>

            {/* Danger Zone */}
            <div className="rounded-2xl border border-red-200/80 dark:border-red-900/40 bg-subtle overflow-hidden shadow-xs">
              <div className="px-5 py-3.5 border-b border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-950/20 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-red-700 dark:text-red-400 leading-none">Danger Zone</h2>
                    <p className="text-[11px] text-muted mt-0.5">Destructive and irreversible actions</p>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-red-100/80 dark:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/40">
                  Irreversible
                </span>
              </div>

              <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-foreground">Delete Account</h3>
                  <p className="text-xs text-muted leading-relaxed max-w-lg">
                    Permanently delete your personal BugSnap account and remove all personal captures, settings, and profile data. Once deleted, this account cannot be recovered.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteAccountModalOpen(true)}
                  disabled={accountDeleting}
                  className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white shadow-xs transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete Account
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ── Notifications ─────────────────────────────────────────────── */}
        {activeTab === "notifications" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-subtle overflow-hidden shadow-xs">
              {/* Header card with sync status */}
              <div className="p-5 sm:p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-base font-bold text-foreground">Email Notifications</h2>
                    {notifSyncStatus === "saving" && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#89BD49]/10 dark:bg-[#89BD49]/20 text-[#6B9A35] dark:text-[#A8D666] border border-[#89BD49]/30 dark:border-[#89BD49]/40">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#89BD49] animate-pulse" />
                        Saving…
                      </span>
                    )}
                    {notifSyncStatus === "synced" && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                        <svg className="w-3 h-3 text-emerald-600 dark:text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Synced
                      </span>
                    )}
                    {notifSyncStatus === "error" && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50">
                        Sync failed
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted leading-relaxed max-w-xl">
                    Control which email updates are sent to <span className="font-medium text-foreground">{userEmail || "your account email"}</span>. Preferences are automatically synchronized with our notification engine.
                  </p>
                </div>
              </div>

              {/* Preferences list */}
              <div className="divide-y divide-border">
                {([
                  {
                    key: "comment" as const,
                    title: "Comments on your captures",
                    description: "Get an email notification whenever a team member or collaborator leaves a comment on your capture.",
                    icon: (
                      <svg className="w-4 h-4 text-[#6B9A35] dark:text-[#A8D666]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    ),
                  },
                  {
                    key: "mention" as const,
                    title: "Mentions in discussions",
                    description: "Receive an immediate email whenever someone mentions you using @username in any thread or comment.",
                    icon: (
                      <svg className="w-4 h-4 text-[#6B9A35] dark:text-[#A8D666]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    ),
                  },
                  {
                    key: "digest" as const,
                    title: "Weekly activity digest",
                    description: "A weekly summary delivered every Monday showing capture views, new screen recordings, and comments across your workspace.",
                    icon: (
                      <svg className="w-4 h-4 text-[#6B9A35] dark:text-[#A8D666]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    ),
                  },
                ]).map((item) => {
                  const isChecked = !!notifPrefs[item.key];
                  const isUpdating = notifSavingKey === item.key;
                  return (
                    <div
                      key={item.key}
                      className="p-5 sm:p-6 flex items-start sm:items-center justify-between gap-4 hover:bg-border/10 transition-colors"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="w-9 h-9 rounded-xl bg-[#89BD49]/10 dark:bg-[#89BD49]/20 border border-[#89BD49]/30 dark:border-[#89BD49]/40 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                          {item.icon}
                        </div>
                        <div className="space-y-1">
                          <label
                            htmlFor={`notif-${item.key}`}
                            className="text-sm font-semibold text-foreground cursor-pointer select-none"
                          >
                            {item.title}
                          </label>
                          <p className="text-xs text-muted leading-relaxed max-w-xl">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      <button
                        id={`notif-${item.key}`}
                        type="button"
                        role="switch"
                        aria-checked={isChecked}
                        disabled={isUpdating}
                        onClick={() => handleToggleNotifPref(item.key)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#89BD49] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                          isChecked ? "bg-[#89BD49]" : "bg-neutral-300 dark:bg-neutral-700"
                        }`}
                      >
                        <span className="sr-only">{item.title}</span>
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                            isChecked ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Footer info note */}
              <div className="px-5 py-3.5 bg-background border-t border-border flex items-center justify-between text-[11px] text-muted">
                <span className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Transactional notices and security alerts cannot be disabled.
                </span>
                <span className="hidden sm:inline text-[11px] text-muted font-mono">
                  Engine: Active
                </span>
              </div>
            </div>
          </div>
        )}
        </div>
      </main>

      {/* Drive modal */}
      <ConnectDriveModal
        isOpen={connectDriveModalOpen}
        onClose={() => setConnectDriveModalOpen(false)}
        onConnect={connectDrive}
        loading={driveActionLoading}
        driveStatus={driveStatus}
        driveError={driveError}
        t={t}
      />

      {/* Dynamic Integration Modal for all platforms */}
      {activeModalInt && (() => {
        const activeDef = INTEGRATIONS.find(i => i.id === activeModalInt);
        const rawConfig = wsIntegrations[activeModalInt];
        const config = rawConfig && typeof rawConfig === "object" ? (rawConfig as Record<string, string>) : null;
        const isConnected = !!(config && Object.values(config).some(v => typeof v === "string" && v.trim().length > 0));

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
            <button className="absolute inset-0 bg-black/40 backdrop-blur-xs" aria-label="Close" onClick={() => !intModalSaving && setActiveModalInt(null)} />
            <div className="relative w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center gap-3">
                <div className="shrink-0 w-10 h-10 rounded-lg border border-border bg-background flex items-center justify-center p-2">
                  {activeDef?.iconSrc && <img src={activeDef.iconSrc} alt={activeDef.name} className="w-6 h-6 object-contain" />}
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">
                    {activeDef?.name || "Integration"}
                  </h2>
                  <p className="text-xs text-muted">{activeDef?.desc || "Configure workspace credentials"}</p>
                </div>
              </div>

              <div className="space-y-3 pt-1">
                {activeDef?.fields.map((f) => (
                  <div key={f.key}>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      {f.label} {!f.required && <span className="text-muted font-normal">(Optional)</span>}
                    </label>
                    <input
                      type={f.type || "text"}
                      placeholder={f.placeholder}
                      value={intModalForm[f.key] || ""}
                      onChange={(e) => {
                        setIntModalForm(prev => ({ ...prev, [f.key]: e.target.value }));
                        if (activeModalInt === "webhook") setWebhookTestResult(null);
                      }}
                      className="w-full text-sm rounded-lg border border-border px-3 py-2 outline-none focus:border-[#89BD49] focus:ring-1 focus:ring-[#89BD49]/20 bg-background font-mono text-xs text-foreground"
                    />
                    {f.hint && (
                      <p className="text-[11px] text-muted mt-1 leading-normal">
                        {f.hint}
                      </p>
                    )}
                  </div>
                ))}

                {(activeModalInt === "webhook" || activeModalInt === "slack") && (
                  <div className="pt-2 border-t border-border space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted">Test webhook delivery</span>
                      <button
                        type="button"
                        disabled={!(intModalForm.url?.trim() || intModalForm.webhookUrl?.trim()) || testingWebhook}
                        onClick={async () => {
                          setTestingWebhook(true);
                          setWebhookTestResult(null);
                          try {
                            const { data: { session } } = await supabase.auth.getSession();
                            const targetUrl = (intModalForm.url || intModalForm.webhookUrl)?.trim();
                            const res = await fetch("/api/webhooks/test", {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                                ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
                              },
                              body: JSON.stringify({ url: targetUrl }),
                            });
                            const json = await res.json().catch(() => ({}));
                            if (res.ok) {
                              setWebhookTestResult({ ok: true, msg: "Test payload delivered successfully! Check your channel." });
                            } else {
                              setWebhookTestResult({ ok: false, msg: json.error || "Failed to deliver test payload" });
                            }
                          } catch (err) {
                            setWebhookTestResult({ ok: false, msg: err instanceof Error ? err.message : "Network error" });
                          } finally {
                            setTestingWebhook(false);
                          }
                        }}
                        className="rounded-lg border border-border bg-subtle px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-subtle/80 hover:border-accent/40 disabled:opacity-50 transition-all shrink-0"
                      >
                        {testingWebhook ? "Testing…" : "Send Test"}
                      </button>
                    </div>
                    {webhookTestResult && (
                      <div className={`p-2.5 rounded-lg text-xs font-medium border ${webhookTestResult.ok ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40" : "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/40"}`}>
                        {webhookTestResult.ok ? "✓ " : "✕ "}
                        {webhookTestResult.msg}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-3 pt-4 border-t border-border">
                {isConnected ? (
                  <button
                    type="button"
                    onClick={() => handleDisconnectIntegration(activeModalInt)}
                    disabled={intModalSaving}
                    className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline disabled:opacity-50"
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
                    className="px-4 py-1.5 rounded-lg bg-[#89BD49] text-white text-xs font-semibold hover:bg-[#6B9A35] shadow-xs shadow-[#89BD49]/25 disabled:opacity-50 min-w-[130px] inline-flex items-center justify-center gap-1.5"
                  >
                    {intModalSaving ? (
                      <>
                        <svg className="w-3.5 h-3.5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Saving…</span>
                      </>
                    ) : (
                      <span>Save Credentials</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Churn Prevention Downsell Retention Modal (Feature 5) */}
      <RetentionModal
        isOpen={showRetentionModal}
        onClose={() => setShowRetentionModal(false)}
        showToast={showToast}
        t={t}
      />

      {/* Delete Account Confirmation Modal */}
      <DeleteAccountModal
        isOpen={deleteAccountModalOpen}
        onClose={() => setDeleteAccountModalOpen(false)}
        onConfirm={handleDeleteAccount}
        deleting={accountDeleting}
      />

      {/* Remove Member Confirmation Modal */}
      <RemoveMemberModal
        member={memberToRemove}
        onClose={() => setMemberToRemove(null)}
        onConfirm={handleRemoveMember}
        removingMemberId={removingMemberId}
      />
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
