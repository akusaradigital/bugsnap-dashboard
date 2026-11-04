"use client";

import { useEffect, useState, useMemo } from "react";
import { useT } from "@/components/I18nProvider";
import { Icon } from "@/lib/iconify";
import { useToast } from "@/components/Toast";
import { getAdminHeaders, getAdminCache, setAdminCache } from "@/lib/admin-cache";
import { Dropdown, type DropdownOption } from "@/components/Dropdown";
import type { ChangelogRelease, ChangelogItem } from "@/lib/changelog";

interface ProjectMeta {
  id: "dashboard" | "extension" | "mcp";
  label: string;
  repo: string;
  version: string;
  icon: string;
}

interface ChangelogApiResponse {
  raw: string;
  releases: ChangelogRelease[];
  projects: Array<{ id: "dashboard" | "extension" | "mcp"; label: string; repo: string; version: string }>;
  dates: string[];
}

const PROJECTS: ProjectMeta[] = [
  { id: "dashboard", label: "Dashboard", repo: "bugsnap-dashboard", version: "v0.14.0", icon: "lucide:layout-dashboard" },
  { id: "extension", label: "Extension", repo: "bugsnap-extension", version: "v1.0.72", icon: "lucide:puzzle" },
  { id: "mcp", label: "MCP Server", repo: "bugsnap-mcp", version: "v0.3.1", icon: "lucide:bot" },
];

export default function AdminChangelogPage() {
  const { t } = useT();
  const { showToast } = useToast();

  const cached = getAdminCache<ChangelogApiResponse>("admin_changelog_data");
  const [data, setData] = useState<ChangelogApiResponse | null>(cached);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);

  // Filters: Project and Date
  const [selectedProject, setSelectedProject] = useState<"all" | "dashboard" | "extension" | "mcp">("all");
  const [selectedDate, setSelectedDate] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"formatted" | "raw">("formatted");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadChangelog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadChangelog() {
    if (!cached) setLoading(true);
    setError(null);
    try {
      const headers = await getAdminHeaders();
      const res = await fetch("/api/admin/changelog", { headers });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memuat catatan changelog.");

      setData(json);
      setAdminCache("admin_changelog_data", json);
    } catch (err: unknown) {
      const msg = (err as Error)?.message || "Gagal memuat changelog";
      setError(msg);
      if (!cached) showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  }

  // Calculate project release counts
  const projectCounts = useMemo(() => {
    const counts = { all: 0, dashboard: 0, extension: 0, mcp: 0 };
    if (!data?.releases) return counts;
    counts.all = data.releases.length;
    for (const r of data.releases) {
      if (counts[r.project] !== undefined) {
        counts[r.project]++;
      }
    }
    return counts;
  }, [data?.releases]);

  // Available dates for dropdown based on currently selected project
  const dateOptions: DropdownOption[] = useMemo(() => {
    const list: DropdownOption[] = [
      { value: "all", label: t("admin.changelog.allDates") },
    ];
    if (!data?.releases) return list;

    const filtered =
      selectedProject === "all"
        ? data.releases
        : data.releases.filter((r) => r.project === selectedProject);

    const seenDates = new Set<string>();
    for (const r of filtered) {
      if (r.date && !seenDates.has(r.date)) {
        seenDates.add(r.date);
        const verTag = r.version ? ` (${r.version})` : "";
        list.push({
          value: r.date,
          label: `${r.date}${verTag}`,
        });
      }
    }
    return list;
  }, [data?.releases, selectedProject, t]);

  // Reset selectedDate if it's no longer in the dateOptions when project changes
  useEffect(() => {
    if (selectedDate !== "all") {
      const exists = dateOptions.some((opt) => opt.value === selectedDate);
      if (!exists) setSelectedDate("all");
    }
  }, [selectedProject, dateOptions, selectedDate]);

  // Filtered releases
  const displayedReleases = useMemo(() => {
    if (!data?.releases) return [];
    return data.releases.filter((r) => {
      // 1. Project filter
      if (selectedProject !== "all" && r.project !== selectedProject) return false;
      // 2. Date filter
      if (selectedDate !== "all" && r.date !== selectedDate) return false;
      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = r.rawTitle.toLowerCase().includes(q);
        const matchesProject = r.projectLabel.toLowerCase().includes(q);
        const matchesItems = r.items.some(
          (item) => item.text.toLowerCase().includes(q) || item.type.toLowerCase().includes(q)
        );
        return matchesTitle || matchesProject || matchesItems;
      }
      return true;
    });
  }, [data?.releases, selectedProject, selectedDate, searchQuery]);

  async function handleCopyMarkdown() {
    const textToCopy =
      viewMode === "raw" && data?.raw
        ? data.raw
        : displayedReleases.map((r) => `### ${r.rawTitle}\n${r.rawMarkdown}`).join("\n---\n\n");

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      showToast(t("admin.changelog.copied"), "success");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast("Failed to copy to clipboard", "error");
    }
  }

  function getBadgeClass(type: ChangelogItem["type"]) {
    switch (type) {
      case "feat":
        return "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40";
      case "fix":
        return "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800/40";
      case "perf":
        return "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800/40";
      case "docs":
        return "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/40";
      case "chore":
      default:
        return "bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700";
    }
  }

  function getBadgeLabel(type: ChangelogItem["type"]) {
    switch (type) {
      case "feat":
        return t("admin.changelog.tagFeat");
      case "fix":
        return t("admin.changelog.tagFix");
      case "perf":
        return t("admin.changelog.tagPerf");
      case "docs":
        return t("admin.changelog.tagDocs");
      case "chore":
      default:
        return t("admin.changelog.tagChore");
    }
  }

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center text-accent shrink-0">
              <Icon icon="lucide:file-text" className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {t("admin.changelog.title")}
              </h1>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                {t("admin.changelog.subtitle")}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadChangelog}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-semibold text-slate-700 dark:text-zinc-300 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Icon icon="lucide:refresh-cw" className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>{loading ? t("admin.refreshing") : t("admin.refreshMetrics")}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 text-xs text-rose-600 dark:text-rose-400 flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={loadChangelog}
            className="px-3 py-1 bg-rose-600 text-white rounded-lg font-semibold hover:bg-rose-700 cursor-pointer"
          >
            {t("error.tryAgain")}
          </button>
        </div>
      )}

      {/* TWO-COLUMN LAYOUT: LEFT SIDEBAR (PROJECTS + DATE) & RIGHT ADJACENT CHANGELOG */}
      <div className="flex flex-col lg:flex-row items-start gap-6">
        {/* LEFT COLUMN: PROJECT SELECTION & DATE DROPDOWN */}
        <aside className="w-full lg:w-72 xl:w-80 shrink-0 space-y-4">
          {/* Card 1: Project Selector */}
          <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                {t("admin.changelog.selectProject")}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">3 Repositories</span>
            </div>

            <div className="flex flex-col gap-1.5">
              {/* All Projects Tab */}
              <button
                type="button"
                onClick={() => setSelectedProject("all")}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer text-left ${
                  selectedProject === "all"
                    ? "bg-[#89BD49]/15 text-[#6B9A35] dark:text-[#A8D666] border border-[#89BD49]/30"
                    : "bg-slate-50 dark:bg-zinc-800/60 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon icon="lucide:layers" className="w-4 h-4 shrink-0" />
                  <span className="truncate">{t("admin.changelog.allProjects")}</span>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white/70 dark:bg-zinc-900/70 border border-slate-200 dark:border-zinc-700 shrink-0">
                  {projectCounts.all}
                </span>
              </button>

              {/* Individual Projects */}
              {PROJECTS.map((proj) => {
                const isActive = selectedProject === proj.id;
                return (
                  <button
                    key={proj.id}
                    type="button"
                    onClick={() => setSelectedProject(proj.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer text-left ${
                      isActive
                        ? "bg-[#89BD49]/15 text-[#6B9A35] dark:text-[#A8D666] border border-[#89BD49]/30"
                        : "bg-slate-50 dark:bg-zinc-800/60 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon icon={proj.icon} className="w-4 h-4 shrink-0 text-slate-600 dark:text-slate-400" />
                      <div className="min-w-0 truncate">
                        <span className="truncate block font-bold">{proj.label}</span>
                        <span className="text-[10px] text-slate-400 font-mono block leading-none mt-0.5">
                          {proj.version}
                        </span>
                      </div>
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white/70 dark:bg-zinc-900/70 border border-slate-200 dark:border-zinc-700 shrink-0">
                      {projectCounts[proj.id] || 0}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card 2: Date Dropdown Selector */}
          <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-1.5">
              <Icon icon="lucide:calendar" className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                {t("admin.changelog.dateFilter")}
              </label>
            </div>

            <Dropdown
              value={selectedDate}
              options={dateOptions}
              onChange={setSelectedDate}
              variant="field"
              placeholder={t("admin.changelog.allDates")}
            />

            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400 pt-1 border-t border-slate-100 dark:border-zinc-800/60">
              <span>{t("admin.changelog.totalReleases")}:</span>
              <span className="font-bold text-slate-800 dark:text-zinc-200">{displayedReleases.length}</span>
            </div>
          </div>

          {/* Card 3: Static Markdown Source Notice */}
          <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-950/40 p-3.5 text-xs space-y-2">
            <div className="flex items-center gap-2 text-slate-700 dark:text-zinc-300 font-semibold">
              <Icon icon="lucide:file-text" className="w-3.5 h-3.5 text-slate-500" />
              <span>CHANGELOG.md (Static)</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
              Read directly from the repository filesystem. Zero database writes or schema migrations required.
            </p>
            <div className="pt-2 border-t border-slate-200/60 dark:border-zinc-800/60 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">{t("admin.changelog.latestRelease")}:</span>
              <span className="font-mono font-semibold text-slate-700 dark:text-zinc-300">
                {data?.dates?.[0] || "2026-11-04"}
              </span>
            </div>
          </div>
        </aside>

        {/* RIGHT COLUMN: ADJACENT CHANGELOG CONTENT */}
        <section className="flex-1 min-w-0 w-full space-y-4">
          {/* Top Control Bar: Search + View Toggles + Copy */}
          <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-0">
              <Icon
                icon="lucide:search"
                className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("admin.changelog.searchPlaceholder")}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-[#89BD49] transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
                >
                  <Icon icon="lucide:x" className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Actions: View Toggle + Copy Button */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Formatted vs Raw View Toggle */}
              <div className="inline-flex rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800 p-0.5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setViewMode("formatted")}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    viewMode === "formatted"
                      ? "bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-2xs"
                      : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {t("admin.changelog.viewFormatted")}
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("raw")}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    viewMode === "raw"
                      ? "bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-2xs"
                      : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {t("admin.changelog.viewRaw")}
                </button>
              </div>

              {/* Copy Markdown Button */}
              <button
                type="button"
                onClick={handleCopyMarkdown}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-semibold text-slate-700 dark:text-zinc-300 transition-colors shadow-2xs cursor-pointer"
                title={t("admin.changelog.copyMarkdown")}
              >
                <Icon icon={copied ? "lucide:check" : "lucide:copy"} className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {copied ? t("admin.changelog.copied") : t("admin.changelog.copyMarkdown")}
                </span>
              </button>
            </div>
          </div>

          {/* VIEW: RAW MARKDOWN */}
          {viewMode === "raw" ? (
            <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-950 text-slate-100 p-4 shadow-sm overflow-x-auto">
              <pre className="font-mono text-xs leading-relaxed whitespace-pre font-normal break-words">
                {data?.raw || "No raw changelog content available."}
              </pre>
            </div>
          ) : (
            /* VIEW: FORMATTED RELEASES */
            <div className="space-y-4">
              {displayedReleases.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 text-center text-xs text-slate-500 dark:text-zinc-400 space-y-2">
                  <Icon icon="lucide:file-text" className="w-8 h-8 mx-auto text-slate-300 dark:text-zinc-700" />
                  <p>{t("admin.changelog.noEntries")}</p>
                </div>
              ) : (
                displayedReleases.map((rel) => {
                  const projMeta = PROJECTS.find((p) => p.id === rel.project);
                  return (
                    <article
                      key={rel.id}
                      className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden"
                    >
                      {/* Release Card Header */}
                      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/70 dark:bg-zinc-950/40 flex flex-wrap items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                          {/* Project Tag */}
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-800 dark:text-zinc-200 shadow-2xs">
                            <Icon icon={projMeta?.icon || "lucide:file-text"} className="w-3.5 h-3.5 text-accent" />
                            <span>{rel.projectLabel}</span>
                          </span>

                          {/* Version Tag */}
                          {rel.version && (
                            <span className="px-2 py-0.5 rounded-md font-mono text-[11px] font-bold bg-[#89BD49]/15 text-[#6B9A35] dark:text-[#A8D666] border border-[#89BD49]/30">
                              {rel.version}
                            </span>
                          )}

                          {/* Date Pill */}
                          {rel.date && (
                            <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-zinc-400">
                              <Icon icon="lucide:calendar" className="w-3 h-3" />
                              <span>{rel.date}</span>
                            </span>
                          )}
                        </div>

                        {/* Title text */}
                        <span className="text-[11px] font-mono text-slate-400 dark:text-zinc-500 hidden sm:inline">
                          {rel.rawTitle}
                        </span>
                      </div>

                      {/* Release Items List */}
                      <div className="p-4 sm:p-5 space-y-2.5">
                        {rel.items.length === 0 ? (
                          <div className="text-xs text-slate-500 dark:text-zinc-400 whitespace-pre-line">
                            {rel.rawMarkdown.trim()}
                          </div>
                        ) : (
                          <ul className="space-y-2.5">
                            {rel.items.map((item, idx) => (
                              <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-zinc-300 leading-relaxed">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border shrink-0 mt-0.5 ${getBadgeClass(
                                    item.type
                                  )}`}
                                >
                                  {getBadgeLabel(item.type)}
                                </span>
                                <span className="flex-1 min-w-0 break-words">{item.text}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
