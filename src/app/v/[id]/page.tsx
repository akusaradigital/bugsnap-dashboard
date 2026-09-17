"use client";

import dynamic from "next/dynamic";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { type CapturedLogs } from "@/components/DevToolsPanel";
import { isIgnoredUrl } from "@/lib/ignored-urls";
import Comments from "@/components/Comments";
import MediaViewer, { ErrorMarker } from "@/components/MediaViewer";
import CaptureFooter from "@/components/CaptureFooter";
import { useT } from "@/components/I18nProvider";
import { useToast } from "@/components/Toast";
import { Dropdown } from "@/components/Dropdown";

const DevToolsPanel = dynamic(() => import("@/components/DevToolsPanel"), {
  ssr: false,
  loading: () => <div className="w-full lg:w-[360px] border-t lg:border-t-0 lg:border-l border-border bg-subtle animate-pulse h-[450px] lg:h-auto" />
});

interface Capture {
  id: string;
  title: string;
  type: string;
  drive_url: string | null;
  created_at: string;
  window_size?: string | null;
  description?: string | null;
  dev_logs?: CapturedLogs;
  os?: string | null;
  browser?: string | null;
  site_url?: string | null;
  workspace_id?: string | null;
  folder_name?: string | null;
  tag?: string | null;
  status?: string | null;
  allowed_domains?: string[] | null;
  allowed_ips?: string[] | null;
  burn_after_read?: boolean;
  expires_at?: string | null;
  project_id?: string | null;
  project_name?: string | null;
  source?: string | null;
  access_mode?: "public" | "members" | null;
  duration?: number | null;
}

const TAG_OPTIONS = ["bug", "feature-request", "wip", "design", "other"];
const STATUS_OPTIONS = ["open", "in-progress", "fixed", "closed"];

const INTEGRATION_METADATA: Record<string, { name: string; iconSrc: string }> = {
  slack: { name: "Slack", iconSrc: "/integrations/slack.png" },
  github: { name: "GitHub", iconSrc: "/integrations/github.png" },
  linear: { name: "Linear", iconSrc: "/integrations/linear.png" },
  jira: { name: "Jira", iconSrc: "/integrations/jira.png" },
  gitlab: { name: "GitLab", iconSrc: "/integrations/gitlab.png" },
  notion: { name: "Notion", iconSrc: "/integrations/notion.png" },
  clickup: { name: "ClickUp", iconSrc: "/integrations/clickup.png" },
  asana: { name: "Asana", iconSrc: "/integrations/asana.png" },
  azure: { name: "Azure DevOps", iconSrc: "/integrations/azure.png" },
  aksora: { name: "Aksora", iconSrc: "/integrations/aksora.png" },
  snaptest: { name: "SnapTest", iconSrc: "/integrations/snaptest.png" },
  claude: { name: "Claude AI", iconSrc: "/integrations/claude.png" },
  chatgpt: { name: "ChatGPT", iconSrc: "/integrations/chatgpt.png" },
  webhook: { name: "Webhook", iconSrc: "/integrations/webhook.svg" },
};

const viewCountCache = new Map<string, { value: number; expiresAt: number }>();

function hostnameOf(url: string | null | undefined): string {
  try {
    return new URL(url || "").hostname;
  } catch {
    return url || "-";
  }
}

function WebsiteFavicon({ url, className }: { url?: string | null; className?: string }) {
  const [srcIndex, setSrcIndex] = useState(0);
  const [failed, setFailed] = useState(false);

  const sources = useMemo(() => {
    if (!url) return [];
    try {
      const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
      const origin = parsed.origin;
      const host = parsed.hostname;
      return [
        // 1. Direct origin favicon (works for authenticated/intranet/staging tabs)
        `${origin}/favicon.ico`,
        // 2. Google Favicon Service
        `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=32`,
        // 3. DuckDuckGo Favicon Service
        `https://icons.duckduckgo.com/ip3/${encodeURIComponent(host)}.ico`,
      ];
    } catch {
      return [];
    }
  }, [url]);

  useEffect(() => {
    setSrcIndex(0);
    setFailed(false);
  }, [url]);

  if (!url || failed || sources.length === 0 || srcIndex >= sources.length) {
    return (
      <img src="/icons/globe.svg" alt="" className={className || "h-3.5 w-3.5 shrink-0"} />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={sources[srcIndex]}
      alt=""
      loading="lazy"
      className={className || "h-3.5 w-3.5 rounded-sm object-contain shrink-0"}
      onError={() => {
        if (srcIndex + 1 < sources.length) {
          setSrcIndex((prev) => prev + 1);
        } else {
          setFailed(true);
        }
      }}
    />
  );
}

function getExpiryCountdown(expiresAt: string, t: (k: string, vars?: Record<string, string | number>) => string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return t("v.expired");
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 24) {
    if (hours < 2) return t("v.expiresUnder1h");
    return t("v.expiresInHours", { n: hours });
  }
  const days = Math.ceil(hours / 24);
  return t("v.expiresInDays", { n: days });
}

const DEMO_CAPTURE: Capture = {
  id: "demo",
  title: "TokoOnline - Checkout Payment Deadlock (500 Error)",
  type: "screenshot",
  drive_url: "https://images.unsplash.com/photo-1557821552-17105176677c?w=1600&q=80",
  created_at: new Date().toISOString(),
  window_size: "1440x900",
  os: "macOS 15.0 (Sequoia)",
  browser: "Chrome 128.0.0.0",
  site_url: "https://tokoonline.id/checkout/payment?ref=tokopedia_promo",
  status: "open",
  tag: "bug",
  access_mode: "public",
  dev_logs: [
    {
      type: "step",
      message: "Typed 'DISKON50' into promo code input",
      time: "0:02",
      timestamp: 1725978719000,
    },
    {
      type: "step",
      message: "Clicked option: BCA Virtual Account",
      time: "0:04",
      timestamp: 1725978721000,
    },
    {
      type: "step",
      message: "Clicked button: Bayar Sekarang (Rp 450.000)",
      time: "0:07",
      timestamp: 1725978724000,
    },
    {
      type: "network",
      method: "POST",
      url: "https://api.tokoonline.id/v1/checkout/pay",
      status: 500,
      statusText: "Internal Server Error",
      duration: 420,
      time: "0:08",
      timestamp: 1725978725000,
      requestBody: JSON.stringify({
        cartId: "cart_88321",
        paymentMethod: "BCA_VA",
        voucherCode: "DISKON50",
        amount: {
          subtotal: 450000,
          discount: 50000,
          shipping: 15000,
          grandTotal: 415000,
        },
        customer: {
          id: "usr_99812",
          phone: "+6281234567890",
        },
      }),
      responseBody: JSON.stringify({
        status: "error",
        code: "GATEWAY_TIMEOUT",
        message: "Transaction deadlock: Payment provider gateway responded with HTTP 500",
        intentId: "pi_992144",
        timestamp: "2026-09-10T14:32:05.142Z",
      }),
    },
    {
      type: "network",
      method: "GET",
      url: "https://api.tokoonline.id/v1/cart",
      status: 200,
      statusText: "OK",
      duration: 85,
      time: "0:01",
      timestamp: 1725978718000,
      responseBody: JSON.stringify({
        cartId: "cart_88321",
        itemCount: 2,
        currency: "IDR",
        items: [
          { id: "prod_101", name: "Wireless Mechanical Keyboard", price: 350000 },
          { id: "prod_402", name: "Desk Mat Extra Large", price: 100000 },
        ],
      }),
    },
    {
      type: "console",
      level: "error",
      message: "Uncaught PaymentGatewayError: Failed to finalize payment intent pi_992144 (500 Internal Server Error)",
      stack: "PaymentGatewayError: Failed to finalize payment intent pi_992144\n    at Object.chargeCard (https://tokoonline.id/assets/payment.js:142:19)\n    at async HTMLButtonElement.onPayClick (https://tokoonline.id/assets/checkout.js:88:9)",
      time: "0:08",
      timestamp: 1725978725142,
    },
    {
      type: "console",
      level: "warn",
      message: "Meta Pixel: Beacon request to connect.facebook.net/en_US/fbevents.js timed out after 3000ms",
      time: "0:07",
      timestamp: 1725978724210,
    },
    {
      type: "console",
      level: "info",
      message: "[Checkout] Loaded checkout flow with 2 items. Total: Rp 450.000",
      time: "0:01",
      timestamp: 1725978718005,
    },
    {
      type: "storage",
      time: "0:08",
      timestamp: 1725978725200,
      storage: {
        localStorage: {
          user_session: JSON.stringify({
            userId: "usr_99812",
            name: "Budi Pratama",
            email: "budi.pratama@gmail.com",
            loyaltyTier: "Gold",
          }),
          auth_token: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.***REDACTED***",
          cart_items: JSON.stringify([
            { id: "prod_101", title: "Wireless Mechanical Keyboard", qty: 1, price: 350000 },
            { id: "prod_402", title: "Desk Mat Extra Large", qty: 1, price: 100000 },
          ]),
          preferred_payment: "BCA_VA",
        },
        sessionStorage: {
          checkout_step: "step_3_payment",
          applied_voucher: "DISKON50",
        },
      },
    },
    {
      type: "device_specs",
      time: "0:01",
      timestamp: 1725978718000,
      specs: {
        deviceMemory: 16,
        hardwareConcurrency: 10,
        connectionType: "4g",
        screenResolution: "1440x900",
        pixelRatio: 2,
      },
    },
  ],
};

function SingleViewContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id;
  const { t } = useT();
  const { showToast } = useToast();

  const hideDevTools = searchParams.get("devtools") === "false" || searchParams.get("embed") === "true";

  const [capture, setCapture] = useState<Capture | null>(null);
  const [status, setStatus] = useState<"loading" | "locked" | "expired" | "notfound" | "unauthorized_ip" | "needs_login" | "unauthorized_domain" | "ready">("loading");
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [checkingPassword, setCheckingPassword] = useState(false);
  const [viewCount, setViewCount] = useState<number | null>(null);
  const recordedViewRef = useRef<string | null>(null);

  // Modals & Popovers
  const [moveSubmenuOpen, setMoveSubmenuOpen] = useState(false);
  const moveMenuRef = useRef<HTMLDivElement>(null);
  const [capFolders, setCapFolders] = useState<string[]>([]);
  const [movingCapture, setMovingCapture] = useState(false);
  const [newFolderMode, setNewFolderMode] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [copied, setCopied] = useState(false);
  const [shareType, setShareType] = useState<"devtools" | "content">("devtools");
  const [accessMode, setAccessMode] = useState<"public" | "members">("public");
  const [accessSaving, setAccessSaving] = useState(false);
  const [accessOpen, setAccessOpen] = useState(false);
  const accessMenuRef = useRef<HTMLDivElement>(null);
  const [deleteCaptureModalOpen, setDeleteCaptureModalOpen] = useState(false);
  const [deleteMode, setDeleteMode] = useState<"drive_trash" | "app_only">("drive_trash");
  const [deletingCapture, setDeletingCapture] = useState(false);
  const [deleteCaptureError, setDeleteCaptureError] = useState<string | null>(null);
  const [driveIssue, setDriveIssue] = useState<"not_connected" | "reconnect_required" | null>(null);
  const [deleteOperationId, setDeleteOperationId] = useState<string | null>(null);

  // Edit / Delete for internal workspace members
  const [isTeamMember, setIsTeamMember] = useState(false);
  const [isWorkspaceOwner, setIsWorkspaceOwner] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editTag, setEditTag] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editAllowedDomains, setEditAllowedDomains] = useState("");
  const [editAllowedIps, setEditAllowedIps] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Integrations state
  const [configuredIntegrations, setConfiguredIntegrations] = useState<Array<{ id: string; name: string; iconSrc: string }>>([]);
  const [sendingIntegration, setSendingIntegration] = useState<string | null>(null);
  const [sentIntegrations, setSentIntegrations] = useState<Record<string, boolean>>({});
  const [integrationMenuOpen, setIntegrationMenuOpen] = useState(false);
  const integrationMenuRef = useRef<HTMLDivElement>(null);

  const [viewerEmail, setViewerEmail] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [brand, setBrand] = useState({ name: "BugSnap", logo: "", hideWatermark: false });
  const [brandLogoFailed, setBrandLogoFailed] = useState(false);

  // Timeline Sync between Video Playback and DevToolsPanel
  const [playbackTime, setPlaybackTime] = useState<number>(0);
  const [seekTargetTime, setSeekTargetTime] = useState<number | null>(null);
  const handlePlaybackTimeUpdate = useCallback((t: number) => {
    setPlaybackTime(t);
  }, []);

  const errorMarkers = useMemo<ErrorMarker[]>(() => {
    if (!capture || capture.type !== "video" || !capture.dev_logs) return [];

    let rawLogs: Array<{ type?: string; level?: string; message?: string; status?: number; time?: string | number; timestamp?: string | number; url?: string; method?: string }> = [];
    if (Array.isArray(capture.dev_logs)) {
      rawLogs = capture.dev_logs;
    }

    const earliest = rawLogs.reduce<number>((min, log) => {
      const raw = log.timestamp;
      const ts = typeof raw === "number" ? raw : typeof raw === "string" && !/^\d{1,2}:\d{2}$/.test(raw) ? new Date(raw).getTime() : 0;
      return Number.isFinite(ts) && ts > 0 && (min === 0 || ts < min) ? ts : min;
    }, 0);

    const rawMarkers: ErrorMarker[] = [];
    for (const log of rawLogs) {
      if (isIgnoredUrl(log.url) || isIgnoredUrl(log.message)) continue;
      const isNetErr = log.type === "network" && (Number(log.status) >= 400 || Number(log.status) === 0);
      const isConsoleErr = log.type === "console" && (log.level === "error" || log.level === "warn");
      if (!isNetErr && !isConsoleErr) continue;

      let sec = 0;
      const val = log.time || log.timestamp;
      if (typeof val === "string") {
        const match = val.match(/^(\d{1,2}):(\d{2})$/);
        if (match) sec = parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
      } else if (typeof val === "number" && earliest > 0 && val >= earliest) {
        sec = (val - earliest) / 1000;
      }

      const statusNum = Number(log.status) || 0;
      let badgeText = "err";
      let category: "network" | "console" | "warn" = "console";
      let popupTitle = "1 Error";

      if (isNetErr) {
        category = "network";
        if (statusNum > 0) {
          badgeText = String(statusNum);
          popupTitle = "1 Network Error";
        } else {
          badgeText = "xhr";
          popupTitle = "1 Network Error";
        }
      } else if (log.level === "warn") {
        category = "warn";
        badgeText = "warn";
        popupTitle = "1 Warning";
      } else {
        category = "console";
        badgeText = "err";
        popupTitle = "1 Console Error";
      }

      const label = (log.type === "network" ? `${log.status || "ERR"} ${log.url || ""}` : (log.message || "Error")).slice(0, 50);
      rawMarkers.push({
        timeSec: Math.max(0, sec),
        label,
        type: log.level === "warn" ? "warn" : "error",
        badgeText,
        category,
        status: statusNum || undefined,
        count: 1,
        popupTitle,
      });
    }

    rawMarkers.sort((a, b) => a.timeSec - b.timeSec);

    // Group closely-spaced errors within 1.2s to prevent overlapping badges and match Image #19
    const clustered: ErrorMarker[] = [];
    for (const m of rawMarkers) {
      const prev = clustered[clustered.length - 1];
      if (prev && Math.abs(prev.timeSec - m.timeSec) <= 1.2) {
        prev.count = (prev.count || 1) + 1;
        const total = prev.count;
        if (prev.category === "network" && m.category === "network") {
          prev.popupTitle = `${total} Network Errors`;
        } else {
          prev.popupTitle = `${total} Errors`;
        }
        // Prominence: 5xx > 4xx > xhr > err > warn
        const prevPrio = (prev.status && prev.status >= 500 ? 5 : prev.status && prev.status >= 400 ? 4 : prev.badgeText === "xhr" ? 3 : prev.category === "console" ? 2 : 1);
        const currPrio = (m.status && m.status >= 500 ? 5 : m.status && m.status >= 400 ? 4 : m.badgeText === "xhr" ? 3 : m.category === "console" ? 2 : 1);
        if (currPrio > prevPrio) {
          prev.badgeText = m.badgeText;
          prev.status = m.status;
          prev.category = m.category;
          prev.type = m.type;
        }
      } else {
        clustered.push({ ...m });
      }
    }

    return clustered.slice(0, 30);
  }, [capture]);

  const initialDuration = useMemo(() => {
    if (!capture || capture.type !== "video") return 0;
    if (typeof capture.duration === "number" && capture.duration > 0) {
      return capture.duration;
    }
    // Check object payload if dev_logs was offloaded to Drive as summary object
    if (capture.dev_logs && !Array.isArray(capture.dev_logs) && typeof (capture.dev_logs as { duration?: number }).duration === "number") {
      const objDur = (capture.dev_logs as { duration: number }).duration;
      if (objDur > 0) return Math.round(objDur > 1000 ? objDur / 1000 : objDur);
    }
    if (!capture.dev_logs || !Array.isArray(capture.dev_logs)) return 0;

    let maxSec = 0;
    let earliest = 0;
    let latest = 0;

    for (const log of capture.dev_logs) {
      if (!log) continue;
      if (typeof log.time === "string") {
        const match = log.time.match(/^(\d{1,3}):(\d{2})$/);
        if (match) {
          const sec = parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
          if (sec > maxSec) maxSec = sec;
        }
      }
      const raw = log.timestamp;
      const ts = typeof raw === "number" ? raw : typeof raw === "string" && !/^\d{1,2}:\d{2}$/.test(raw) ? new Date(raw).getTime() : 0;
      if (Number.isFinite(ts) && ts > 0) {
        if (earliest === 0 || ts < earliest) earliest = ts;
        if (ts > latest) latest = ts;
      }
    }

    const span = earliest > 0 && latest > earliest ? Math.ceil((latest - earliest) / 1000) : 0;
    return maxSec > 0 ? maxSec : span;
  }, [capture]);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (moveSubmenuOpen && moveMenuRef.current && !moveMenuRef.current.contains(e.target as Node)) {
        setMoveSubmenuOpen(false);
        setNewFolderMode(false);
      }
      if (accessOpen && accessMenuRef.current && !accessMenuRef.current.contains(e.target as Node)) {
        setAccessOpen(false);
      }
      if (integrationMenuOpen && integrationMenuRef.current && !integrationMenuRef.current.contains(e.target as Node)) {
        setIntegrationMenuOpen(false);
      }
    }
    if (moveSubmenuOpen || accessOpen || integrationMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [moveSubmenuOpen, accessOpen, integrationMenuOpen]);

  // 1. Initial Access Check (Non-Login default)
  useEffect(() => {
    // Branding is a per-workspace paid feature stored in workspace_settings.
    // Legacy localStorage (BugSnap_settings) remains as a fallback for very
    // old captures/links, but the live table is the source of truth.
    try {
      const savedData = localStorage.getItem("BugSnap_settings");
      if (savedData) {
        const parsed = JSON.parse(savedData);
        setBrand({
          name: parsed.brandName || "BugSnap",
          logo: parsed.logoUrl || "",
          hideWatermark: !!parsed.hideWatermark,
        });
      }
    } catch {}

    let cancelled = false;
    if (!id) { setStatus("notfound"); return; }

    if (id === "demo") {
      setCapture(DEMO_CAPTURE);
      setAccessMode("public");
      setStatus("ready");
      return;
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      setStatus("notfound");
      return;
    }

    // Viral Loop Attribution: store referral capture in cookie & storage for zero-DB conversion tracking
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("bugsnap_ref_capture_id", id);
        document.cookie = `bugsnap_ref_capture_id=${encodeURIComponent(id)};path=/;max-age=2592000;SameSite=Lax`;
      }
    } catch {}

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      const u = data.session?.user;
      setIsAuthenticated(!!u);
      setViewerEmail(u?.email ?? null);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      setIsAuthenticated(!!session?.user);
      setViewerEmail(session?.user?.email ?? null);
    });

    // 1b. Fetch live workspace branding (public endpoint so both members and anonymous viewers get branding)
    (async () => {
      try {
        const res = await fetch(`/api/captures/${id}/branding`);
        if (res.ok) {
          const b = (await res.json()) as {
            brandName?: string;
            logoUrl?: string;
            hideWatermark?: boolean;
            configuredIntegrations?: string[];
          };
          if (!cancelled && b) {
            setBrand((prev) => ({
              name: b.brandName || prev.name,
              logo: b.logoUrl || prev.logo,
              hideWatermark: Boolean(b.hideWatermark),
            }));

            if (Array.isArray(b.configuredIntegrations)) {
              const activeList: Array<{ id: string; name: string; iconSrc: string }> = [];
              b.configuredIntegrations.forEach((k) => {
                const meta = INTEGRATION_METADATA[k] || {
                  name: k.charAt(0).toUpperCase() + k.slice(1),
                  iconSrc: "/icons/link.svg",
                };
                activeList.push({ id: k, name: meta.name, iconSrc: meta.iconSrc });
              });
              setConfiguredIntegrations(activeList);
            }
          }
        }
      } catch {
        // Keep defaults; branding is a best-effort enhancement.
      }
    })();

    supabase
      .rpc("get_public_capture", { p_id: id, p_password: null })
      .then(async ({ data, error }) => {
        if (cancelled) return;
        if (error) {
          showToast(error.message || "Failed to load capture", "error");
          setStatus("notfound");
          return;
        }
        if (!data || data.length === 0) { setStatus("notfound"); return; }

        const row = data[0] as Capture & { status: string };
        
        // Check if the user is a logged-in member to bypass password/whitelist gates
        let bypass = false;
        try {
          const { data: authData } = await supabase.auth.getSession();
          const userId = authData.session?.user?.id;
          if (userId) {
          // get_public_capture does NOT return workspace_id, so fetch it directly
          // from the captures table (member-scoped, safe via RLS).
          let wsId = row.workspace_id || null;
          if (!wsId) {
            const { data: wsData } = await supabase
              .from("captures")
              .select("workspace_id")
              .eq("id", id)
              .single();
            wsId = (wsData as { workspace_id: string } | null)?.workspace_id || null;
          }

          if (wsId) {
            const { data: wsInfo } = await supabase
              .from("workspaces")
              .select("owner_user_id")
              .eq("id", wsId)
              .maybeSingle();

            if (wsInfo?.owner_user_id === userId) {
              bypass = true;
              setIsTeamMember(true);
              setIsWorkspaceOwner(true);
            } else {
              const { data: members } = await supabase.rpc("get_workspace_members", {
                p_workspace_id: wsId,
              });
              const memberList = (members ?? []) as { user_id: string; role?: string }[];
              const currentMember = memberList.find((member) => member.user_id === userId);
              if (currentMember) {
                bypass = true;
                setIsTeamMember(true);
                setIsWorkspaceOwner(currentMember.role === "owner");
              }
            }
          }
          }
        } catch {}

        if (bypass) {
          // Force bypass password/domain whitelists for authenticated workspace members.
          // Explicit column list - never `select *`: anon column grants (014) hide
          // password/expires_at from the public key, and this client only uses the
          // anonymous key, so the grant is the enforcement boundary here.
          const { data: directData } = await supabase
            .from("captures")
            .select(
              "id, title, type, drive_url, description, dev_logs, os, browser, site_url, window_size, created_at, workspace_id, folder_name, tag, status, allowed_domains, allowed_ips, burn_after_read, expires_at, project_id, source, access_mode, duration"
            )
            .eq("id", id)
            .single();
          if (directData && !cancelled) {
            setCapture(directData as Capture);
            setAccessMode(directData.access_mode === "members" ? "members" : "public");
            setStatus("ready");
          }
          return;
        }

        setAccessMode(row.access_mode === "members" ? "members" : "public");

        switch (row.status) {
          case "not_found":
            setStatus("notfound");
            break;
          case "expired":
            setStatus("expired");
            break;
          case "needs_password":
            setCapture(row);
            setStatus("locked");
            break;
          case "unauthorized_ip":
            setCapture(row);
            setStatus("unauthorized_ip");
            break;
          case "needs_login":
            setCapture(row);
            setStatus("needs_login");
            break;
          case "unauthorized_domain":
            setCapture(row);
            setStatus("unauthorized_domain");
            break;
          default:
            setCapture(row);
            setStatus("ready");
        }
      });

    const cachedView = viewCountCache.get(id);
    if (cachedView && cachedView.expiresAt > Date.now()) {
      setViewCount(cachedView.value);
    } else {
      supabase.rpc("get_view_count", { p_capture_id: id }).then(({ data }) => {
        if (!cancelled && data != null) {
          const value = Number(data);
          setViewCount(value);
          viewCountCache.set(id, { value, expiresAt: Date.now() + 60_000 });
        }
      });
    }

    return () => {
      cancelled = true;
      authListener.subscription.unsubscribe();
    };
  }, [id, showToast]);

  // Check integrations configuration whenever capture workspace is known
  useEffect(() => {
    if (!capture?.workspace_id) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from("workspace_settings")
          .select("integrations")
          .eq("workspace_id", capture.workspace_id)
          .maybeSingle();
        if (cancelled || !data) return;
        const integrations = (data.integrations || {}) as Record<string, Record<string, string>>;
        const activeList: Array<{ id: string; name: string; iconSrc: string }> = [];
        Object.entries(integrations).forEach(([k, v]) => {
          if (v && typeof v === "object" && Object.values(v).some(val => typeof val === "string" && val.trim().length > 0)) {
            const meta = INTEGRATION_METADATA[k] || { name: k.charAt(0).toUpperCase() + k.slice(1), iconSrc: "/icons/link.svg" };
            activeList.push({ id: k, name: meta.name, iconSrc: meta.iconSrc });
          }
        });
        setConfiguredIntegrations(activeList);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [capture?.workspace_id]);

  // 2. View Tracking Effect
  useEffect(() => {
    if (!id || !capture || status !== "ready") return;
    if (recordedViewRef.current === id) return;
    recordedViewRef.current = id;

    let cancelled = false;
    (async () => {
      try {
        // p_ref omitted when not logged in: anonymous viewer_key is derived
        // from the trusted client IP (014), so a referrer value must never
        // be part of the key - send it only as metadata for members.
        const { error } = await supabase.rpc("record_view", {
          p_capture_id: id,
          ...(isAuthenticated ? { p_ref: document.referrer || null } : {}),
        });
        if (error && !cancelled) recordedViewRef.current = null;
      } catch {
        if (!cancelled) recordedViewRef.current = null;
      }
    })();
    (async () => {
      try {
        const { data } = await supabase.rpc("get_view_count", { p_capture_id: id });
        if (!cancelled && typeof data === "number") {
          setViewCount(data);
          viewCountCache.set(id, { value: data, expiresAt: Date.now() + 60_000 });
        }
      } catch {}
    })();

    return () => { cancelled = true; };
  }, [id, capture, status, isAuthenticated]);

  function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!passwordInput) return;
    setCheckingPassword(true);
    setPasswordError(false);
    supabase
      .rpc("get_public_capture", { p_id: id, p_password: passwordInput })
      .then(({ data, error }) => {
        setCheckingPassword(false);
        if (error || !data || data.length === 0) { setStatus("notfound"); return; }

        const row = data[0] as Capture & { status: string };
        setAccessMode(row.access_mode === "members" ? "members" : "public");
        if (row.status === "ok") {
          setCapture(row);
          setStatus("ready");
        } else if (row.status === "not_found") {
          setStatus("notfound");
        } else if (row.status === "expired") {
          setStatus("expired");
        } else if (row.status === "unauthorized_ip") {
          setStatus("unauthorized_ip");
        } else if (row.status === "needs_login") {
          setStatus("needs_login");
        } else if (row.status === "unauthorized_domain") {
          setStatus("unauthorized_domain");
        } else {
          setCapture(row);
          setPasswordError(true);
        }
      });
  }

  async function handleCopyLink() {
    if (!capture) return;
    try {
      const url = shareType === "content"
        ? `${window.location.origin}/v/${capture.id}?devtools=false`
        : `${window.location.origin}/v/${capture.id}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast(t("v.clipboardDenied"), "error");
    }
  }

  async function saveAccessMode(nextMode: "public" | "members") {
    if (!capture || accessSaving || nextMode === accessMode) return;
    setAccessSaving(true);
    const previous = accessMode;
    setAccessMode(nextMode);
    setCapture({ ...capture, access_mode: nextMode });
    try {
      const { error } = await supabase.from("captures").update({ access_mode: nextMode }).eq("id", capture.id);
      if (error) throw error;
      showToast(nextMode === "public" ? "Link set to public" : "Link restricted to members", "success");
    } catch {
      setAccessMode(previous);
      setCapture({ ...capture, access_mode: previous });
      showToast("Permission denied", "error");
    } finally {
      setAccessSaving(false);
      setAccessOpen(false);
    }
  }

  // Edit / Delete logic
  function openEditModal() {
    if (!capture) return;
    setEditTitle(capture.title || "");
    setEditDesc(capture.description || "");
    setEditTag(capture.tag || "");
    setEditStatus(capture.status && STATUS_OPTIONS.includes(capture.status) ? capture.status : "open");
    setEditAllowedDomains((capture.allowed_domains || []).join(", "));
    setEditAllowedIps((capture.allowed_ips || []).join(", "));
    setEditModalOpen(true);
  }

  async function handleSaveEdit() {
    if (!capture || savingEdit) return;
    setSavingEdit(true);
    setEditError(null);
    try {
      const parsedDomains = editAllowedDomains.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
      const parsedIps = editAllowedIps.split(",").map((s) => s.trim()).filter(Boolean);

      const { error } = await supabase
        .from("captures")
        .update({
          title: editTitle.trim() || capture.title,
          description: editDesc.trim() || null,
          tag: editTag || null,
          status: editStatus || null,
          allowed_domains: parsedDomains.length > 0 ? parsedDomains : null,
          allowed_ips: parsedIps.length > 0 ? parsedIps : null,
        })
        .eq("id", capture.id);
      if (error) throw error;
      setCapture((prev) =>
        prev
          ? {
              ...prev,
              title: editTitle.trim() || prev.title,
              description: editDesc.trim() || null,
              tag: editTag || null,
              status: editStatus || null,
              allowed_domains: parsedDomains.length > 0 ? parsedDomains : null,
              allowed_ips: parsedIps.length > 0 ? parsedIps : null,
            }
          : prev
      );
      setEditModalOpen(false);
      showToast("Capture saved", "success");
    } catch (err) {
      console.warn("Failed to save captures changes:", err);
      setEditError(t("v.saveError"));
      showToast("Save failed", "error");
    } finally {
      setSavingEdit(false);
    }
  }

  async function startDriveConnect() {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error(t("v.signInToDelete"));
    const response = await fetch("/api/google-drive/connect", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    const result = await response.json().catch(() => ({})) as { url?: string; error?: string };
    if (!response.ok || !result.url) throw new Error(result.error || "Could not start Google Drive connection");
    window.location.assign(result.url);
  }

  async function loadCapFolders() {
    if (!capture?.workspace_id) return;
    const { data } = await supabase
      .from("workspace_folders")
      .select("name")
      .eq("workspace_id", capture.workspace_id)
      .order("name");
    setCapFolders((data || []).map((r) => r.name as string));
  }

  async function handleMoveCapture(folderName: string | null) {
    if (!capture?.workspace_id || movingCapture) return;
    setMovingCapture(true);
    try {
      const { error } = await supabase.rpc("move_capture_to_workspace_folder", {
        p_capture_id: capture.id,
        p_target_workspace_id: capture.workspace_id,
        p_target_folder_name: folderName,
      });
      if (error) throw error;
      setCapture((prev) => (prev ? { ...prev, folder_name: folderName } : prev));
      setMoveSubmenuOpen(false);
      setNewFolderMode(false);
      showToast(folderName ? `Moved to "${folderName}"` : "Removed from folder", "success");
    } catch (err) {
      console.warn("Failed to move capture:", err);
      showToast("Move failed", "error");
    } finally {
      setMovingCapture(false);
    }
  }

  async function handleCreateFolderAndMove() {
    const name = newFolderName.trim();
    if (!name || !capture?.workspace_id) return;
    try {
      await supabase.from("workspace_folders").insert({ workspace_id: capture.workspace_id, name });
      setCapFolders((prev) => Array.from(new Set([...prev, name])).sort());
      setNewFolderName("");
      await handleMoveCapture(name);
    } catch (err) {
      console.warn("Failed to create folder:", err);
      // RPC also auto-creates the folder if needed, so proceed to move
      await handleMoveCapture(name);
    }
  }

  function handleDeleteCapture() {
    if (!capture || !isWorkspaceOwner) return;
    setDeleteMode("drive_trash");
    setDeleteCaptureError(null);
    setDriveIssue(null);
    setDeleteOperationId(crypto.randomUUID());
    setDeleteCaptureModalOpen(true);
  }

  async function submitDeleteCapture() {
    if (!capture || !isWorkspaceOwner || deletingCapture || !deleteOperationId) return;
    setDeletingCapture(true);
    setDeleteCaptureError(null);
    setDriveIssue(null);
    try {
      const { data, error } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (error || !token) throw new Error(t("v.signInToDelete"));

      const response = await fetch("/api/google-drive/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ captureIds: [capture.id], mode: deleteMode, operationId: deleteOperationId }),
      });
      const result = await response.json().catch(() => ({})) as {
        results?: Array<{ captureId: string; ok: boolean; outcome?: string; driveOutcome?: "trashed" | "kept" | "unknown"; error?: string }>;
        error?: string;
        code?: string;
      };
      const captureResult = result.results?.find((item) => item.captureId === capture.id);
      if (captureResult?.ok) {
        setDeleteCaptureModalOpen(false);
        setDeleteOperationId(null);
        showToast("Capture deleted", "success");
        router.push("/captures");
        return;
      }

      const issue = result.code === "DRIVE_RECONNECT_REQUIRED"
        ? "reconnect_required"
        : response.status === 409 || /drive.*not connected/i.test(result.error || "")
        ? "not_connected"
        : null;
      if (issue) {
        setDriveIssue(issue);
        throw new Error(issue === "reconnect_required" ? t("cap.driveReconnectRequired") : t("v.driveNotConnected"));
      }
      const detail = captureResult?.error
        ? `${captureResult.error}${captureResult.driveOutcome ? ` (${captureResult.driveOutcome === "trashed" ? "Drive file trashed" : captureResult.driveOutcome === "kept" ? "Drive file kept" : "Drive state unknown"})` : ""}`
        : null;
      throw new Error(detail || result.error || t("v.deleteFailed"));
    } catch (err) {
      console.warn("Failed to delete capture:", err);
      setDeleteCaptureError(err instanceof Error ? err.message : t("v.deleteFailed"));
      showToast("Delete failed", "error");
    } finally {
      setDeletingCapture(false);
    }
  }

  async function handleSendToIntegration(serviceId: string) {
    if (!capture?.id || sendingIntegration) return;
    setSendingIntegration(serviceId);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const res = await fetch(`/api/captures/${capture.id}/send-to-integration`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ service: serviceId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `Failed to send to ${serviceId}`);
      }
      setSentIntegrations((prev) => ({ ...prev, [serviceId]: true }));
      showToast(data.message || `Sent to ${INTEGRATION_METADATA[serviceId]?.name || serviceId}!`, "success");
      setIntegrationMenuOpen(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : `Failed to send to ${serviceId}`, "error");
    } finally {
      setSendingIntegration(null);
    }
  }

  return (
    <div
      className={`min-h-screen font-sans flex flex-col selection:bg-[#89BD49] selection:text-white ${
        status === "ready"
          ? "h-screen bg-white dark:bg-background overflow-y-auto lg:overflow-hidden"
          : "bg-[radial-gradient(ellipse_at_top_left,#f4f9ed_0%,#ffffff_40%,#f0fdf4_100%)] dark:bg-none dark:bg-background text-slate-900 dark:text-foreground relative justify-between overflow-x-hidden"
      }`}
    >
      {status !== "ready" && (
        <>
          <div className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-80 w-[42rem] -translate-x-1/2 rounded-full bg-gradient-to-tr from-[#89BD49]/15 via-slate-400/10 to-emerald-300/15 blur-3xl dark:from-[#89BD49]/10 dark:via-slate-800/15 dark:to-emerald-900/10 animate-pulse-slow" />
          <div className="pointer-events-none absolute -bottom-32 right-1/4 -z-10 h-80 w-[36rem] rounded-full bg-gradient-to-br from-[#89BD49]/10 to-slate-400/10 blur-3xl dark:from-[#89BD49]/10 dark:to-slate-900/20" />
        </>
      )}

      <header className="h-16 border-b border-border/80 bg-white/80 dark:bg-background/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between shrink-0 sticky top-0 z-30">
        <div className="flex items-center gap-3 min-w-0">
          <Link href={isTeamMember ? "/dashboard" : "/"} className="flex items-center gap-2.5 hover:opacity-90 transition-opacity min-w-0 group">
            {brand.logo && !brandLogoFailed ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={brand.logo}
                alt={brand.name}
                className="h-8 w-auto max-w-[140px] object-contain"
                onError={() => setBrandLogoFailed(true)}
              />
            ) : (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icon.svg" alt="BugSnap" className="w-8 h-8 shrink-0 object-contain transition-transform duration-200 group-hover:scale-105" />
                <div className="min-w-0">
                  <span className="text-sm font-bold tracking-tight text-foreground leading-none truncate block">{brand.name}</span>
                </div>
              </>
            )}
          </Link>
          {!brand.hideWatermark && (brand.logo || brand.name !== "BugSnap") && (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-medium text-muted bg-subtle/80 border border-border shrink-0 select-none shadow-2xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon.svg" alt="" className="w-3 h-3 object-contain opacity-70" />
              <span>Powered by BugSnap</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {status === "ready" && capture && (
            <div className="flex items-center gap-2">
              {isTeamMember && configuredIntegrations.length === 1 && (
                <button
                  type="button"
                  disabled={!!sendingIntegration}
                  onClick={() => handleSendToIntegration(configuredIntegrations[0].id)}
                  title={`Send capture to ${configuredIntegrations[0].name}`}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-white dark:bg-background px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-foreground shadow-xs hover:bg-subtle disabled:opacity-50 transition cursor-pointer"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={configuredIntegrations[0].iconSrc}
                    alt=""
                    className="h-4 w-4 object-contain"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/icons/link.svg"; }}
                  />
                  <span className="truncate hidden md:inline">
                    {sendingIntegration === configuredIntegrations[0].id
                      ? "Sending..."
                      : sentIntegrations[configuredIntegrations[0].id]
                      ? `Sent to ${configuredIntegrations[0].name} ✓`
                      : `Send to ${configuredIntegrations[0].name}`}
                  </span>
                </button>
              )}
              {isTeamMember && configuredIntegrations.length > 1 && (
                <div ref={integrationMenuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setIntegrationMenuOpen((o) => !o)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-white dark:bg-background px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-foreground shadow-xs hover:bg-subtle cursor-pointer"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/icons/send.svg" alt="" className="h-4 w-4 shrink-0" />
                    <span className="hidden md:inline">Push to Integration</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/icons/chevron-down.svg" alt="" className={`h-3 w-3 transition-transform ${integrationMenuOpen ? "rotate-180" : ""}`} />
                  </button>
                  {integrationMenuOpen && (
                    <div className="absolute right-0 top-full z-50 mt-2 w-52 rounded-xl border border-border bg-white dark:bg-background p-1 shadow-xl space-y-0.5">
                      {configuredIntegrations.map((intItem) => (
                        <button
                          key={intItem.id}
                          type="button"
                          disabled={!!sendingIntegration}
                          onClick={() => handleSendToIntegration(intItem.id)}
                          className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-foreground hover:bg-subtle disabled:opacity-50 transition-colors cursor-pointer"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={intItem.iconSrc}
                            alt=""
                            className="w-4 h-4 object-contain shrink-0"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/icons/link.svg"; }}
                          />
                          <span className="truncate flex-1">
                            {sendingIntegration === intItem.id ? "Sending..." : intItem.name}
                          </span>
                          {sentIntegrations[intItem.id] && (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">✓ Sent</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {isTeamMember && (
                <div ref={moveMenuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => { setMoveSubmenuOpen((o) => !o); if (capFolders.length === 0) loadCapFolders(); }}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-white dark:bg-background px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-foreground shadow-xs hover:bg-subtle cursor-pointer transition-colors"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/icons/folder.svg" alt="" className="h-4 w-4 shrink-0" />
                    <span>{capture?.folder_name || t("v.moveToFolder")}</span>
                  </button>
                  {moveSubmenuOpen && (
                    <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border border-border bg-white dark:bg-zinc-900 p-1 shadow-xl">
                      <button
                        type="button"
                        disabled={movingCapture}
                        onClick={() => handleMoveCapture(null)}
                        className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-left text-xs hover:bg-subtle disabled:opacity-50 cursor-pointer ${!capture?.folder_name ? "font-semibold text-[#6B9A35] dark:text-[#A8D666] bg-[#89BD49]/10 dark:bg-[#89BD49]/20" : ""}`}
                      >
                        <span>{t("v.noFolder")}</span>
                        {!capture?.folder_name && <span className="text-xs">✓</span>}
                      </button>
                      {capFolders.map((folder) => {
                        const isCurrent = capture?.folder_name === folder;
                        return (
                          <button
                            key={folder}
                            type="button"
                            disabled={movingCapture}
                            onClick={() => handleMoveCapture(folder)}
                            className={`w-full flex items-center justify-between truncate rounded-lg px-3 py-2 text-left text-xs hover:bg-subtle disabled:opacity-50 cursor-pointer ${isCurrent ? "font-semibold text-[#6B9A35] dark:text-[#A8D666] bg-[#89BD49]/10 dark:bg-[#89BD49]/20" : ""}`}
                          >
                            <span className="truncate">{folder}</span>
                            {isCurrent && <span className="text-xs shrink-0 ml-1">✓</span>}
                          </button>
                        );
                      })}
                      {newFolderMode ? (
                        <form onSubmit={(e) => { e.preventDefault(); handleCreateFolderAndMove(); }} className="p-2 border-t border-border mt-1">
                          <input autoFocus value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder={t("v.folderName")} className="w-full rounded-md border border-border bg-white dark:bg-zinc-800 text-foreground px-2 py-1 text-xs outline-none" />
                        </form>
                      ) : (
                        <button type="button" onClick={() => setNewFolderMode(true)} className="w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-[#6B9A35] dark:text-[#A8D666] hover:bg-[#89BD49]/10 dark:hover:bg-[#89BD49]/20 cursor-pointer border-t border-border mt-1">{t("v.newFolder")}</button>
                      )}
                    </div>
                  )}
                </div>
              )}
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#89BD49] px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-white shadow-xs shadow-[#89BD49]/25 hover:bg-[#6B9A35] transition cursor-pointer"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icons/link-white.svg" alt="" className="h-4 w-4 shrink-0" />
                <span>{copied ? t("v.copied") : t("v.copyLinkBtn")}</span>
              </button>
            </div>
          )}
          {status !== "ready" && isTeamMember && (
            <Link
              href="/captures"
              className="px-3 sm:px-4 py-2 rounded-xl border border-border bg-subtle/80 hover:bg-background text-xs font-semibold text-foreground flex items-center transition-all shadow-2xs hover:shadow-xs shrink-0"
            >
              <span className="hidden sm:inline">{t("v.backToDashboard")}</span>
              <span className="sm:hidden">{t("nav.captures")}</span>
            </Link>
          )}
          {!isTeamMember && (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3 sm:px-3.5 py-1.5 rounded-xl border border-border bg-subtle/80 hover:bg-background text-xs font-semibold text-foreground transition-all shadow-2xs hover:shadow-xs"
              >
                {t("v.signIn")}
              </Link>
              <Link
                href="/"
                className="px-3 sm:px-3.5 py-1.5 rounded-xl bg-[#89BD49] hover:bg-[#6B9A35] text-xs font-semibold text-white transition-all shadow-xs shadow-[#89BD49]/25 active:scale-95"
              >
                {t("login.backToHome")}
              </Link>
            </div>
          )}
        </div>
      </header>

      {status !== "ready" && (
        <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 my-auto">
          {status === "loading" && (
            <div className="w-full max-w-5xl flex flex-col gap-6 animate-pulse">
              <div className="h-[clamp(16rem,40vh,28rem)] sm:h-[clamp(28rem,72vh,60rem)] bg-subtle/80 rounded-3xl border border-border/70 backdrop-blur-md" />
              <div className="h-36 bg-subtle/80 rounded-2xl border border-border/70 backdrop-blur-md" />
            </div>
          )}

          {status === "notfound" && (
            <div className="relative w-full max-w-md mx-auto rounded-3xl border border-white/80 dark:border-border bg-white/80 dark:bg-subtle/80 backdrop-blur-xl shadow-2xl shadow-slate-200/60 dark:shadow-none p-8 sm:p-10 text-center animate-in fade-in zoom-in-95 duration-200">
              <div className="relative mx-auto mb-5 flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/50 text-amber-600 dark:text-amber-400 shadow-xs">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>

              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase bg-slate-100 dark:bg-zinc-800 text-muted mb-3 border border-border/60">
                404 • Not Found
              </span>

              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                {t("v.notFoundTitle")}
              </h1>
              <p className="text-sm text-muted mt-2 mb-8 leading-relaxed max-w-xs mx-auto">
                {t("v.notFoundHint")}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
                <Link
                  href={isTeamMember ? "/captures" : "/"}
                  className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#89BD49] hover:bg-[#6B9A35] active:scale-95 text-white text-xs sm:text-sm font-semibold shadow-md shadow-[#89BD49]/20 hover:shadow-lg transition-all"
                >
                  <span>{isTeamMember ? t("v.backToDashboard") : t("login.backToHome")}</span>
                </Link>
                <Link
                  href="/login"
                  className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-border bg-subtle hover:bg-background active:scale-95 text-foreground text-xs sm:text-sm font-semibold shadow-2xs hover:shadow-xs transition-all"
                >
                  <span>{t("v.loginToBugSnap")}</span>
                </Link>
              </div>
            </div>
          )}

          {status === "expired" && (
            <div className="relative w-full max-w-md mx-auto rounded-3xl border border-white/80 dark:border-border bg-white/80 dark:bg-subtle/80 backdrop-blur-xl shadow-2xl shadow-slate-200/60 dark:shadow-none p-8 sm:p-10 text-center animate-in fade-in zoom-in-95 duration-200">
              <div className="relative mx-auto mb-5 flex items-center justify-center w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200/60 dark:border-red-900/50 text-red-600 dark:text-red-400 shadow-xs">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>

              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 mb-3 border border-red-200/60 dark:border-red-900/60">
                Expired
              </span>

              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                {t("v.expiredTitle")}
              </h1>
              <p className="text-sm text-muted mt-2 mb-8 leading-relaxed max-w-xs mx-auto">
                {t("v.expiredHint")}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
                <Link
                  href="/"
                  className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#89BD49] hover:bg-[#6B9A35] active:scale-95 text-white text-xs sm:text-sm font-semibold shadow-md shadow-[#89BD49]/20 hover:shadow-lg transition-all"
                >
                  <span>{t("login.backToHome")}</span>
                </Link>
                <Link
                  href="/login"
                  className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-border bg-subtle hover:bg-background active:scale-95 text-foreground text-xs sm:text-sm font-semibold shadow-2xs hover:shadow-xs transition-all"
                >
                  <span>{t("v.loginToBugSnap")}</span>
                </Link>
              </div>
            </div>
          )}

          {status === "unauthorized_ip" && (
            <div className="relative w-full max-w-md mx-auto rounded-3xl border border-white/80 dark:border-border bg-white/80 dark:bg-subtle/80 backdrop-blur-xl shadow-2xl shadow-slate-200/60 dark:shadow-none p-8 sm:p-10 text-center animate-in fade-in zoom-in-95 duration-200">
              <div className="relative mx-auto mb-5 flex items-center justify-center w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200/60 dark:border-red-900/50 text-red-600 dark:text-red-400 shadow-xs">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m0 0v2m0-2h2m-2 0H10m11-3.5a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>

              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 mb-3 border border-red-200/60 dark:border-red-900/60">
                IP Restricted
              </span>

              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                {t("v.accessRestricted")}
              </h1>
              <p className="text-sm text-muted mt-2 mb-8 leading-relaxed max-w-xs mx-auto">
                {t("v.ipNotAuthorized")}
              </p>

              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#89BD49] hover:bg-[#6B9A35] active:scale-95 text-white text-xs sm:text-sm font-semibold shadow-md shadow-[#89BD49]/20 transition-all"
              >
                <span>{t("login.backToHome")}</span>
              </Link>
            </div>
          )}

          {status === "needs_login" && (
            <div className="relative w-full max-w-md mx-auto rounded-3xl border border-white/80 dark:border-border bg-white/80 dark:bg-subtle/80 backdrop-blur-xl shadow-2xl shadow-slate-200/60 dark:shadow-none p-8 sm:p-10 text-center animate-in fade-in zoom-in-95 duration-200">
              <div className="relative mx-auto mb-5 flex items-center justify-center w-16 h-16 rounded-2xl bg-[#89BD49]/10 dark:bg-[#89BD49]/20 border border-[#89BD49]/30 dark:border-[#89BD49]/40 text-[#6B9A35] dark:text-[#A8D666] shadow-xs">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>

              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase bg-[#89BD49]/10 dark:bg-[#89BD49]/20 text-[#6B9A35] dark:text-[#A8D666] mb-3 border border-[#89BD49]/30 dark:border-[#89BD49]/40">
                Members Only
              </span>

              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                {t("v.loginRequired")}
              </h1>
              <p className="text-sm text-muted mt-2 mb-8 leading-relaxed max-w-xs mx-auto">
                {accessMode === "members" ? t("v.membersOnlyRestricted") : t("v.domainRestricted")}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
                <a
                  href="/login"
                  className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#89BD49] hover:bg-[#6B9A35] active:scale-95 text-white text-xs sm:text-sm font-semibold shadow-md shadow-[#89BD49]/20 hover:shadow-lg transition-all"
                >
                  <span>{t("v.signIn")}</span>
                </a>
                <Link
                  href="/"
                  className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-border bg-subtle hover:bg-background active:scale-95 text-foreground text-xs sm:text-sm font-semibold shadow-2xs hover:shadow-xs transition-all"
                >
                  <span>{t("login.backToHome")}</span>
                </Link>
              </div>
            </div>
          )}

          {status === "unauthorized_domain" && (
            <div className="relative w-full max-w-md mx-auto rounded-3xl border border-white/80 dark:border-border bg-white/80 dark:bg-subtle/80 backdrop-blur-xl shadow-2xl shadow-slate-200/60 dark:shadow-none p-8 sm:p-10 text-center animate-in fade-in zoom-in-95 duration-200">
              <div className="relative mx-auto mb-5 flex items-center justify-center w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200/60 dark:border-red-900/50 text-red-600 dark:text-red-400 shadow-xs">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>

              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 mb-3 border border-red-200/60 dark:border-red-900/60">
                Domain Restricted
              </span>

              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                {t("v.accessDenied")}
              </h1>
              <p className="text-sm text-muted mt-2 mb-8 leading-relaxed max-w-xs mx-auto">
                {t("v.domainNotAuthorized")}
              </p>

              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#89BD49] hover:bg-[#6B9A35] active:scale-95 text-white text-xs sm:text-sm font-semibold shadow-md shadow-[#89BD49]/20 transition-all"
              >
                <span>{t("login.backToHome")}</span>
              </Link>
            </div>
          )}

          {status === "locked" && (
            <div className="relative w-full max-w-md mx-auto rounded-3xl border border-white/80 dark:border-border bg-white/80 dark:bg-subtle/80 backdrop-blur-xl shadow-2xl shadow-slate-200/60 dark:shadow-none p-8 sm:p-10 text-center animate-in fade-in zoom-in-95 duration-200">
              <div className="relative mx-auto mb-5 flex items-center justify-center w-16 h-16 rounded-2xl bg-[#89BD49]/10 dark:bg-[#89BD49]/20 border border-[#89BD49]/30 dark:border-[#89BD49]/40 text-[#6B9A35] dark:text-[#A8D666] shadow-xs">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>

              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase bg-slate-100 dark:bg-zinc-800 text-muted mb-3 border border-border/60">
                Protected
              </span>

              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground mb-2">
                {t("v.passwordProtected")}
              </h1>
              <p className="text-sm text-muted mb-6 leading-relaxed">
                Please enter the password to view this capture.
              </p>

              <form onSubmit={submitPassword} className="flex flex-col gap-3.5">
                <div className="relative">
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(false); }}
                    placeholder={t("v.passwordPlaceholder")}
                    className={`w-full text-sm rounded-xl border px-4 py-3 outline-none bg-subtle text-foreground placeholder:text-muted transition-all ${passwordError ? "border-red-500 focus:ring-2 focus:ring-red-500/20" : "border-border focus:border-[#89BD49] focus:ring-2 focus:ring-[#89BD49]/20"}`}
                  />
                </div>
                {passwordError && (
                  <p className="text-xs text-red-600 dark:text-red-400 text-left font-medium">
                    {t("v.incorrectPassword")}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={checkingPassword || !passwordInput.trim()}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#89BD49] hover:bg-[#6B9A35] active:scale-95 py-3 text-sm font-semibold text-white shadow-md shadow-[#89BD49]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {checkingPassword ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{t("v.unlocking")}</span>
                    </>
                  ) : (
                    <span>{t("v.unlock")}</span>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {status !== "ready" && (
        <footer className="py-6 text-center text-xs text-muted/70 border-t border-border/40 shrink-0">
          BugSnap &mdash; From Click to Fix
        </footer>
      )}

      {status === "ready" && capture && (
        <main className="flex-1 overflow-y-auto bg-[#fbfbfd] dark:bg-background flex flex-col justify-between">
          <div className="mx-auto flex w-full max-w-[1560px] flex-col gap-3 px-3 sm:px-6 pt-3 sm:pt-4 pb-12 sm:pb-16 lg:pb-20">
            {isTeamMember && (
              <div className="flex items-center justify-between gap-2 w-full">
                <Link
                  href="/captures"
                  className="inline-flex items-center justify-center rounded-lg border border-border bg-white dark:bg-background px-3.5 py-2 text-xs font-semibold text-foreground shadow-sm hover:bg-subtle transition-colors"
                >
                  <span>{t("v.backToDashboard")}</span>
                </Link>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_440px] xl:items-start">
              <section className="rounded-xl border border-border bg-white p-4 sm:p-6 lg:p-7 shadow-sm dark:bg-background">
                <MediaViewer
                  type={capture.type}
                  driveUrl={capture.drive_url}
                  title={capture.title}
                  onTimeUpdate={handlePlaybackTimeUpdate}
                  seekToTime={seekTargetTime}
                  errorMarkers={errorMarkers}
                  accessMode={accessMode}
                  initialDuration={initialDuration}
                />
                <div className="mt-5 sm:mt-7 space-y-4">
                  <div
                    onClick={isTeamMember ? openEditModal : undefined}
                    role={isTeamMember ? "button" : undefined}
                    tabIndex={isTeamMember ? 0 : undefined}
                    onKeyDown={isTeamMember ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openEditModal(); } } : undefined}
                    className={isTeamMember ? "group -m-2 rounded-xl p-2 transition-colors hover:bg-subtle/80 cursor-pointer" : ""}
                    title={isTeamMember ? "Click to edit capture details" : undefined}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-lg font-bold text-foreground group-hover:text-[#6B9A35] dark:group-hover:text-[#A8D666] transition-colors">
                        {capture.title}
                      </h2>
                      {isTeamMember && (
                        <span className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-xs font-medium text-muted flex items-center gap-1 shrink-0 mt-0.5 rounded-md border border-border/60 bg-white dark:bg-background px-2 py-0.5 shadow-sm">
                          <img src="/icons/edit.svg" alt="" className="h-3.5 w-3.5" />
                          Edit
                        </span>
                      )}
                    </div>
                    {capture.description ? (
                      <p className="mt-1 text-sm text-muted">{capture.description}</p>
                    ) : isTeamMember ? (
                      <p className="mt-1 text-xs italic text-muted/60">{t("v.addDescription")}</p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
                      {capture.site_url && /^https?:\/\//i.test(capture.site_url) ? (
                        <a
                          href={capture.site_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 rounded-md border border-[#89BD49]/30 bg-[#89BD49]/10 px-2.5 py-1 font-medium text-[#6B9A35] dark:text-[#A8D666] hover:bg-[#89BD49]/20 transition-colors"
                        >
                          <WebsiteFavicon url={capture.site_url} className="h-3.5 w-3.5 rounded-sm object-contain shrink-0" />
                          <span>{hostnameOf(capture.site_url)}</span>
                        </a>
                      ) : capture.site_url ? (
                        <span className="inline-flex items-center gap-1.5 rounded-md border border-[#89BD49]/30 bg-[#89BD49]/10 px-2.5 py-1 font-medium text-[#6B9A35] dark:text-[#A8D666]">
                          <span>{capture.site_url}</span>
                        </span>
                      ) : null}
                      <span>•</span>
                      <span>{new Date(capture.created_at).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Asia/Jakarta", timeZoneName: "short" })}</span>
                      {viewCount !== null && <><span>•</span><span>{t("v.viewCount", { count: viewCount })}</span></>}
                    </div>
                    {capture.expires_at && <p className="mt-2 text-[11px] font-medium text-muted">{getExpiryCountdown(capture.expires_at, t)}</p>}
                  </div>
                  <div className="border-t border-border pt-3">
                    <Comments
                      captureId={capture.id}
                      isVideo={capture.type === "video"}
                      authorName={viewerEmail ? viewerEmail.split("@")[0] : undefined}
                      authorEmail={viewerEmail || undefined}
                      onSeek={(t) => setSeekTargetTime((prev) => (prev === t ? t + 0.0001 : t))}
                      getCurrentTime={() => playbackTime}
                    />
                  </div>
                </div>
              </section>

              <aside className="flex flex-col gap-3 xl:sticky xl:top-4 xl:self-start">
                {!hideDevTools && (
                  <DevToolsPanel
                    capture={capture as unknown as React.ComponentProps<typeof DevToolsPanel>["capture"]}
                    currentTime={playbackTime}
                    onSeekToTime={(t) => setSeekTargetTime((prev) => (prev === t ? t + 0.0001 : t))}
                  />
                )}
                <section className="rounded-xl border border-border bg-white p-5 shadow-sm dark:bg-background">
                  <div>
                    <h3 className="mb-4 text-base font-bold text-foreground">{t("v.shareCapture")}</h3>
                    <div className="grid grid-cols-2 gap-3 sm:gap-5 text-center">
                      <button type="button" onClick={() => setShareType("devtools")} className={`rounded-lg border p-3 sm:p-4 text-xs font-semibold ${shareType === "devtools" ? "border-[#89BD49] text-[#6B9A35] dark:text-[#A8D666]" : "border-border text-muted hover:text-foreground"}`}>
                        <div className="mx-auto mb-2 sm:mb-3 flex h-10 sm:h-12 w-16 sm:w-20 items-center justify-center rounded-md border border-[#89BD49]/30 bg-[#89BD49]/10 text-[#6B9A35] dark:text-[#A8D666] text-xs sm:text-sm">▷ ▯</div>
                        <span>{t("v.withDevTools")}</span>
                        <p className="mt-1 text-[10px] font-normal text-muted">{t("v.withDevToolsHint")}</p>
                      </button>
                      <button type="button" onClick={() => setShareType("content")} className={`rounded-lg border p-3 sm:p-4 text-xs font-semibold ${shareType === "content" ? "border-[#89BD49] text-[#6B9A35] dark:text-[#A8D666]" : "border-border text-muted hover:text-foreground"}`}>
                        <div className="mx-auto mb-2 sm:mb-3 flex h-10 sm:h-12 w-16 sm:w-20 items-center justify-center rounded-md border border-[#89BD49]/30 bg-[#89BD49]/10 text-[#6B9A35] dark:text-[#A8D666] text-xs sm:text-sm">▷</div>
                        <span>{t("v.contentOnly")}</span>
                        <p className="mt-1 text-[10px] font-normal text-muted">{t("v.contentOnlyHint")}</p>
                      </button>
                    </div>
                    <div className="mt-5">
                      <label className="mb-2 block text-xs font-semibold text-muted">{t("v.generalAccess")}</label>
                      <div ref={accessMenuRef} className="relative">
                        <button type="button" onClick={() => setAccessOpen((open) => !open)} className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-subtle">
                          <span className="flex items-center gap-2"><img src="/icons/globe.svg" alt="" className="h-4 w-4" />{accessMode === "members" ? t("v.membersOnly") : t("v.anyoneWithLink")}</span>
                          <img src="/icons/chevron-down.svg" alt="" className="h-3 w-3" />
                        </button>
                        {accessOpen && (
                          <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-xl border border-border bg-white dark:bg-zinc-900 p-1 shadow-xl">
                            <button type="button" onClick={() => void saveAccessMode("public")} disabled={accessSaving} className="w-full rounded-lg px-3 py-2 text-left text-xs hover:bg-subtle disabled:opacity-50">{t("v.anyoneWithLink")}</button>
                            <button type="button" onClick={() => void saveAccessMode("members")} disabled={accessSaving} className="w-full rounded-lg px-3 py-2 text-left text-xs hover:bg-subtle disabled:opacity-50">{t("v.membersOnly")}</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 pt-2">
                    <button type="button" onClick={handleCopyLink} className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#89BD49] hover:bg-[#6B9A35] py-3 text-sm font-semibold text-white shadow-xs shadow-[#89BD49]/25">
                      <img src="/icons/link-white.svg" alt="" className="h-4 w-4" />
                      {copied ? t("v.copiedLink") : t("v.copyLinkBtn")}
                    </button>
                    {isWorkspaceOwner && (
                      <button
                        type="button"
                        onClick={handleDeleteCapture}
                        className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 dark:border-red-900/60 bg-white dark:bg-red-950/20 py-2.5 text-xs font-semibold text-red-600 dark:text-red-400 shadow-sm hover:bg-red-50 dark:hover:bg-red-950/40 hover:border-red-300 dark:hover:border-red-800 transition-colors"
                      >
                        <img src="/icons/trash.svg" alt="" className="h-3.5 w-3.5" />
                        {t("v.deleteCapture")}
                      </button>
                    )}
                  </div>
                </section>
              </aside>
            </div>
          </div>
          {/* Footer at the bottom of natural scroll flow (hidden if workspace has hideWatermark enabled) */}
          {!brand.hideWatermark && <CaptureFooter className="mt-4 sm:mt-6" />}
        </main>
      )}

      {/* Edit Modal (Workspace Members only) */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEditModalOpen(false)} />
          <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl bg-white dark:bg-zinc-900 shadow-xl border border-border p-6">
            <h2 className="text-base font-bold text-foreground mb-4">{t("v.editCapture")}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted mb-1.5">{t("v.titleLabel")}</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full text-sm rounded-lg border border-border px-3 py-2 bg-white dark:bg-zinc-800 text-foreground"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted mb-1.5">{t("v.descLabel")}</label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full text-sm rounded-lg border border-border px-3 py-2 bg-white dark:bg-zinc-800 text-foreground min-h-[72px] resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1.5">{t("v.tagLabel")}</label>
                  <Dropdown
                    variant="field"
                    value={editTag}
                    onChange={setEditTag}
                    options={[{ value: "", label: t("v.noTag") }, ...TAG_OPTIONS.map(t => ({ value: t, label: t }))]}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1.5">{t("v.statusLabel")}</label>
                  <Dropdown
                    variant="field"
                    value={editStatus}
                    onChange={setEditStatus}
                    options={STATUS_OPTIONS.map(s => ({ value: s, label: s }))}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-border/60 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">{t("v.domainsLabel")}</label>
                  <input
                    type="text"
                    value={editAllowedDomains}
                    onChange={(e) => setEditAllowedDomains(e.target.value)}
                    placeholder={t("v.domainsPlaceholder")}
                    className="w-full text-xs font-mono rounded-lg border border-border px-3 py-2 bg-white dark:bg-zinc-800 text-foreground"
                  />
                  <p className="text-[10px] text-muted mt-1">{t("v.domainsHint")}</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">{t("v.ipsLabel")}</label>
                  <input
                    type="text"
                    value={editAllowedIps}
                    onChange={(e) => setEditAllowedIps(e.target.value)}
                    placeholder={t("v.ipsPlaceholder")}
                    className="w-full text-xs font-mono rounded-lg border border-border px-3 py-2 bg-white dark:bg-zinc-800 text-foreground"
                  />
                  <p className="text-[10px] text-muted mt-1">{t("v.ipsHint")}</p>
                </div>
              </div>
              {editError && <p className="text-xs text-red-600 dark:text-red-400">{editError}</p>}
            </div>
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-border">
              <button onClick={() => setEditModalOpen(false)} className="px-4 py-2 text-xs font-medium text-muted hover:text-foreground">{t("common.cancel")}</button>
              <button onClick={handleSaveEdit} disabled={savingEdit} className="px-4 py-2 text-xs font-semibold bg-[#89BD49] hover:bg-[#6B9A35] text-white shadow-xs shadow-[#89BD49]/25 rounded-lg disabled:opacity-50 min-w-[125px] inline-flex items-center justify-center gap-1.5">
                {savingEdit ? (
                  <>
                    <svg className="w-3.5 h-3.5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>{t("v.saving")}</span>
                  </>
                ) : (
                  <span>{t("v.saveChanges")}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Delete Capture Modal */}
      {deleteCaptureModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => { if (!deletingCapture) { setDeleteCaptureModalOpen(false); setDeleteOperationId(null); } }} />
          <div className="relative w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-xl bg-white dark:bg-zinc-900 shadow-xl border border-border p-6 text-center">
            <div className="mx-auto mb-4 w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-center justify-center text-red-600 dark:text-red-400">
              <img src="/icons/trash.svg" alt="" className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-foreground mb-2">{t("v.deleteCaptureQ")}</h2>
            <p className="text-xs text-muted leading-relaxed mb-4">
              {t("v.deleteConfirm", { title: capture?.title ?? "" })}
            </p>
            <fieldset className="space-y-2 text-left mb-4" disabled={deletingCapture}>
              <legend className="text-xs font-semibold text-foreground mb-2">{t("v.deleteFrom")}</legend>
              <label className="flex items-start gap-2 rounded-lg border border-border p-3 cursor-pointer">
                <input type="radio" name="delete-mode" value="drive_trash" checked={deleteMode === "drive_trash"} onChange={() => { setDeleteMode("drive_trash"); setDeleteOperationId(crypto.randomUUID()); }} className="mt-0.5" />
                <span><span className="block text-xs font-semibold text-foreground">{t("v.moveToTrash")}</span><span className="block text-[11px] text-muted mt-0.5">{t("v.trashHint")}</span></span>
              </label>
              <label className="flex items-start gap-2 rounded-lg border border-border p-3 cursor-pointer">
                <input type="radio" name="delete-mode" value="app_only" checked={deleteMode === "app_only"} onChange={() => { setDeleteMode("app_only"); setDeleteOperationId(crypto.randomUUID()); setDriveIssue(null); setDeleteCaptureError(null); }} className="mt-0.5" />
                <span><span className="block text-xs font-semibold text-foreground">{t("v.BugSnapOnly")}</span><span className="block text-[11px] text-muted mt-0.5">{t("v.BugSnapOnlyHint")}</span></span>
              </label>
            </fieldset>
            {driveIssue && <div className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-lg p-2 mb-3 flex items-center justify-between gap-3"><span>{driveIssue === "reconnect_required" ? t("cap.driveReconnectRequired") : t("v.driveNotConnected")}</span><button type="button" onClick={() => void startDriveConnect()} className="font-semibold text-[#6B9A35] dark:text-[#A8D666] hover:underline">{driveIssue === "reconnect_required" ? t("cap.reconnectDrive") : t("cap.connectDrive")}</button></div>}
            {deleteCaptureError && <p role="alert" className="text-xs text-red-600 dark:text-red-400 mb-3">{deleteCaptureError}</p>}
            
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <button
                onClick={() => { setDeleteCaptureModalOpen(false); setDeleteOperationId(null); }}
                disabled={deletingCapture}
                className="px-4 py-2 text-sm font-medium text-foreground hover:bg-subtle rounded-lg transition-colors disabled:opacity-50"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={submitDeleteCapture}
                disabled={deletingCapture}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deletingCapture ? t("v.deleting") : t("v.confirmDelete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SingleViewPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-white dark:bg-background" />}>
      <SingleViewContent />
    </Suspense>
  );
}
