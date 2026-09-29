"use client";

import { useState, useEffect, useCallback } from "react";
import { IconCamera, IconX, IconCheck, IconTerminal2 } from "./TablerIcons";

type CaptureState = "idle" | "flash" | "preview";

export function InteractiveDemoWidget() {
  const [state, setState] = useState<CaptureState>("idle");

  const triggerCapture = useCallback(() => {
    if (state !== "idle") return;
    setState("flash");
    setTimeout(() => setState("preview"), 500);
  }, [state]);

  // Keyboard shortcut listener: Ctrl+Shift+S
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "S") {
        e.preventDefault();
        triggerCapture();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [triggerCapture]);

  return (
    <>
      {/* Screen flash overlay */}
      {state === "flash" && (
        <div className="fixed inset-0 z-[9998] bg-white pointer-events-none animate-[flash_0.4s_ease-out_forwards]" />
      )}

      {/* Preview Dialog */}
      {state === "preview" && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-site-surface rounded-2xl border border-site-border shadow-2xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-site-border">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center">
                  <IconCheck size={14} strokeWidth={2.5} className="text-accent" />
                </div>
                <div>
                  <p className="text-sm font-bold text-site-text">Captured in 1.2s!</p>
                  <p className="text-[11px] text-site-text-2">Saved to your Google Drive</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setState("idle")}
                className="text-site-text-2 hover:text-site-text p-1 rounded"
              >
                <IconX size={16} />
              </button>
            </div>

            {/* Screenshot preview */}
            <div className="p-4 space-y-3">
              {/* Fake screenshot thumb */}
              <div className="rounded-lg border-2 border-red-500 bg-red-500/5 p-3 flex items-center justify-between text-xs">
                <span className="font-semibold text-red-600 dark:text-red-400">Pay $2,400.00</span>
                <span className="font-mono bg-red-500/10 px-2 py-0.5 rounded text-red-600 dark:text-red-400">HTTP 500 Error</span>
              </div>

              {/* Auto-extracted logs */}
              <div className="rounded-lg border border-site-border bg-site-surface-2 p-3 space-y-2">
                <p className="text-[11px] font-semibold text-site-text flex items-center gap-1.5">
                  <IconTerminal2 size={13} className="text-accent" />
                  Auto-extracted DevTools
                </p>
                <div className="font-mono text-[10px] text-red-500 bg-site-surface rounded px-2 py-1.5 border border-site-border">
                  ✕ TypeError: Cannot read properties of undefined (reading &apos;token&apos;)
                </div>
                <div className="flex gap-1 text-[9px]">
                  <span className="px-1.5 py-0.5 rounded bg-site-surface border border-site-border text-site-text-2">Chrome 128</span>
                  <span className="px-1.5 py-0.5 rounded bg-site-surface border border-site-border text-site-text-2">macOS 14.5</span>
                  <span className="px-1.5 py-0.5 rounded bg-site-surface border border-site-border text-site-text-2">1920×1080</span>
                </div>
              </div>

              {/* Share link */}
              <div className="flex items-center gap-2 rounded-lg border border-site-border bg-site-surface-2 px-3 py-2">
                <span className="font-mono text-[10px] text-site-text-2 truncate flex-1">
                  bugsnap.akusaraproject.my.id/v/demo42
                </span>
                <span className="text-[10px] font-bold text-accent shrink-0">Copy Link</span>
              </div>

              <p className="text-center text-[11px] text-site-text-2">
                This is a simulation — install the extension to capture for real!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Floating action button */}
      {state === "idle" && (
        <button
          type="button"
          onClick={triggerCapture}
          className="fixed bottom-6 right-6 z-[9997] flex items-center gap-2 px-4 py-3 rounded-full bg-accent text-slate-900 text-sm font-bold shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all group"
          title="Click or press Ctrl+Shift+S"
        >
          <IconCamera size={17} strokeWidth={2.5} />
          <span>Try BugSnap Here</span>
          <span className="ml-1 text-[10px] font-mono bg-slate-900/20 px-1.5 py-0.5 rounded hidden sm:inline">
            Ctrl+Shift+S
          </span>
        </button>
      )}

      <style>{`
        @keyframes flash {
          0% { opacity: 0.9; }
          100% { opacity: 0; }
        }
      `}</style>
    </>
  );
}
