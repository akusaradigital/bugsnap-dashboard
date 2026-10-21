"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@/lib/iconify";
import { supabase } from "@/lib/supabase";
import { useT } from "@/components/I18nProvider";
import { fetchDriveStatus } from "@/lib/google-drive-values";

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
  // Check if it's an exact integer or close to it (e.g. 2 TB, 15 GB, 100 GB)
  const isInteger = Math.abs(val - Math.round(val)) < 0.05;
  const decimals = isInteger || i === 0 ? 0 : 1;
  return `${val.toFixed(decimals)} ${units[i]}`;
}

export default function DriveStorageMeter() {
  const { t } = useT();
  const [data, setData] = useState<DriveStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadQuota() {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        const currentUserId = sessionData.session?.user?.id;
        if (!token) return;

        const cached = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("bs_drive_quota") : null;
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (Date.now() - parsed.timestamp < 180000 && parsed.userId === currentUserId) { // 3 min cache & same user
              setData(parsed.data);
              setLoading(false);
              return;
            }
          } catch {}
        }

        const json = (await fetchDriveStatus(token)) as DriveStatusResponse | null;
        if (!json) return;
        if (active) {
          setData(json);
          try {
            sessionStorage.setItem(
              "bs_drive_quota",
              JSON.stringify({ timestamp: Date.now(), data: json, userId: currentUserId })
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
    : "bg-[#89BD49]";

  return (
    <div className="p-3 mx-2 mb-2 rounded-xl border border-border bg-subtle shadow-xs space-y-2 text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-medium text-foreground">
          <Icon icon="lucide:cloud" className="w-3.5 h-3.5 text-muted shrink-0" />
          <span className="text-[11px]">{t("drive.storage")}</span>
        </div>
        <span
          className={`text-[10px] font-semibold tabular-nums ${
            isNearlyFull
              ? "text-red-600 dark:text-red-400 font-bold"
              : isWarning
              ? "text-amber-600 dark:text-amber-400"
              : "text-muted"
          }`}
        >
          {pct < 0.1 && pct > 0 ? "< 0.1%" : `${pct.toFixed(pct < 10 ? 1 : 0)}%`}
        </span>
      </div>

      <div className="h-1.5 rounded-full bg-border overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{
            width: used > 0 ? `${Math.max(pct, 1.2)}%` : "0%",
            minWidth: used > 0 ? "4px" : "0",
          }}
        />
      </div>

      <div className="flex items-center justify-between text-[10px] text-muted min-w-0">
        <span className="truncate min-w-0">
          {t("drive.storageUsed", { used: formatBytes(used), total: formatBytes(total) })}
        </span>
        <Link
          href="/settings"
          className="text-[#6B9A35] dark:text-[#A8D666] hover:underline font-medium shrink-0 ml-1"
        >
          {t("drive.manage")}
        </Link>
      </div>

      {isNearlyFull && (
        <div className="pt-0.5 flex items-start gap-1 text-[10px] text-red-600 dark:text-red-400 font-medium leading-tight">
          <Icon icon="lucide:alert-triangle" className="w-3 h-3 shrink-0 mt-0.5" />
          <span>{t("drive.almostFull")}</span>
        </div>
      )}
    </div>
  );
}
