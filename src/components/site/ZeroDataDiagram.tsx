"use client";

import React from "react";
import { IconCheck } from "./TablerIcons";

export interface ZeroDataDiagramProps {
  className?: string;
}

export function ZeroDataDiagram({ className = "" }: ZeroDataDiagramProps = {}) {
  return (
    <div className={`w-full max-w-2xl mx-auto ${className}`}>
      {/* Embedded CSS animations for flowing data lines */}
      <style>{`
        @keyframes zeroDataDashH {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: -16; }
        }
        @keyframes zeroDataDashV {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: -14; }
        }
        .animate-flow-dash-h {
          animation: zeroDataDashH 1.2s linear infinite;
        }
        .animate-flow-dash-v {
          animation: zeroDataDashV 1.2s linear infinite;
        }
      `}</style>

      {/* Outer Card Container */}
      <div className="rounded-2xl border border-site-border bg-site-surface/60 p-5 md:p-7 backdrop-blur-sm shadow-sm">
        {/* Header Badge & Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 border border-accent/30 text-accent font-medium text-xs tracking-tight mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span>Zero-Knowledge Architecture</span>
          </div>
          <h3 className="text-site-text font-semibold text-base md:text-lg">
            Direct-to-Drive Data Flow
          </h3>
          <p className="text-muted text-xs md:text-sm mt-0.5">
            Your screen captures never touch BugSnap servers
          </p>
        </div>

        {/* ========================================================= */}
        {/* DESKTOP LAYOUT (md+): 3 Nodes in a horizontal row        */}
        {/* ========================================================= */}
        <div className="hidden md:block">
          {/* Row of 3 Nodes + Interstitial Connectors */}
          <div className="flex items-stretch justify-between gap-2 relative">
            {/* NODE 1 - Your Browser */}
            <div className="flex-1 rounded-xl border border-site-border bg-site-surface p-4 text-center flex flex-col items-center justify-between min-h-[160px] shadow-sm transition-transform hover:-translate-y-0.5">
              <div className="w-full flex items-center justify-between text-[10px] text-muted font-mono mb-2">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  REC
                </span>
                <span>CLIENT</span>
              </div>

              {/* Browser Window SVG */}
              <div className="my-auto py-1">
                <svg
                  width="44"
                  height="36"
                  viewBox="0 0 44 36"
                  fill="none"
                  className="mx-auto"
                  aria-hidden="true"
                >
                  <rect
                    x="2"
                    y="2"
                    width="40"
                    height="32"
                    rx="5"
                    strokeWidth="1.75"
                    className="stroke-site-border"
                    fill="currentColor"
                    fillOpacity="0.03"
                  />
                  <line
                    x1="2"
                    y1="10"
                    x2="42"
                    y2="10"
                    strokeWidth="1.25"
                    className="stroke-site-border"
                  />
                  <circle cx="7" cy="6" r="1.5" className="fill-red-400" />
                  <circle cx="12" cy="6" r="1.5" className="fill-yellow-400" />
                  <circle cx="17" cy="6" r="1.5" className="fill-green-400" />
                  <rect
                    x="22"
                    y="4.5"
                    width="16"
                    height="3"
                    rx="1.5"
                    className="fill-site-border-subtle"
                  />
                  <rect
                    x="6"
                    y="14"
                    width="32"
                    height="16"
                    rx="3"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                    className="stroke-site-border-subtle"
                    fill="none"
                  />
                  <line
                    x1="10"
                    y1="19"
                    x2="24"
                    y2="19"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    className="stroke-site-text-2"
                  />
                  <line
                    x1="10"
                    y1="24"
                    x2="18"
                    y2="24"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    className="stroke-muted"
                  />
                </svg>
              </div>

              <div>
                <div className="text-site-text font-semibold text-sm">
                  Your Browser
                </div>
                <div className="text-muted text-xs mt-0.5 leading-snug">
                  Bug captured locally
                </div>
              </div>
            </div>

            {/* ARROW 1→2 (Direct OAuth Connector) */}
            <div className="w-20 lg:w-24 flex-shrink-0 flex flex-col items-center justify-center px-1">
              <div className="px-1.5 py-0.5 rounded-full bg-accent/10 border border-accent/30 text-accent font-medium text-[10px] tracking-tight whitespace-nowrap mb-1 flex items-center gap-1 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
                <span>Direct OAuth</span>
              </div>
              <svg
                width="100%"
                height="22"
                viewBox="0 0 88 22"
                fill="none"
                className="overflow-visible"
                aria-hidden="true"
              >
                {/* Background track */}
                <line
                  x1="0"
                  y1="11"
                  x2="80"
                  y2="11"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-site-border-subtle"
                />
                {/* Animated green dashed line */}
                <line
                  x1="0"
                  y1="11"
                  x2="80"
                  y2="11"
                  stroke="#89BD49"
                  strokeWidth="2"
                  strokeDasharray="6 4"
                  className="animate-flow-dash-h"
                />
                {/* Arrowhead */}
                <polygon points="76,6 86,11 76,16" fill="#89BD49" />
                {/* Moving dot */}
                <circle cy="11" r="3.5" fill="#89BD49">
                  <animate
                    attributeName="cx"
                    from="0"
                    to="80"
                    dur="1.8s"
                    repeatCount="indefinite"
                  />
                </circle>
              </svg>
              <span className="text-[9px] text-accent/80 font-mono tracking-tight mt-0.5">
                Video + Logs
              </span>
            </div>

            {/* NODE 2 - Google Drive (Hero Node) */}
            <div className="flex-1 rounded-xl border-2 border-accent/40 bg-accent/5 p-4 text-center flex flex-col items-center justify-between min-h-[160px] shadow-sm relative overflow-hidden transition-transform hover:-translate-y-0.5">
              <div className="w-full flex items-center justify-between text-[10px] text-accent font-mono mb-2">
                <span className="px-1.5 py-0.2 rounded bg-accent/15 border border-accent/20">
                  PRIMARY
                </span>
                <span>SECURE</span>
              </div>

              {/* Google Drive Logo (Accurate 3-Parallelogram Geometry) */}
              <div className="my-auto py-1">
                <svg
                  width="42"
                  height="36"
                  viewBox="0 0 86 75"
                  fill="none"
                  className="mx-auto drop-shadow-sm"
                  aria-label="Google Drive Logo"
                >
                  {/* Left Green */}
                  <path
                    d="M28.6 0L0 49.5l14.3 24.8L42.9 24.8z"
                    fill="#34A853"
                  />
                  {/* Top-Right Yellow */}
                  <path d="M57.1 0H28.6l28.5 49.5h28.6z" fill="#FBBC04" />
                  {/* Bottom Blue */}
                  <path d="M85.7 49.5H28.6l-14.3 24.8h57.1z" fill="#4285F4" />
                </svg>
              </div>

              <div>
                <div className="text-site-text font-semibold text-sm">
                  Your Google Drive
                </div>
                <div className="text-muted text-xs mt-0.5 leading-snug">
                  Files stored here - not BugSnap servers
                </div>
              </div>
            </div>

            {/* Zero Connection Visual Divider */}
            <div className="w-12 lg:w-16 flex-shrink-0 flex flex-col items-center justify-center text-center px-1">
              <div className="w-6 h-6 rounded-full border border-dashed border-site-border flex items-center justify-center text-muted/70">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="9" />
                  <line x1="5.7" y1="5.7" x2="18.3" y2="18.3" />
                </svg>
              </div>
              <span className="text-[9px] font-mono uppercase tracking-wider text-muted/80 mt-1 whitespace-nowrap">
                Zero Link
              </span>
            </div>

            {/* NODE 3 - BugSnap Server */}
            <div className="flex-1 rounded-xl border border-site-border bg-site-surface-2 p-4 text-center opacity-70 flex flex-col items-center justify-between min-h-[160px] shadow-sm transition-opacity hover:opacity-90">
              <div className="w-full flex items-center justify-between text-[10px] text-muted font-mono mb-2">
                <span>METADATA</span>
                <span>0 BYTES</span>
              </div>

              {/* Database / Server Cylinder SVG */}
              <div className="my-auto py-1">
                <svg
                  width="40"
                  height="36"
                  viewBox="0 0 36 36"
                  fill="none"
                  stroke="currentColor"
                  className="mx-auto text-site-text-2"
                  aria-hidden="true"
                >
                  <ellipse
                    cx="18"
                    cy="8"
                    rx="12"
                    ry="4.5"
                    strokeWidth="1.75"
                    className="stroke-site-border"
                    fill="currentColor"
                    fillOpacity="0.06"
                  />
                  <path
                    d="M6 8v7c0 2.5 5.4 4.5 12 4.5s12-2 12-4.5V8"
                    strokeWidth="1.75"
                    className="stroke-site-border"
                  />
                  <path
                    d="M6 15v7c0 2.5 5.4 4.5 12 4.5s12-2 12-4.5v-7"
                    strokeWidth="1.75"
                    className="stroke-site-border"
                  />
                  <circle cx="23" cy="19.5" r="1.2" className="fill-accent" />
                  <circle
                    cx="26"
                    cy="19.5"
                    r="1.2"
                    className="fill-site-border"
                  />
                  <circle cx="23" cy="12.5" r="1.2" className="fill-accent" />
                  <circle
                    cx="26"
                    cy="12.5"
                    r="1.2"
                    className="fill-site-border"
                  />
                </svg>
              </div>

              <div>
                <div className="text-site-text font-semibold text-sm">
                  BugSnap Server
                </div>
                <div className="text-muted text-xs mt-0.5 leading-snug">
                  Stores: title, tags, share links - zero bytes of your files
                </div>
              </div>
            </div>
          </div>

          {/* ARROW 1→3 (Secondary, Below) - Dotted path from Browser to BugSnap Server */}
          <div className="relative mt-2 h-14">
            <svg
              className="w-full h-full overflow-visible"
              viewBox="0 0 600 50"
              preserveAspectRatio="none"
              fill="none"
              aria-hidden="true"
            >
              {/* Path curving down from Node 1, sweeping under Node 2, and up into Node 3 */}
              <path
                d="M 85 0 v 18 q 0 16 16 16 h 398 q 16 0 16 -16 v -10"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                className="text-site-border"
              />
              {/* Arrowhead pointing up into BugSnap Server */}
              <polygon
                points="511,10 515,2 519,10"
                fill="currentColor"
                className="text-site-border"
              />
            </svg>

            {/* Centered Label along the curved path */}
            <div className="absolute inset-x-0 bottom-1 flex justify-center pointer-events-none">
              <span className="px-2.5 py-0.5 rounded-full bg-site-surface border border-site-border-subtle text-muted text-[11px] font-medium shadow-xs">
                Metadata only <span className="opacity-75">(no file data)</span>
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* MOBILE LAYOUT (< md): Vertically Stacked Nodes            */}
        {/* ========================================================= */}
        <div className="md:hidden flex flex-col items-stretch space-y-2">
          {/* NODE 1 - Your Browser */}
          <div className="rounded-xl border border-site-border bg-site-surface p-4 text-center shadow-sm">
            <div className="flex items-center justify-center gap-1.5 text-xs text-muted mb-2 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span>RECORDING LOCALLY</span>
            </div>
            <div className="text-site-text font-semibold text-sm">
              Your Browser
            </div>
            <div className="text-muted text-xs mt-0.5">
              Bug captured locally
            </div>
          </div>

          {/* ARROW 1→2 (Vertical Direct OAuth) */}
          <div className="flex flex-col items-center py-1">
            <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-accent/10 border border-accent/30 text-accent font-medium text-[11px] mb-1 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
              <span>Direct OAuth</span>
            </div>
            <svg
              width="20"
              height="34"
              viewBox="0 0 20 34"
              fill="none"
              aria-hidden="true"
            >
              <line
                x1="10"
                y1="0"
                x2="10"
                y2="26"
                stroke="#89BD49"
                strokeWidth="2"
                strokeDasharray="4 3"
                className="animate-flow-dash-v"
              />
              <polygon points="6,24 10,32 14,24" fill="#89BD49" />
              <circle cx="10" r="3" fill="#89BD49">
                <animate
                  attributeName="cy"
                  from="0"
                  to="26"
                  dur="1.5s"
                  repeatCount="indefinite"
                />
              </circle>
            </svg>
            <span className="text-[10px] text-accent/80 font-mono mt-0.5">
              Video & DevLogs
            </span>
          </div>

          {/* NODE 2 - Google Drive (Hero Node) */}
          <div className="rounded-xl border-2 border-accent/40 bg-accent/5 p-4 text-center shadow-sm relative">
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-accent/15 text-accent text-[10px] font-mono mb-2">
              <span>CUSTOMER STORAGE</span>
            </div>
            <div className="text-site-text font-semibold text-sm">
              Your Google Drive
            </div>
            <div className="text-muted text-xs mt-0.5">
              Files stored here - not BugSnap servers
            </div>
          </div>

          {/* ARROW 1→3 (Vertical Metadata Only) */}
          <div className="flex flex-col items-center py-1">
            <div className="px-2.5 py-0.5 rounded-full bg-site-surface-2 border border-site-border-subtle text-muted text-[10px] font-medium mb-1">
              Metadata only (no file data)
            </div>
            <svg
              width="20"
              height="30"
              viewBox="0 0 20 30"
              fill="none"
              aria-hidden="true"
            >
              <line
                x1="10"
                y1="0"
                x2="10"
                y2="22"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeDasharray="3 3"
                className="text-site-border"
              />
              <polygon
                points="6,20 10,28 14,20"
                fill="currentColor"
                className="text-site-border"
              />
            </svg>
          </div>

          {/* NODE 3 - BugSnap Server */}
          <div className="rounded-xl border border-site-border bg-site-surface-2 p-4 text-center opacity-70 shadow-sm">
            <div className="text-[10px] text-muted font-mono mb-1">
              ZERO BYTES OF YOUR FILES
            </div>
            <div className="text-site-text font-semibold text-sm">
              BugSnap Server
            </div>
            <div className="text-muted text-xs mt-0.5">
              Stores: title, tags, share links - zero bytes of your files
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* KEY / LEGEND ROW                                          */}
        {/* ========================================================= */}
        <div className="mt-6 pt-5 border-t border-site-border/60 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-site-text-2">
          <div className="flex items-start gap-2">
            <IconCheck
              size={16}
              strokeWidth={2.5}
              className="text-accent flex-shrink-0 mt-0.5"
            />
            <span className="leading-tight">
              Your recordings:{" "}
              <strong className="text-site-text">Google Drive only</strong>
            </span>
          </div>
          <div className="flex items-start gap-2">
            <IconCheck
              size={16}
              strokeWidth={2.5}
              className="text-accent flex-shrink-0 mt-0.5"
            />
            <span className="leading-tight">
              BugSnap stores:{" "}
              <strong className="text-site-text">
                metadata, links, workspace info
              </strong>
            </span>
          </div>
          <div className="flex items-start gap-2">
            <IconCheck
              size={16}
              strokeWidth={2.5}
              className="text-accent flex-shrink-0 mt-0.5"
            />
            <span className="leading-tight">
              Your data is{" "}
              <strong className="text-site-text">never processed</strong> on
              BugSnap infrastructure
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
