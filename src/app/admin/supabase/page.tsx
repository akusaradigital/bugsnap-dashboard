"use client";

import { useEffect, useState, useMemo } from "react";
import { useToast } from "@/components/Toast";
import { useT } from "@/components/I18nProvider";
import { getAdminHeaders, getAdminCache, setAdminCache } from "@/lib/admin-cache";

interface TableStat {
  schema_name: string;
  table_name: string;
  live_rows: number;
  dead_rows: number;
  total_bytes: number;
  total_size: string;
  data_size: string;
  index_size: string;
  last_vacuum: string | null;
  last_autovacuum: string | null;
  last_analyze: string | null;
  last_autoanalyze: string | null;
}

interface DatabaseStats {
  database_name: string;
  version: string;
  uptime: string;
  total_bytes: number;
  total_size_pretty: string;
  quota_bytes: number;
  quota_pretty: string;
  used_percent: number;
  free_bytes: number;
  free_size_pretty: string;
  connections: {
    max: number;
    total: number;
    active: number;
    idle: number;
    used_percent: number;
  };
  performance: {
    cache_hit_ratio: number;
    index_hit_ratio: number;
  };
  captures: {
    total_captures: number;
    drive_backed: number;
    total_views_counter: number;
    storage_bytes: number;
  };
  tables: TableStat[];
}

interface ProjectMetadata {
  id: string;
  name: string;
  region: string;
  status: string;
  createdAt?: string;
  database?: {
    host?: string;
    version?: string;
    postgresEngine?: string;
  };
}

export default function AdminSupabasePage() {
  const { showToast } = useToast();
  const { t } = useT();

  const cachedStats = getAdminCache<DatabaseStats>("admin_supabase_stats");
  const cachedProject = getAdminCache<ProjectMetadata>("admin_supabase_project");

  const [stats, setStats] = useState<DatabaseStats | null>(cachedStats || null);
  const [project, setProject] = useState<ProjectMetadata | null>(cachedProject || null);
  const [loading, setLoading] = useState(!cachedStats);
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);
  const [maintenanceLoading, setMaintenanceLoading] = useState<string | null>(null);

  // Table filters
  const [searchQuery, setSearchQuery] = useState("");
  const [schemaFilter, setSchemaFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"size" | "live_rows" | "dead_rows">("size");

  useEffect(() => {
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadStats() {
    setLoading(true);
    try {
      const headers = await getAdminHeaders();
      const res = await fetch("/api/admin/supabase-stats", { headers });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memuat statistik database.");

      setStats(json.stats);
      setProject(json.project);
      setAdminCache("admin_supabase_stats", json.stats);
      setAdminCache("admin_supabase_project", json.project);
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (err: unknown) {
      const msg = (err as Error)?.message || "Gagal memuat statistik Supabase";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleMaintenance(action: "vacuum" | "prune_views" | "prune_rate_limits") {
    setMaintenanceLoading(action);
    try {
      const headers = await getAdminHeaders();
      const res = await fetch("/api/admin/supabase-stats", {
        method: "POST",
        headers,
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal mengeksekusi pemeliharaan.");

      showToast(json.message || "Pemeliharaan berhasil dijalankan.", "success");
      await loadStats();
    } catch (err: unknown) {
      const msg = (err as Error)?.message || "Gagal mengeksekusi tindakan pemeliharaan";
      showToast(msg, "error");
    } finally {
      setMaintenanceLoading(null);
    }
  }

  const filteredTables = useMemo(() => {
    if (!stats?.tables) return [];
    let list = [...stats.tables];

    if (schemaFilter !== "all") {
      list = list.filter((t) => t.schema_name === schemaFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((t) => t.table_name.toLowerCase().includes(q));
    }

    list.sort((a, b) => {
      if (sortBy === "size") return b.total_bytes - a.total_bytes;
      if (sortBy === "live_rows") return b.live_rows - a.live_rows;
      if (sortBy === "dead_rows") return b.dead_rows - a.dead_rows;
      return 0;
    });

    return list;
  }, [stats?.tables, schemaFilter, searchQuery, sortBy]);

  const uniqueSchemas = useMemo(() => {
    if (!stats?.tables) return [];
    return Array.from(new Set(stats.tables.map((t) => t.schema_name)));
  }, [stats?.tables]);

  const usedPercent = stats?.used_percent ?? 0;
  const storageColor =
    usedPercent >= 80
      ? "bg-rose-500 text-rose-600"
      : usedPercent >= 60
      ? "bg-amber-500 text-amber-600"
      : "bg-emerald-500 text-emerald-600";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {t("admin.supabase.title")}
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {project?.status || "ACTIVE_HEALTHY"}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted">
            {t("admin.supabase.subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {lastRefreshed && (
            <span className="text-xs text-muted">
              {lastRefreshed}
            </span>
          )}
          <button
            onClick={loadStats}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2 text-xs font-medium text-foreground transition-colors hover:bg-subtle disabled:opacity-50"
          >
            <span className={loading ? "animate-spin" : ""}>🔄</span>
            {t("admin.supabase.refresh")}
          </button>
        </div>
      </div>

      {/* Cluster Meta Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted">{t("admin.supabase.status")}</p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {project?.name || "bugsnap-db"} ({project?.id || "kkmvanwgywrqsudvspge"})
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted">{t("admin.supabase.region")}</p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {project?.region || "ap-southeast-1"} (Singapore)
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted">{t("admin.supabase.engine")}</p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            PostgreSQL {project?.database?.postgresEngine || "17"}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted">{t("admin.supabase.uptime")}</p>
          <p className="mt-1 text-sm font-semibold text-foreground truncate" title={stats?.uptime}>
            {stats?.uptime ? stats.uptime.split(".")[0] : "Active"}
          </p>
        </div>
      </div>

      {/* 4 Core Vital Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Storage Quota */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              {t("admin.supabase.diskUsage")}
            </span>
            <span className="rounded bg-indigo-500/10 px-2 py-0.5 text-xs font-bold text-indigo-600 dark:text-indigo-400">
              {stats?.total_size_pretty || "0 MB"} / {stats?.quota_pretty || "500 MB"}
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
              {usedPercent.toFixed(1)}%
            </span>
            <span className="text-xs font-medium text-muted">
              {t("admin.supabase.used")}
            </span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-subtle">
            <div
              className={`h-full transition-all duration-500 ${storageColor.split(" ")[0]}`}
              style={{ width: `${Math.min(100, Math.max(2, usedPercent))}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-muted">
            {stats?.free_size_pretty || "0 MB"} {t("admin.supabase.free")} ({100 - usedPercent > 0 ? (100 - usedPercent).toFixed(1) : 0}% available)
          </p>
        </div>

        {/* Connection Pool */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              {t("admin.supabase.connPool")}
            </span>
            <span className="rounded bg-blue-500/10 px-2 py-0.5 text-xs font-bold text-blue-600 dark:text-blue-400">
              {stats?.connections.total || 0} / {stats?.connections.max || 60}
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
              {stats?.connections.used_percent || 0}%
            </span>
            <span className="text-xs font-medium text-muted">
              Pool usage
            </span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-subtle">
            <div
              className="h-full bg-blue-500 transition-all duration-500"
              style={{ width: `${Math.min(100, stats?.connections.used_percent || 0)}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-muted">
            {stats?.connections.active || 0} {t("admin.supabase.connActive")} • {stats?.connections.idle || 0} {t("admin.supabase.connIdle")}
          </p>
        </div>

        {/* Memory & Cache Hit Ratio */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              {t("admin.supabase.cacheHit")}
            </span>
            <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {t("admin.supabase.optimal")}
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
              {stats?.performance.cache_hit_ratio ?? 100}%
            </span>
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              ⚡ RAM Cache
            </span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-subtle">
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${Math.min(100, stats?.performance.cache_hit_ratio || 100)}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-muted">
            {t("admin.supabase.indexHit")}: {stats?.performance.index_hit_ratio ?? 100}%
          </p>
        </div>

        {/* Zero-Load Architecture */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              {t("admin.supabase.zeroLoadTitle")}
            </span>
            <span className="rounded bg-purple-500/10 px-2 py-0.5 text-xs font-bold text-purple-600 dark:text-purple-400">
              Drive 100%
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
              {stats?.captures.drive_backed || 0}
            </span>
            <span className="text-xs font-medium text-muted">
              / {stats?.captures.total_captures || 0} captures
            </span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-subtle">
            <div
              className="h-full bg-purple-500 transition-all duration-500"
              style={{
                width: `${
                  stats?.captures.total_captures
                    ? Math.round((stats.captures.drive_backed / stats.captures.total_captures) * 100)
                    : 100
                }%`,
              }}
            />
          </div>
          <p className="mt-2 text-[11px] text-muted">
            {stats?.captures.total_views_counter || 0} {t("admin.supabase.viewsCounter")}
          </p>
        </div>
      </div>

      {/* Database Maintenance Tools */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-foreground">
              {t("admin.supabase.maintenance")}
            </h2>
            <p className="text-xs text-muted">
              {t("admin.supabase.runVacuumDesc")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleMaintenance("vacuum")}
              disabled={Boolean(maintenanceLoading)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
            >
              {maintenanceLoading === "vacuum" ? (
                <span className="animate-spin">🔄</span>
              ) : (
                <span>🧹</span>
              )}
              {t("admin.supabase.runVacuum")}
            </button>
            <button
              onClick={() => handleMaintenance("prune_views")}
              disabled={Boolean(maintenanceLoading)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-subtle px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-border/60 disabled:opacity-50"
            >
              {maintenanceLoading === "prune_views" ? (
                <span className="animate-spin">🔄</span>
              ) : (
                <span>✂️</span>
              )}
              {t("admin.supabase.pruneViews")}
            </button>
          </div>
        </div>
      </div>

      {/* Table-by-Table Granular Breakdown */}
      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-bold text-foreground">
              {t("admin.supabase.tableBreakdown")}
            </h3>
            <p className="text-xs text-muted">
              {filteredTables.length} tabel terdaftar di PostgreSQL
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <input
              type="text"
              placeholder={t("admin.supabase.searchTables")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted focus:border-indigo-500 focus:outline-none"
            />

            {/* Schema Filter */}
            <select
              value={schemaFilter}
              onChange={(e) => setSchemaFilter(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:border-indigo-500 focus:outline-none"
            >
              <option value="all">All Schemas</option>
              {uniqueSchemas.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            {/* Sort by */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "size" | "live_rows" | "dead_rows")}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:border-indigo-500 focus:outline-none"
            >
              <option value="size">Sort: Ukuran Total</option>
              <option value="live_rows">Sort: Baris Aktif</option>
              <option value="dead_rows">Sort: Dead Tuples</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-subtle/50 text-[11px] font-semibold uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3">{t("admin.supabase.tableName")}</th>
                <th className="px-4 py-3">{t("admin.supabase.liveRows")}</th>
                <th className="px-4 py-3">{t("admin.supabase.deadRows")}</th>
                <th className="px-4 py-3">{t("admin.supabase.dataSize")}</th>
                <th className="px-4 py-3">{t("admin.supabase.indexSize")}</th>
                <th className="px-4 py-3">{t("admin.supabase.totalSize")}</th>
                <th className="px-4 py-3">{t("admin.supabase.lastVacuum")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredTables.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted">
                    Tidak ada tabel yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                filteredTables.map((table) => {
                  const hasDeadTuples = table.dead_rows > 10;
                  return (
                    <tr key={`${table.schema_name}.${table.table_name}`} className="hover:bg-subtle/40">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold ${
                              table.schema_name === "public"
                                ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                                : table.schema_name === "auth"
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                : "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400"
                            }`}
                          >
                            {table.schema_name}
                          </span>
                          <span className="font-semibold text-foreground">
                            {table.table_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono tabular-nums text-foreground">
                        {table.live_rows.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-mono tabular-nums">
                        {hasDeadTuples ? (
                          <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 px-1.5 py-0.5 font-semibold text-rose-600 dark:text-rose-400">
                            ⚠️ {table.dead_rows}
                          </span>
                        ) : (
                          <span className="text-muted">{table.dead_rows}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono tabular-nums text-muted">
                        {table.data_size}
                      </td>
                      <td className="px-4 py-3 font-mono tabular-nums text-muted">
                        {table.index_size}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold tabular-nums text-foreground">
                        {table.total_size}
                      </td>
                      <td className="px-4 py-3 text-[11px] text-muted">
                        {table.last_vacuum
                          ? new Date(table.last_vacuum).toLocaleDateString()
                          : table.last_autovacuum
                          ? `auto: ${new Date(table.last_autovacuum).toLocaleDateString()}`
                          : "-"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
