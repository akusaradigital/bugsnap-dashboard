"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface DriveQuota {
  usedBytes: number | null;
  totalBytes: number | null;
}

interface DriveStatusResponse {
  connected: boolean;
  status: "connected" | "reconnect_required" | "not_connected";
  quota: DriveQuota | null;
}

function formatBytes(bytes: number | null): string {
  if (!Number.isFinite(bytes) || bytes == null || bytes < 0) return "-";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let val = bytes;
  let i = 0;
  while (val >= 1024 && i < units.length - 1) {
    val /= 1024;
    i++;
  }
  const decimals = val >= 100 || i === 0 ? 0 : 1;
  return `${val.toFixed(decimals)} ${units[i]}`;
}

export default function DriveStorageMeter() {
  const [data, setData] = useState<DriveStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadQuota() {
      try {
        const cached = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("bs_drive_quota") : null;
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (Date.now() - parsed.timestamp < 180000) { // 3 min cache
              setData(parsed.data);
              setLoading(false);
              return;
            }
          } catch {}
        }

        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) return;

        const res = await fetch("/api/google-drive/status", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const json: DriveStatusResponse = await res.json();
        if (active) {
          setData(json);
          try {
            sessionStorage.setItem(
              "bs_drive_quota",
              JSON.stringify({ timestamp: Date.now(), data: json })
            );
          } catch {}
        }
      } catch (err) {
        console.warn("DriveStorageMeter: failed to load quota", err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadQuota();
    return () => {
      active = false;
    };
  }, []);

  if (loading || !data || !data.connected || !data.quota?.totalBytes) {
    return null;
  }

  const { usedBytes, totalBytes } = data.quota;
  const used = usedBytes ?? 0;
  const total = totalBytes ?? 1;
  const pct = Math.max(0, Math.min(100, (used / total) * 100));

  const isNearlyFull = pct >= 90;
  const isWarning = pct >= 75 && !isNearlyFull;

  const barColor = isNearlyFull
    ? "bg-red-500 dark:bg-red-400"
    : isWarning
    ? "bg-amber-500 dark:bg-amber-400"
    : "bg-indigo-600 dark:bg-indigo-500";

  return (
    <div className="p-3 mx-2 mb-2 rounded-xl border border-border bg-subtle/40 space-y-2 text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-medium text-foreground">
          <svg className="w-3.5 h-3.5 text-muted" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
          </svg>
          <span className="text-[11px]">Drive Storage</span>
        </div>
        <span className={`text-[10px] font-semibold tabular-nums ${isNearlyFull ? "text-red-600 dark:text-red-400 font-bold" : isWarning ? "text-amber-600 dark:text-amber-400" : "text-muted"}`}>
          {pct.toFixed(pct < 1 ? 1 : 0)}%
        </span>
      </div>

      <div className="h-1.5 rounded-full bg-border overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-300 ${barColor}`} style={{ width: `${pct}%` }} />
      </div>

      <div className="flex items-center justify-between text-[10px] text-muted">
        <span className="truncate">{formatBytes(used)} of {formatBytes(total)}</span>
        <Link href="/settings" className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium shrink-0 ml-1">
          Manage
        </Link>
      </div>

      {isNearlyFull && (
        <div className="pt-0.5 flex items-start gap-1 text-[10px] text-red-600 dark:text-red-400 font-medium leading-tight">
          <svg className="w-3 h-3 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>Almost full. Delete old captures to keep recording.</span>
        </div>
      )}
    </div>
  );
}
