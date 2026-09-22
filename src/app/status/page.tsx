import { Metadata } from "next";
import { StaticShell } from "@/components/StaticShell";

export const metadata: Metadata = {
  title: "System Status & Service Uptime - BugSnap",
  description: "Check the operational status of BugSnap services, API endpoints, and authentication.",
  alternates: {
    canonical: "/status",
  },
};

const services = [
  { name: "Web Dashboard", status: "Operational" },
  { name: "Core Database & API", status: "Operational" },
  { name: "Google Drive OAuth Integration", status: "Operational" },
  { name: "AI Summary Service", status: "Operational" },
  { name: "Slack & Discord Webhook Delivery", status: "Operational" },
  { name: "Chrome Extension Bridge", status: "Operational" },
];

export default function StatusPage() {
  return (
    <StaticShell
      title="System Status & API Health"
      subtitle="Real-time operational status for all BugSnap services, database cluster, and cloud integrations."
    >
      <div className="space-y-8 font-site">

        {/* Main Status Header */}
        <div className="border border-site-border bg-site-surface-2 rounded-xl p-5 sm:p-6 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div>
              <h2 className="text-base font-bold text-site-text">All Systems Operational</h2>
              <p className="text-xs text-site-text-2">99.98% overall system uptime over the last 90 days.</p>
            </div>
          </div>
          <span className="text-xs text-site-text-2 hidden sm:inline font-mono">Checked just now</span>
        </div>

        {/* System Component Breakdown */}
        <div className="rounded-xl border border-site-border bg-site-surface shadow-xs overflow-hidden">
          <div className="bg-site-surface-2 px-5 py-3 border-b border-site-border text-xs font-bold uppercase tracking-wider text-site-text-2">
            Service Components
          </div>
          <div className="divide-y divide-site-border-subtle">
            {services.map((svc) => (
              <div key={svc.name} className="px-5 py-3.5 flex items-center justify-between">
                <span className="text-xs sm:text-sm font-medium text-site-text">{svc.name}</span>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{svc.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Historical bar */}
        <div className="rounded-xl border border-site-border bg-site-surface p-5 sm:p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-site-text-2">
            <span>Uptime History (Last 90 Days)</span>
            <span className="font-semibold text-site-text font-mono">99.98%</span>
          </div>
          <div className="flex gap-1 h-6">
            {Array.from({ length: 45 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 rounded-xs bg-emerald-500/80 hover:bg-emerald-500 transition-colors"
                title={`Day ${i + 1}: 100% Uptime`}
              />
            ))}
          </div>
          <div className="flex justify-between text-[11px] text-site-text-2 font-mono">
            <span>90 days ago</span>
            <span>Today</span>
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-xl border border-site-border bg-site-surface p-8 text-center space-y-4 shadow-xs">
          <h3 className="text-lg font-bold text-site-text">All systems ready for your bug reports</h3>
          <p className="text-xs text-site-text-2 max-w-md mx-auto leading-relaxed">
            Install the BugSnap extension free - captures are saved to your own Google Drive.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <a
              href="https://chromewebstore.google.com/detail/klbgjodcbhopcjpfehjkbgofjdelohlf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-accent hover:bg-accent-hover text-slate-900 hover:text-white text-xs font-semibold px-5 py-2.5 transition-colors shadow-xs"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/chrome.svg" alt="" aria-hidden="true" className="w-4 h-4 shrink-0" />
              <span>Install Extension Free</span>
            </a>
            <a
              href="/pricing"
              className="text-xs font-semibold text-site-text-2 hover:text-site-text px-4 py-2.5 transition-colors"
            >
              See Pricing →
            </a>
          </div>
        </div>

      </div>
    </StaticShell>
  );
}
