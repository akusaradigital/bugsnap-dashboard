"use client";

import { useState, useEffect, useCallback } from "react";
import { IconCamera, IconTerminal2, IconFolder, IconShare, IconCheck } from "./TablerIcons";

type Role = "qa" | "dev" | "pm";

const ROLES: { key: Role; label: string; emoji: string }[] = [
  { key: "qa", label: "QA & Tester", emoji: "🧪" },
  { key: "dev", label: "Frontend / Backend Dev", emoji: "⚙️" },
  { key: "pm", label: "Product Manager", emoji: "📋" },
];

const ROLE_CONTENT: Record<Role, {
  headline: string;
  points: string[];
  hotkey: string;
  hotkeyLabel: string;
  color: string;
}> = {
  qa: {
    headline: "Zero manual reproduction steps — ever.",
    points: [
      "One-click screen + audio recording captures the exact bug path",
      "Console errors and failed network requests auto-attached silently",
      "Share an interactive link, not a blurry screenshot",
      "Password-protect links and set expiration for staging reports",
    ],
    hotkey: "Ctrl+Shift+F",
    hotkeyLabel: "Start Recording",
    color: "violet",
  },
  dev: {
    headline: "Root cause in the first message, not the fifth.",
    points: [
      "Full Console + Network HAR auto-extracted from the capture session",
      "Exact stack trace, line number, and request payload attached",
      "Generate a curl command from any failed network request",
      "AI Clue tab suggests root cause from logs automatically",
    ],
    hotkey: "Ctrl+Shift+S",
    hotkeyLabel: "Screenshot + DevTools",
    color: "blue",
  },
  pm: {
    headline: "From Slack ping to sprint ticket in one click.",
    points: [
      "1-click export to Linear, Jira, GitHub, or Asana with full context",
      "Structured markdown report with video + repro steps + device info",
      "Organize captures in Workspaces by project or sprint",
      "AI-generated summary and priority suggestion included",
    ],
    hotkey: "Ctrl+Shift+S",
    hotkeyLabel: "Capture + Export",
    color: "emerald",
  },
};

const colorMap: Record<string, { bg: string; text: string; border: string; pill: string }> = {
  violet: {
    bg: "bg-violet-500/10",
    text: "text-violet-600 dark:text-violet-400",
    border: "border-violet-500/30",
    pill: "bg-violet-500",
  },
  blue: {
    bg: "bg-blue-500/10",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-500/30",
    pill: "bg-blue-500",
  },
  emerald: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/30",
    pill: "bg-emerald-500",
  },
};

function HotkeyTester({ hotkey, label }: { hotkey: string; label: string }) {
  const [pressed, setPressed] = useState<Set<string>>(new Set());
  const [fired, setFired] = useState(false);

  const keys = hotkey.split("+");

  const triggerFlash = useCallback(() => {
    setFired(true);
    setTimeout(() => setFired(false), 700);
  }, []);

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      const k = e.key === " " ? "Space" : e.key;
      setPressed((prev) => {
        const next = new Set(prev);
        if (e.ctrlKey) next.add("Ctrl");
        if (e.shiftKey) next.add("Shift");
        next.add(k);
        return next;
      });

      if (e.ctrlKey && e.shiftKey && (e.key === "S" || e.key === "F")) {
        e.preventDefault();
        triggerFlash();
      }
    };
    const onUp = () => setPressed(new Set());
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, [triggerFlash]);

  return (
    <div className={`rounded-xl border p-4 space-y-3 transition-all duration-200 ${fired ? "border-accent bg-accent/5" : "border-site-border bg-site-surface-2"}`}>
      <p className="text-[11px] font-semibold text-site-text-2 uppercase tracking-wide">
        ⌨️ Try the hotkey or click below
      </p>

      <div className="flex items-center gap-2 flex-wrap">
        {keys.map((k, i) => (
          <span key={k}>
            <kbd
              className={`px-3 py-1.5 rounded-lg text-sm font-mono font-bold border-2 shadow-sm transition-all duration-100 select-none ${
                pressed.has(k) || fired
                  ? "border-accent bg-accent text-slate-900 scale-95 shadow-none"
                  : "border-site-border bg-site-surface text-site-text"
              }`}
            >
              {k}
            </kbd>
            {i < keys.length - 1 && (
              <span className="text-site-text-2 text-sm font-bold mx-0.5">+</span>
            )}
          </span>
        ))}

        <span className="text-xs text-site-text-2">or</span>

        <button
          type="button"
          onClick={triggerFlash}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            fired
              ? "bg-accent text-slate-900 scale-95"
              : "bg-site-surface border border-site-border text-site-text hover:border-accent hover:text-accent"
          }`}
        >
          <IconCamera size={13} />
          <span>{label}</span>
        </button>
      </div>

      {fired && (
        <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold animate-in fade-in duration-200">
          <IconCheck size={14} strokeWidth={2.5} />
          <span>Screenshot captured + DevTools extracted in 0.8s</span>
        </div>
      )}
    </div>
  );
}

export function RoleSwitcher() {
  const [activeRole, setActiveRole] = useState<Role>("qa");
  const content = ROLE_CONTENT[activeRole];
  const colors = colorMap[content.color];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Role Tab Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {ROLES.map((r) => (
          <button
            key={r.key}
            type="button"
            onClick={() => setActiveRole(r.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold border transition-all ${
              activeRole === r.key
                ? "border-accent bg-accent text-slate-900 shadow-sm"
                : "border-site-border bg-site-surface text-site-text-2 hover:text-site-text"
            }`}
          >
            <span>{r.emoji}</span>
            <span>{r.label}</span>
          </button>
        ))}
      </div>

      {/* Content Card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start animate-in fade-in duration-200">
        {/* Left: value props */}
        <div className={`rounded-2xl border p-6 space-y-5 ${colors.bg} ${colors.border}`}>
          <h3 className={`text-xl font-extrabold tracking-tight text-balance ${colors.text}`}>
            {content.headline}
          </h3>
          <ul className="space-y-3">
            {content.points.map((p) => (
              <li key={p} className="flex items-start gap-3 text-sm text-site-text">
                <IconCheck size={15} strokeWidth={2.5} className={`shrink-0 mt-0.5 ${colors.text}`} />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right: hotkey tester + mini visual */}
        <div className="space-y-4">
          <HotkeyTester hotkey={content.hotkey} label={content.hotkeyLabel} />

          {/* Mini workflow preview */}
          <div className="rounded-2xl border border-site-border bg-site-surface p-4 space-y-2 text-xs">
            {[
              { icon: IconCamera, label: activeRole === "qa" ? "Screen + audio recording auto-started" : "Screenshot + DevTools captured" },
              { icon: IconTerminal2, label: "Console errors, network logs auto-extracted" },
              { icon: IconFolder, label: "Saved to your Google Drive in 2.1s" },
              { icon: IconShare, label: activeRole === "pm" ? "Exported to Linear / Jira with 1 click" : "Share link generated, ready to paste" },
            ].map(({ icon: Icon, label }, i) => (
              <div key={i} className="flex items-center gap-3 py-1.5 border-b border-site-border last:border-0">
                <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${colors.bg}`}>
                  <Icon size={13} className={colors.text} />
                </div>
                <span className="text-site-text-2">{label}</span>
                <IconCheck size={12} strokeWidth={2.5} className={`ml-auto shrink-0 ${colors.text}`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
