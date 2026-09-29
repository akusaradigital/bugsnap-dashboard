"use client";

import { useEffect, useState } from "react";
import { IconCheck, IconPencil, IconTerminal2, IconFolder, IconShare } from "./TablerIcons";

type DemoStep = "ready" | "capturing" | "devtools" | "saving" | "shared";

const STEPS: { key: DemoStep; label: string; duration: number }[] = [
  { key: "ready", label: "1. Trigger Bug", duration: 2500 },
  { key: "capturing", label: "2. Record & Annotate", duration: 3000 },
  { key: "devtools", label: "3. Auto-Capture DevTools", duration: 3200 },
  { key: "saving", label: "4. Save to Google Drive", duration: 2500 },
  { key: "shared", label: "5. Instant Link Ready", duration: 3000 },
];

export function ProductVideoDemo() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const currentStep = STEPS[currentStepIndex].key;

  // Auto-advance loop
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setTimeout(() => {
      setCurrentStepIndex((prev) => (prev + 1) % STEPS.length);
    }, STEPS[currentStepIndex].duration);

    return () => clearTimeout(timer);
  }, [currentStepIndex, isPlaying]);

  return (
    <div className="w-full max-w-5xl mx-auto rounded-2xl border border-site-border bg-site-surface shadow-2xl overflow-hidden font-site">
      {/* Top Browser Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-site-border bg-site-surface-2">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-400/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-yellow-400/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-green-400/80 inline-block" />
          </div>
          <span className="text-xs font-mono text-site-text-2 bg-site-surface px-3 py-1 rounded-md border border-site-border ml-2 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            https://store.acme.corp/checkout
          </span>
        </div>

        {/* Video Step Progress Indicator */}
        <div className="flex items-center gap-1">
          {STEPS.map((step, idx) => (
            <button
              key={step.key}
              type="button"
              onClick={() => {
                setCurrentStepIndex(idx);
                setIsPlaying(false);
              }}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentStepIndex
                  ? "w-6 bg-accent"
                  : idx < currentStepIndex
                  ? "w-2 bg-accent/40"
                  : "w-2 bg-site-border"
              }`}
              title={step.label}
            />
          ))}
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="ml-3 text-[11px] font-mono text-site-text-2 hover:text-site-text px-2 py-0.5 rounded border border-site-border"
          >
            {isPlaying ? "Pause" : "Play"}
          </button>
        </div>
      </div>

      {/* Main Canvas Viewport */}
      <div className="relative min-h-[420px] sm:min-h-[460px] bg-slate-950 text-slate-100 flex flex-col justify-between overflow-hidden">
        {/* Subtle grid background */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(#fff 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Floating status pill (top-right) */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          {currentStep === "capturing" && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-mono animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              REC 00:04 · 60fps
            </div>
          )}
          {currentStep === "devtools" && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono">
              <IconTerminal2 size={13} />
              DevTools Attached (2 Errors)
            </div>
          )}
          {currentStep === "saving" && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-300 text-xs font-mono">
              <IconFolder size={13} />
              Syncing to Google Drive...
            </div>
          )}
          {currentStep === "shared" && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono">
              <IconCheck size={13} />
              Saved & Link Copied!
            </div>
          )}
        </div>

        {/* Content Layer (changes based on step) */}
        <div className="relative z-10 p-6 sm:p-10 flex-1 flex flex-col justify-center">

          {/* STEP 1: Ready / Trigger Bug */}
          {currentStep === "ready" && (
            <div className="max-w-md mx-auto w-full bg-slate-900/90 rounded-xl border border-slate-800 p-6 space-y-4 shadow-xl animate-in fade-in zoom-in-95 duration-300">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-semibold text-slate-400">Order #89211</span>
                <span className="text-xs font-mono text-emerald-400 font-bold">$2,400.00</span>
              </div>
              <div className="space-y-2">
                <div className="h-8 rounded bg-slate-800/80 px-3 flex items-center justify-between text-xs font-mono text-slate-300">
                  <span>•••• •••• •••• 4242</span>
                  <span className="text-slate-500">12/28</span>
                </div>
                {/* Bug button with click ripple */}
                <div className="relative">
                  <div className="w-full py-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-center text-sm shadow cursor-pointer transition-transform active:scale-95 flex items-center justify-center gap-2">
                    <span>Pay $2,400.00</span>
                    <span className="text-[10px] bg-slate-950/20 px-1.5 py-0.5 rounded font-mono">Click!</span>
                  </div>
                  {/* Click pulse animation */}
                  <span className="absolute inset-0 rounded-lg border-2 border-emerald-400 animate-ping pointer-events-none opacity-75" />
                </div>
              </div>
              <p className="text-[11px] text-center text-slate-500">Simulating user checkout error click...</p>
            </div>
          )}

          {/* STEP 2: Capturing & Annotation */}
          {currentStep === "capturing" && (
            <div className="max-w-lg mx-auto w-full space-y-4 animate-in fade-in duration-300">
              {/* Highlighted error element */}
              <div className="relative bg-slate-900/90 rounded-xl border-2 border-red-500 p-6 shadow-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-300">Pay Button Failed</p>
                    <p className="text-[11px] text-red-400 font-mono mt-0.5">TypeError: Uncaught in Promise</p>
                  </div>
                  <span className="px-2 py-1 rounded bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-mono">
                    HTTP 500
                  </span>
                </div>

                {/* BugSnap Callout Pin */}
                <div className="absolute -top-3 left-6 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  <span>BugSnap Callout #1</span>
                </div>
              </div>

              {/* In-canvas toolbar */}
              <div className="mx-auto w-fit flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 shadow-lg text-xs">
                <span className="flex items-center gap-1 px-2 py-1 rounded bg-accent/20 text-accent font-semibold text-[11px]">
                  <IconPencil size={12} />
                  <span>Annotating</span>
                </span>
                <span className="text-slate-600">|</span>
                <span className="px-2 py-1 text-slate-400 text-[11px]">Square Box</span>
                <span className="px-2 py-1 text-slate-400 text-[11px]">Arrow</span>
                <span className="px-2 py-1 text-slate-400 text-[11px]">Blur</span>
              </div>
            </div>
          )}

          {/* STEP 3: DevTools Auto-Capture */}
          {currentStep === "devtools" && (
            <div className="max-w-xl mx-auto w-full bg-slate-900/95 rounded-xl border border-slate-800 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
              {/* DevTools Tab Bar */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-950 text-xs font-mono">
                <div className="flex items-center gap-3">
                  <span className="text-red-400 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    Console (1)
                  </span>
                  <span className="text-amber-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Network (1 Fail)
                  </span>
                  <span className="text-slate-500">Storage</span>
                  <span className="text-slate-500">System</span>
                </div>
                <span className="text-[10px] text-slate-500">Auto-extracted</span>
              </div>

              {/* DevTools Log Stream */}
              <div className="p-4 space-y-2 text-xs font-mono">
                <div className="flex items-start gap-2 p-2 rounded bg-red-500/10 border border-red-500/20 text-red-300">
                  <span className="text-red-500 font-bold">✕</span>
                  <div className="flex-1 space-y-0.5">
                    <div className="font-semibold">Uncaught TypeError: Cannot read properties of undefined (reading &apos;token&apos;)</div>
                    <div className="text-[10px] text-slate-500">at CheckoutButton.tsx:42:18</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-800/80 text-[11px]">
                  <span className="text-red-400 font-bold">POST 500</span>
                  <span className="text-slate-400 truncate max-w-xs">/api/v1/checkout/process-payment</span>
                  <span className="text-slate-500">812ms</span>
                </div>

                <div className="flex items-center gap-2 pt-1 text-[10px] text-slate-500">
                  <span>Chrome 128</span>
                  <span>•</span>
                  <span>macOS 14.5</span>
                  <span>•</span>
                  <span>1920×1080 (Retina)</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Saving to Google Drive */}
          {currentStep === "saving" && (
            <div className="max-w-md mx-auto w-full bg-slate-900/90 rounded-xl border border-slate-800 p-6 space-y-4 shadow-2xl text-center animate-in fade-in zoom-in-95 duration-300">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center mx-auto text-blue-400">
                <IconFolder size={24} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-100">Syncing with your Google Drive</h4>
                <p className="text-xs text-slate-400 mt-1">Zero third-party servers. Stored under your drive.file permission.</p>
              </div>

              {/* Upload progress bars */}
              <div className="space-y-2 pt-2 text-left font-mono text-[11px]">
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>recording-checkout-error.webm</span>
                    <span className="text-emerald-400">100%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full w-full transition-all duration-1000" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>devtools-telemetry.json</span>
                    <span className="text-emerald-400">100%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full w-full transition-all duration-1000" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Instant Share Link */}
          {currentStep === "shared" && (
            <div className="max-w-md mx-auto w-full bg-slate-900/90 rounded-xl border border-emerald-500/40 p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                  <IconShare size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-100">Ready to Share</h4>
                  <p className="text-xs text-emerald-400 font-mono">Resolved with full context</p>
                </div>
              </div>

              {/* Share URL Box */}
              <div className="flex items-center gap-2 rounded-lg bg-slate-950 border border-slate-800 p-2.5">
                <span className="font-mono text-xs text-slate-300 truncate flex-1">
                  https://bugsnap.akusaraproject.my.id/v/8f921a
                </span>
                <span className="px-2.5 py-1 rounded bg-accent text-slate-950 font-bold text-[11px] shrink-0 shadow">
                  Copied!
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>✓ Interactive video</span>
                <span>✓ Console errors</span>
                <span>✓ Network HAR</span>
                <span>✓ 1-click Jira export</span>
              </div>
            </div>
          )}

        </div>

        {/* Bottom Timeline Stepper Bar */}
        <div className="relative z-10 px-4 sm:px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto">
            {STEPS.map((s, idx) => (
              <button
                key={s.key}
                type="button"
                onClick={() => {
                  setCurrentStepIndex(idx);
                  setIsPlaying(false);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] transition-colors shrink-0 ${
                  idx === currentStepIndex
                    ? "bg-slate-800 text-slate-100 font-bold border border-slate-700"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    idx === currentStepIndex ? "bg-accent" : "bg-slate-700"
                  }`}
                />
                <span>{s.label}</span>
              </button>
            ))}
          </div>

          <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
            Interactive Coded Simulation
          </span>
        </div>
      </div>
    </div>
  );
}
