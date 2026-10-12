"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useT } from "@/components/I18nProvider";
import { timeAgo } from "@/lib/capture-utils";

type RawTopError = {
  id: string;
  title: string;
  type: string;
  drive_url: string;
  created_at: string;
  site_url: string;
  error_fingerprint: string;
  occurrences: number | string;
  last_seen: string;
  affected_users?: number | string | null;
};

type ErrorGroupRow = {
  id: string;
  title: string;
  type: string;
  drive_url: string;
  created_at: string;
  site_url: string;
  error_fingerprint: string;
  occurrences: number;
  last_seen: string;
  affected_users?: number | null;
};

type CaptureRow = {
  id: string;
  title: string;
  type: string;
  drive_url: string;
  created_at: string;
  site_url: string;
  owner_email: string;
};

function ErrorsContent() {
  const { t } = useT();
  const searchParams = useSearchParams();
  const wsParam = searchParams.get("ws");
  const [workspaceId, setWorkspaceId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [errorGroups, setErrorGroups] = useState<ErrorGroupRow[] | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [groupCaptures, setGroupCaptures] = useState<Record<string, CaptureRow[]>>({});
  const [groupLoading, setGroupLoading] = useState<Record<string, boolean>>({});

  // Resolve workspace ID: use ws URL param, fallback to first available workspace
  useEffect(() => {
    let cancelled = false;
    if (wsParam && wsParam !== "all") {
      setWorkspaceId(wsParam);
      return;
    }
    supabase.rpc("get_my_workspaces").then(({ data }) => {
      if (cancelled) return;
      if (data && Array.isArray(data) && data.length > 0) {
        setWorkspaceId(data[0].id);
      } else {
        setWorkspaceId("");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [wsParam]);

  // Load top errors when workspace resolves
  useEffect(() => {
    if (!workspaceId) {
      if (wsParam === "all" || !wsParam) setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    supabase
      .rpc("get_workspace_top_errors", { p_workspace_id: workspaceId, p_limit: 50 })
      .then(({ data, error }) => {
        if (cancelled) return;
        setLoading(false);
        if (error || !Array.isArray(data)) {
          setErrorGroups([]);
          return;
        }
        setErrorGroups(
          data.map((row: RawTopError) => ({
            ...row,
            occurrences: Number(row.occurrences) || 0,
            affected_users: row.affected_users ? Number(row.affected_users) : null,
          }))
        );
      });
    return () => {
      cancelled = true;
    };
    // wsParam is read in the empty-workspaceId guard above (to stop the
    // spinner when there is truly nothing to query); without it here, a user
    // with zero workspaces who changes the ws query param while workspaceId
    // stays empty could leave `loading` stuck, since this effect would then
    // only ever re-run on a workspaceId change that never comes.
  }, [workspaceId, wsParam]);

  const toggleExpand = (fingerprint: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(fingerprint)) {
        next.delete(fingerprint);
      } else {
        next.add(fingerprint);
        // Load occurrences for this fingerprint if not loaded
        if (!groupCaptures[fingerprint] && !groupLoading[fingerprint]) {
          setGroupLoading((l) => ({ ...l, [fingerprint]: true }));
          supabase
            .rpc("get_captures_by_fingerprint", {
              p_workspace_id: workspaceId,
              p_fingerprint: fingerprint,
              p_limit: 50,
            })
            .then(({ data, error }) => {
              setGroupLoading((l) => ({ ...l, [fingerprint]: false }));
              if (!error && Array.isArray(data)) {
                setGroupCaptures((prevCaps) => ({
                  ...prevCaps,
                  [fingerprint]: data as CaptureRow[],
                }));
              }
            });
        }
      }
      return next;
    });
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background overflow-y-auto">
      <div className="px-4 py-8 sm:px-8 max-w-[1600px] mx-auto w-full">
        <h1 className="text-2xl font-bold tracking-tight text-foreground mb-6 sm:mb-8">
          {t("errors.title")}
        </h1>

        {loading ? (
          <div className="p-12 text-center text-sm text-muted">
            {t("errors.loading")}
          </div>
        ) : errorGroups === null || errorGroups.length === 0 ? (
          <div className="rounded-xl border border-border bg-subtle p-12 text-center flex flex-col items-center justify-center">
            <svg
              className="w-12 h-12 text-muted/50 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm font-medium text-foreground">
              {t("errors.empty")}
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-white dark:bg-subtle divide-y divide-border overflow-hidden shadow-xs">
            {errorGroups.map((group) => {
              const isExpanded = expandedGroups.has(group.error_fingerprint);
              const occurrences = groupCaptures[group.error_fingerprint];
              const isLoading = groupLoading[group.error_fingerprint];

              return (
                <div key={group.error_fingerprint} className="flex flex-col">
                  {/* Group Header Row */}
                  <div
                    onClick={() => toggleExpand(group.error_fingerprint)}
                    className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-subtle/80 transition-colors"
                  >
                    <div className="shrink-0 pt-0.5">
                      <svg
                        className={`w-4 h-4 text-muted transition-transform ${isExpanded ? "rotate-90" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                        <h3 className="text-sm font-semibold text-foreground truncate max-w-full">
                          {group.title || t("errors.unknownTitle")}
                        </h3>
                        {group.site_url && (
                          <span className="text-[11px] text-muted truncate max-w-full break-all">
                            {(() => {
                              try {
                                return new URL(group.site_url).hostname;
                              } catch {
                                return group.site_url;
                              }
                            })()}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-1 min-w-0">
                        <span className="inline-flex max-w-full min-w-0 items-center gap-1 rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400">
                          <svg className="h-3 w-3 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                          </svg>
                          <span className="truncate">
                            {group.affected_users
                              ? t("errors.occurrencesWithUsers", { count: group.occurrences, users: group.affected_users })
                              : t("errors.occurrences", { count: group.occurrences })}
                          </span>
                        </span>

                        <span className="text-[10px] font-mono text-muted/70 bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded shrink-0">
                          {group.error_fingerprint}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 text-[11px] text-muted hidden sm:block">
                      {timeAgo(group.last_seen, t)}
                    </div>
                  </div>

                  {/* Expanded Occurrences List */}
                  {isExpanded && (
                    <div className="bg-slate-50/50 dark:bg-black/10 border-t border-border p-3 sm:p-4 pl-9 sm:pl-11">
                      {isLoading ? (
                        <div className="text-xs text-muted py-2">{t("errors.loading")}</div>
                      ) : !occurrences || occurrences.length === 0 ? (
                        <div className="text-xs text-muted py-2">{t("errors.failed")}</div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {occurrences.map((cap) => (
                            <Link
                              key={cap.id}
                              href={`/v/${cap.id}`}
                              className="group flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 p-2.5 rounded-lg border border-border bg-white dark:bg-subtle hover:border-[#89BD49]/40 transition-colors"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-foreground truncate group-hover:text-[#6B9A35] dark:group-hover:text-[#A8D666] transition-colors">
                                  {cap.title || t("errors.unknownTitle")}
                                </p>
                                <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                  <span className="text-[10px] text-muted truncate max-w-full break-all">
                                    {cap.owner_email}
                                  </span>
                                  {cap.site_url && (
                                    <>
                                      <span className="text-muted/50">•</span>
                                      <span className="text-[10px] text-muted truncate max-w-full break-all">
                                        {cap.site_url}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className="shrink-0 text-[11px] text-muted flex w-full sm:w-auto justify-end">
                                {timeAgo(cap.created_at, t)}
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ErrorsPage() {
  const { t } = useT();
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-sm text-muted">
          {t("errors.loading")}
        </div>
      }
    >
      <ErrorsContent />
    </Suspense>
  );
}
