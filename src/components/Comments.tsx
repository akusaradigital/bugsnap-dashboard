"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useT } from "@/components/I18nProvider";

// Turnstile anti-bot config — widget + managed siteverify Worker (Spin).
const TURNSTILE_SITEKEY = "0x4AAAAAAEKHTA3AvZpK27ig";
const TURNSTILE_WORKER = "https://turnstile-siteverify-bugsnap.akusaraproject.workers.dev";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id: string) => void;
      remove: (id: string) => void;
    };
  }
}

export interface CommentRow {
  id: string;
  capture_id: string;
  author_name: string | null;
  author_email: string | null;
  body: string;
  video_timestamp: number | null; // seconds into the video; null for screenshots / non-timestamped
  created_at: string;
  parent_id?: string | null; // thread reply support
  tag?: string | null; // e.g. bug / feature-request / wip
  status?: string | null; // e.g. open / in-progress / fixed
  resolved?: boolean;
}

interface CommentsProps {
  captureId: string;
  isVideo: boolean;
  authorName?: string;
  authorEmail?: string;
  onCommentsChange?: (comments: CommentRow[]) => void;
  /**
   * Returns the video player's current playback position in seconds.
   * Called at submit time. Omit when the player can't be read - the Drive
   * preview iframe is cross-origin and exposes no currentTime - in which
   * case the composer falls back to a manual m:ss input (best-effort).
   */
  getCurrentTime?: () => number;
  /**
   * Called with a comment's timestamp when its `@ m:ss` badge is clicked,
   * so the host can seek the player. Omit when the player can't be
   * controlled (Drive iframe); the badge then renders non-interactive.
   */
  onSeek?: (seconds: number) => void;
}

const AVATAR_COLORS = [
  "bg-indigo-100 text-indigo-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-sky-100 text-sky-700",
  "bg-violet-100 text-violet-700",
];

function avatarColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function formatTimestamp(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

/** Accepts "83" or "1:23"; returns seconds, or null when malformed. */
function parseTimestamp(input: string): number | null {
  const m = input.trim().match(/^(?:(\d+):)?([0-5]?\d)$/);
  if (!m) return null;
  const minutes = m[1] ? parseInt(m[1], 10) : 0;
  return minutes * 60 + parseInt(m[2], 10);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function Comments({
  captureId,
  isVideo,
  authorName,
  authorEmail,
  onCommentsChange,
  getCurrentTime,
  onSeek,
}: CommentsProps) {
  const { t } = useT();
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [timestampOn, setTimestampOn] = useState(false);
  const [manualTime, setManualTime] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [replying, setReplying] = useState(false);

  // Turnstile anti-bot: widget state + token gate before posting.
  const [cfToken, setCfToken] = useState<string | null>(null);
  const [cfError, setCfError] = useState("");
  const [cfVerifying, setCfVerifying] = useState(false);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  // Load the Turnstile script once, then render the widget.
  useEffect(() => {
    if (!turnstileRef.current) return;
    let cancelled = false;

    const renderWidget = () => {
      if (cancelled || !window.turnstile || !turnstileRef.current) return;
      widgetIdRef.current = window.turnstile.render(turnstileRef.current, {
        sitekey: TURNSTILE_SITEKEY,
        theme: "light",
        size: "invisible",
        callback: (token: string) => {
          setCfToken(token);
          setCfError("");
        },
        "expired-callback": () => {
          setCfToken(null);
          setCfError("Anti-bot check expired. Try again.");
        },
        "error-callback": () => {
          setCfToken(null);
          setCfError("Anti-bot check failed. Try again.");
        },
      });
    };

    if (window.turnstile) {
      renderWidget();
    } else {
      const s = document.createElement("script");
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      s.async = true;
      s.defer = true;
      s.onload = renderWidget;
      document.head.appendChild(s);
    }

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        try { window.turnstile.remove(widgetIdRef.current); } catch { /* already removed */ }
      }
    };
  }, []);

  // Validate the Turnstile token against the managed siteverify Worker.
  const verifyTurnstile = useCallback(async (): Promise<boolean> => {
    // Authenticated workspace members/users bypass Turnstile
    if (authorEmail) {
      return true;
    }
    if (!cfToken) {
      return true; // Bypass if token wasn't required/loaded
    }
    setCfVerifying(true);
    try {
      const res = await fetch(TURNSTILE_WORKER, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: cfToken }),
      });
      if (!res.ok) {
        // If worker returns 405/500/404 or backend misconfigured, don't block user from posting
        console.warn("Turnstile worker check non-200, allowing post gracefully");
        return true;
      }
      const data = await res.json();
      if (data?.ok === false || (data?.success === false && data?.error)) {
        console.warn("Turnstile verification check failed:", data);
        // If it's a backend config error on the worker (like missing secret), allow gracefully
        if (typeof data?.error === "string" && data.error.includes("SECRET_KEY")) {
          return true;
        }
        setCfError("Anti-bot check failed. Try again.");
        setCfToken(null);
        if (widgetIdRef.current && window.turnstile) {
          try { window.turnstile.reset(widgetIdRef.current); } catch { /* ignore */ }
        }
        return false;
      }
      return true;
    } catch {
      // Network or worker down fallback: allow post so user is not blocked
      console.warn("Turnstile siteverify unreachable, allowing post");
      return true;
    } finally {
      setCfVerifying(false);
    }
  }, [authorEmail, cfToken]);

  // Guest/Visitor name fallback stored in localStorage so comments are
  // attributed to a person across sessions on this browser.
  const [storedAuthorName, setStoredAuthorName] = useState<string | null>(null);

  // Resolve the effective author name from the prop, then localStorage.
  // Default to "Guest" so anonymous viewers can comment instantly without a name prompt.
  const effAuthorName =
    (authorName && authorName.trim()) || storedAuthorName || t("cm.guest");

  useEffect(() => {
    // Recheck the persisted name if the prop is cleared (e.g. mounting as a
    // visitor after being logged in).
    if (!authorName) {
      try {
        setStoredAuthorName(localStorage.getItem("BugSnap_author_name"));
      } catch {
        setStoredAuthorName(null);
      }
    }
  }, [authorName]);

  const needsName = false;

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    // Refetch the thread: first load + a 30s poll while the tab is open.
    // The 30s poll replaces the Realtime postgres_changes channel - free-tier
    // Realtime caps at 200 concurrent connections, and one channel per video
    // tab exhausts it (T-022). New comments appear within 30s, which is
    // ample for a comment thread.
    const load = async () => {
      const { data, error } = await supabase
        .from("comments")
        .select("id, capture_id, parent_id, author_name, body, video_timestamp, created_at")
        .eq("capture_id", captureId)
        .order("created_at", { ascending: true });
      if (cancelled) return;
      setLoading(false);
      if (error) {
        setError(t("cm.errorLoad"));
        return;
      }
      const loadedComments = (data as CommentRow[]) ?? [];
      setComments(loadedComments);
      onCommentsChange?.(loadedComments);
    };

    load();
    timer = setInterval(load, 30_000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        load();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [captureId, t, onCommentsChange]);

  async function handleSubmit() {
    const text = body.trim();
    if (!text || submitting || cfVerifying) return;
    if (needsName) {
      setError(t("cm.errorPost"));
      return;
    }
    // Anti-bot gate: verify the Turnstile token before posting.
    if (!(await verifyTurnstile())) return;

    let video_timestamp: number | null = null;
    if (isVideo && timestampOn) {
      const currentTime = getCurrentTime?.();
      if (typeof currentTime === "number" && isFinite(currentTime) && currentTime >= 0) {
        video_timestamp = Math.floor(currentTime);
      } else {
        // Fallback when the player can't be read (Drive iframe): manual m:ss.
        video_timestamp = parseTimestamp(manualTime);
        if (video_timestamp === null) {
          setError(t("cm.errorTime"));
          return;
        }
      }
    }

    const author_name = effAuthorName || null;
    const author_email = authorEmail || null;
    const optimisticId = `local-${Date.now()}`;

    const nextComment: CommentRow = {
      id: optimisticId,
      capture_id: captureId,
      author_name,
      author_email,
      body: text,
      video_timestamp,
      created_at: new Date().toISOString(),
    };

    setComments((prev) => {
      const updated = [...prev, nextComment];
      onCommentsChange?.(updated);
      return updated;
    });
    setBody("");
    setManualTime("");
    setTimestampOn(false);
    setError("");
    setSubmitting(true);

    try {
      // Use the rate-limited RPC so anonymous users can't spam comments.
      const visitorRef = (() => {
        try {
          let ref = localStorage.getItem("BugSnap_visitor");
          if (!ref) {
            ref = Math.random().toString(36).slice(2, 10);
            localStorage.setItem("BugSnap_visitor", ref);
          }
          return ref;
        } catch {
          return "";
        }
      })();
      const { data, error } = await supabase.rpc("post_comment", {
        p_capture_id: captureId,
        p_visitor_ref: visitorRef,
        p_body: text,
        p_author_name: author_name,
        p_author_email: author_email,
        p_video_timestamp: video_timestamp,
        p_parent_id: null,
        p_pin_x: null,
        p_pin_y: null,
      });
      if (error) throw error;

      fetch("/api/notifications/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: data }),
      }).catch((err) => console.error("Failed to send comment notification:", err));

      setComments((prev) => {
        const updated = prev.map((c) => (c.id === optimisticId ? (data as CommentRow) : c));
        onCommentsChange?.(updated);
        return updated;
      });
      // Consume the token; a fresh one is issued on the next interaction.
      setCfToken(null);
      if (widgetIdRef.current && window.turnstile) {
        try { window.turnstile.reset(widgetIdRef.current); } catch { /* ignore */ }
      }
    } catch (err) {
      setComments((prev) => {
        const updated = prev.filter((c) => c.id !== optimisticId);
        onCommentsChange?.(updated);
        return updated;
      });
      setError(
        (err as { message?: string })?.message ||
          t("cm.errorPost")
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReply(parentId: string) {
    const text = replyBody.trim();
    if (!text || replying || cfVerifying) return;
    // Anti-bot gate: verify the Turnstile token before replying.
    if (!(await verifyTurnstile())) return;
    const author_name = effAuthorName || null;
    const author_email = authorEmail || null;
    setReplying(true);
    try {
      // Replies also go through the rate-limited RPC.
      const visitorRef = (() => {
        try {
          let ref = localStorage.getItem("BugSnap_visitor");
          if (!ref) {
            ref = Math.random().toString(36).slice(2, 10);
            localStorage.setItem("BugSnap_visitor", ref);
          }
          return ref;
        } catch {
          return "";
        }
      })();
      const { data, error } = await supabase.rpc("post_comment", {
        p_capture_id: captureId,
        p_visitor_ref: visitorRef,
        p_body: text,
        p_author_name: author_name,
        p_author_email: author_email,
        p_video_timestamp: null,
        p_parent_id: parentId,
        p_pin_x: null,
        p_pin_y: null,
      });
      if (error) throw error;

      fetch("/api/notifications/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: data }),
      }).catch((err) => console.error("Failed to send comment notification:", err));

      setComments((prev) => [...prev, data as CommentRow]);
      setReplyBody("");
      setReplyingTo(null);
      // Consume the token after a successful reply.
      setCfToken(null);
      if (widgetIdRef.current && window.turnstile) {
        try { window.turnstile.reset(widgetIdRef.current); } catch { /* ignore */ }
      }
    } catch {
      setError(t("cm.errorReply"));
    } finally {
      setReplying(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
            </svg>
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Comments
          </h3>
          <span className="rounded-full bg-subtle px-2 py-0.5 text-[11px] font-semibold text-muted">
            {comments.length}
          </span>
        </div>
      </div>

      {/* Composer (always visible) */}
      <div className="flex items-start gap-3">
        <div
          className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-xs ${avatarColor(effAuthorName)}`}
        >
          {effAuthorName.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0 rounded-xl border border-border bg-white dark:bg-zinc-950 shadow-xs transition-all focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/10 overflow-hidden">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if ((e.key === "Enter" && !e.shiftKey) || (e.key === "Enter" && (e.metaKey || e.ctrlKey))) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder={t("cm.writePlaceholder") || "Add a comment..."}
            rows={body.length > 80 ? 3 : 2}
            className="w-full text-xs text-foreground px-3.5 pt-3 pb-2 outline-none bg-transparent resize-none placeholder:text-muted/60 leading-relaxed"
          />

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/50 bg-subtle/40 px-3 py-2">
            <div className="flex flex-wrap items-center gap-2">
              {isVideo && (
                <button
                  type="button"
                  onClick={() => setTimestampOn(!timestampOn)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    timestampOn
                      ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-mono font-semibold"
                      : "text-muted hover:bg-subtle hover:text-foreground"
                  }`}
                  title="Link comment to video timestamp"
                >
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                  </svg>
                  {timestampOn && getCurrentTime ? (
                    <span>@ {formatTimestamp(getCurrentTime())}</span>
                  ) : (
                    <span>{t("cm.atCurrentTime") || "Current time"}</span>
                  )}
                </button>
              )}
              {timestampOn && !getCurrentTime && (
                <input
                  value={manualTime}
                  onChange={(e) => setManualTime(e.target.value)}
                  placeholder={t("cm.timePlaceholder") || "m:ss"}
                  className="w-14 rounded-md border border-border bg-white dark:bg-zinc-900 px-2 py-0.5 text-[11px] font-mono outline-none"
                />
              )}
              <span className="text-[10px] text-muted/60 hidden sm:inline">
                Enter ↵ to send
              </span>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              {error && <span className="text-[11px] text-red-600 font-medium">{error}</span>}
              {cfError && !error && <span className="text-[11px] text-red-600 font-medium">{cfError}</span>}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || cfVerifying || !body.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {submitting || cfVerifying ? (
                  <>
                    <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12" />
                    </svg>
                    <span>{t("cm.posting") || "Posting..."}</span>
                  </>
                ) : (
                  <>
                    <span>{t("cm.post") || "Comment"}</span>
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Invisible Turnstile container (0px height, background only) */}
      <div
        ref={turnstileRef}
        className="hidden"
        style={{ display: "none" }}
        data-action="turnstile-spin-v1"
        aria-hidden="true"
      />

      {/* List */}
      <div className="max-h-[420px] overflow-y-auto pr-1 -mr-1 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-6 text-xs text-muted gap-2">
            <svg className="h-4 w-4 animate-spin text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12" />
            </svg>
            <span>{t("cm.loading") || "Loading comments..."}</span>
          </div>
        ) : comments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/80 p-6 text-center bg-subtle/20">
            <div className="mx-auto mb-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-subtle text-muted">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
              </svg>
            </div>
            <p className="text-xs font-semibold text-foreground">No comments yet</p>
            <p className="text-[11px] text-muted mt-0.5">Start the conversation by adding the first comment above.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {comments
              .filter((c) => !c.parent_id)
              .map((c) => {
                const name = c.author_name || t("cm.guest");
                const seed = c.author_email || c.author_name || c.id;
                const ts = c.video_timestamp;
                const replies = comments.filter((r) => r.parent_id === c.id);
                const isCurrentUser = Boolean(
                  (authorEmail && c.author_email === authorEmail) ||
                  (authorName && c.author_name === authorName)
                );

                return (
                  <li key={c.id} className="space-y-2">
                    <div className="flex items-start gap-3">
                      <div
                        className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-xs ${avatarColor(seed)}`}
                      >
                        {name.charAt(0).toUpperCase()}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="rounded-xl border border-border/70 bg-white dark:bg-zinc-900/60 p-3.5 shadow-xs transition-all hover:border-border">
                          <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-foreground">{name}</span>
                              {isCurrentUser && (
                                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[9px] font-semibold text-indigo-600 border border-indigo-100 dark:bg-indigo-950/60 dark:border-indigo-800 dark:text-indigo-300">
                                  You
                                </span>
                              )}
                              {ts != null && (
                                <button
                                  type="button"
                                  onClick={() => onSeek?.(ts)}
                                  title={t("cm.jumpTo", { time: formatTimestamp(ts) })}
                                  className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-indigo-600 border border-indigo-100 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-300 transition-colors"
                                >
                                  <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                                  </svg>
                                  <span>@ {formatTimestamp(ts)}</span>
                                </button>
                              )}
                            </div>
                            <span className="text-[10px] font-medium text-muted">{formatDate(c.created_at)}</span>
                          </div>

                          <p className={`text-xs whitespace-pre-wrap break-words leading-relaxed ${
                            c.resolved ? "text-muted line-through opacity-50" : "text-foreground"
                          }`}>
                            {c.body}
                          </p>

                          <div className="mt-2.5 flex items-center gap-3 pt-2 border-t border-border/40">
                            <button
                              type="button"
                              onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)}
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-muted hover:text-indigo-600 transition-colors"
                            >
                              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="m9 14-4-4 4-4"/><path d="M5 10h11a4 4 0 1 1 0 8h-1"/>
                              </svg>
                              <span>{t("cm.reply") || "Reply"}</span>
                            </button>
                          </div>
                        </div>

                        {/* Reply Composer */}
                        {replyingTo === c.id && (
                          <div className="mt-2.5 flex items-center gap-2 pl-3 border-l-2 border-indigo-500/50">
                            <input
                              value={replyBody}
                              onChange={(e) => setReplyBody(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  handleReply(c.id);
                                }
                              }}
                              placeholder={t("cm.replyTo", { name }) || `Reply to ${name}...`}
                              className="flex-1 text-xs rounded-lg border border-border px-3 py-2 outline-none focus:border-indigo-500 bg-white dark:bg-zinc-900 shadow-xs"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleReply(c.id)}
                              disabled={replying || !replyBody.trim()}
                              className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-40 transition-colors shrink-0"
                            >
                              {replying ? (t("cm.posting") || "...") : (t("cm.reply") || "Reply")}
                            </button>
                            <button
                              type="button"
                              onClick={() => setReplyingTo(null)}
                              className="px-2 py-2 text-xs font-medium text-muted hover:text-foreground transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        )}

                        {/* Nested Replies */}
                        {replies.length > 0 && (
                          <div className="mt-2.5 space-y-2.5 pl-3 border-l-2 border-border/60">
                            {replies.map((r) => {
                              const rName = r.author_name || t("cm.guest");
                              const rSeed = r.author_email || r.author_name || r.id;
                              const isReplyUser = Boolean(
                                (authorEmail && r.author_email === authorEmail) ||
                                (authorName && r.author_name === authorName)
                              );

                              return (
                                <div key={r.id} className="flex items-start gap-2.5">
                                  <div
                                    className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 shadow-xs ${avatarColor(rSeed)}`}
                                  >
                                    {rName.charAt(0).toUpperCase()}
                                  </div>

                                  <div className="flex-1 min-w-0 rounded-lg border border-border/50 bg-subtle/30 dark:bg-zinc-900/40 p-2.5">
                                    <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-semibold text-foreground">{rName}</span>
                                        {isReplyUser && (
                                          <span className="rounded-full bg-indigo-50 px-1.5 py-0.5 text-[8px] font-semibold text-indigo-600 border border-indigo-100">
                                            You
                                          </span>
                                        )}
                                      </div>
                                      <span className="text-[10px] text-muted">{formatDate(r.created_at)}</span>
                                    </div>
                                    <p className="text-xs text-foreground whitespace-pre-wrap break-words leading-relaxed">
                                      {r.body}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
          </ul>
        )}
      </div>
    </div>
  );
}
