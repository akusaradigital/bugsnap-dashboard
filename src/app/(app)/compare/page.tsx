"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useT } from "@/components/I18nProvider";
import { useToast } from "@/components/Toast";
import { Icon } from "@/lib/iconify";
import {
  type Capture,
  driveFileId,
  driveThumbUrl,
  timeAgo,
} from "@/lib/capture-utils";

type CompareMode = "split" | "side" | "diff";

interface CompareSlot {
  id?: string;
  title: string;
  imageUrl: string;
  fallbackUrl?: string;
  source: "capture" | "upload";
  dimensions?: string;
  createdAt?: string;
}

function CompareContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useT();
  const { showToast } = useToast();

  const leftParam = searchParams.get("left");
  const rightParam = searchParams.get("right");
  const wsParam = searchParams.get("ws");

  const [mode, setMode] = useState<CompareMode>("split");
  const [splitPercent, setSplitPercent] = useState<number>(50);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const [leftSlot, setLeftSlot] = useState<CompareSlot | null>(null);
  const [rightSlot, setRightSlot] = useState<CompareSlot | null>(null);
  const [loadingCaptures, setLoadingCaptures] = useState<boolean>(false);

  // Picker modal state
  const [pickerTarget, setPickerTarget] = useState<"left" | "right" | null>(null);
  const [workspaceCaptures, setWorkspaceCaptures] = useState<Capture[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loadingList, setLoadingList] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeUploadTarget = useRef<"left" | "right">("left");

  // Sync image source helper
  const getCaptureImageUrl = useCallback((c: Capture) => {
    const fid = driveFileId(c.drive_url);
    const thumb = driveThumbUrl(c.drive_url, 2400);
    const stream = fid
      ? `/api/google-drive/download?id=${encodeURIComponent(fid)}&type=screenshot&disposition=inline`
      : "";
    return {
      imageUrl: thumb || stream,
      fallbackUrl: stream,
    };
  }, []);

  // Fetch individual capture by ID
  const fetchCaptureById = useCallback(
    async (id: string): Promise<CompareSlot | null> => {
      try {
        const { data, error } = await supabase
          .from("captures")
          .select(
            "id, title, type, drive_url, created_at, window_size, workspace_id"
          )
          .eq("id", id)
          .single();

        if (error || !data) return null;

        const { imageUrl, fallbackUrl } = getCaptureImageUrl(data);
        return {
          id: data.id,
          title: data.title,
          imageUrl,
          fallbackUrl,
          source: "capture",
          dimensions: data.window_size || undefined,
          createdAt: data.created_at,
        };
      } catch {
        return null;
      }
    },
    [getCaptureImageUrl]
  );

  // Load initial captures from search params
  useEffect(() => {
    let cancelled = false;

    async function loadInitial() {
      if (!leftParam && !rightParam) return;
      setLoadingCaptures(true);

      const [leftRes, rightRes] = await Promise.all([
        leftParam ? fetchCaptureById(leftParam) : Promise.resolve(null),
        rightParam ? fetchCaptureById(rightParam) : Promise.resolve(null),
      ]);

      if (cancelled) return;

      if (leftRes) setLeftSlot(leftRes);
      if (rightRes) setRightSlot(rightRes);
      setLoadingCaptures(false);
    }

    void loadInitial();

    return () => {
      cancelled = true;
    };
  }, [leftParam, rightParam, fetchCaptureById]);

  // Update query params when slots change
  const updateUrlParams = useCallback(
    (leftId?: string, rightId?: string) => {
      const p = new URLSearchParams();
      if (leftId) p.set("left", leftId);
      if (rightId) p.set("right", rightId);
      if (wsParam) p.set("ws", wsParam);
      const str = p.toString();
      router.replace(str ? `/compare?${str}` : "/compare");
    },
    [router, wsParam]
  );

  // Load workspace screenshots for picker modal
  const openPickerModal = useCallback(
    async (target: "left" | "right") => {
      setPickerTarget(target);
      setSearchQuery("");
      setLoadingList(true);

      try {
        let q = supabase
          .from("captures")
          .select(
            "id, title, type, drive_url, created_at, window_size, workspace_id, tag, status"
          )
          .eq("type", "screenshot")
          .order("created_at", { ascending: false })
          .limit(50);

        if (wsParam) {
          q = q.or(`workspace_id.eq.${wsParam},workspace_id.is.null`);
        }

        const { data, error } = await q;
        if (!error && data) {
          setWorkspaceCaptures(data);
        }
      } catch {
        // Fallback gracefully
      } finally {
        setLoadingList(false);
      }
    },
    [wsParam]
  );

  const selectCaptureForSlot = (c: Capture) => {
    if (!pickerTarget) return;

    const { imageUrl, fallbackUrl } = getCaptureImageUrl(c);
    const slot: CompareSlot = {
      id: c.id,
      title: c.title,
      imageUrl,
      fallbackUrl,
      source: "capture",
      dimensions: c.window_size || undefined,
      createdAt: c.created_at,
    };

    if (pickerTarget === "left") {
      setLeftSlot(slot);
      updateUrlParams(c.id, rightSlot?.id);
    } else {
      setRightSlot(slot);
      updateUrlParams(leftSlot?.id, c.id);
    }

    setPickerTarget(null);
  };

  // Upload local image for comparison
  const handleTriggerUpload = (target: "left" | "right") => {
    activeUploadTarget.current = target;
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    const target = activeUploadTarget.current;

    const img = new Image();
    img.onload = () => {
      const slot: CompareSlot = {
        title: file.name,
        imageUrl: localUrl,
        source: "upload",
        dimensions: `${img.naturalWidth}x${img.naturalHeight}`,
      };

      if (target === "left") {
        setLeftSlot(slot);
        updateUrlParams(undefined, rightSlot?.id);
      } else {
        setRightSlot(slot);
        updateUrlParams(leftSlot?.id, undefined);
      }
    };
    img.src = localUrl;

    // Reset input
    e.target.value = "";
  };

  // Swap Left & Right
  const handleSwap = () => {
    const prevLeft = leftSlot;
    const prevRight = rightSlot;
    setLeftSlot(prevRight);
    setRightSlot(prevLeft);
    updateUrlParams(prevRight?.id, prevLeft?.id);
    showToast(t("compare.swap"), "success");
  };

  // Pointer drag logic for Split Slider
  const updateDividerPosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width <= 0) return;
    const offset = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const percent = Math.round((offset / rect.width) * 100);
    setSplitPercent(percent);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
    updateDividerPosition(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    updateDividerPosition(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        e.currentTarget.releasePointerCapture?.(e.pointerId);
      } catch {
        // noop
      }
    }
  };

  const filteredWorkspaceCaptures = useMemo(() => {
    if (!searchQuery.trim()) return workspaceCaptures;
    const q = searchQuery.toLowerCase();
    return workspaceCaptures.filter((c) =>
      c.title.toLowerCase().includes(q)
    );
  }, [workspaceCaptures, searchQuery]);

  const bothSelected = Boolean(leftSlot && rightSlot);
  const hasAnySelected = Boolean(leftSlot || rightSlot);
  const activeSingleSlot = leftSlot || rightSlot;
  const missingTarget: "left" | "right" = !leftSlot ? "left" : "right";

  return (
    <div className="min-h-full flex flex-col bg-background text-foreground pb-12">
      {/* Hidden File Input for local uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Top Header Bar */}
      <div className="border-b border-border bg-subtle/50 backdrop-blur-xs px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Link
                href={wsParam ? `/captures?ws=${wsParam}` : "/captures"}
                className="text-muted hover:text-foreground text-xs font-medium flex items-center gap-1 transition-colors"
              >
                <Icon icon="lucide:arrow-left" className="w-3.5 h-3.5 shrink-0" />
                <span>{t("compare.backToCaptures")}</span>
              </Link>
              <span className="text-border text-xs">/</span>
              <span className="text-xs text-muted font-medium">
                {t("nav.compare")}
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-foreground tracking-tight mt-1 truncate">
              {t("compare.title")}
            </h1>
            <p className="text-xs text-muted mt-0.5 line-clamp-1 max-w-xl">
              {t("compare.subtitle")}
            </p>
          </div>

          {/* Mode Toggles & Global Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle Buttons */}
            <div className="flex items-center rounded-xl bg-subtle p-1 border border-border">
              <button
                type="button"
                onClick={() => setMode("split")}
                className={`px-3 py-1.5 min-h-[36px] sm:min-h-0 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer touch-manipulation ${
                  mode === "split"
                    ? "bg-background text-foreground shadow-xs border border-border"
                    : "text-muted hover:text-foreground"
                }`}
                title={t("compare.splitMode")}
              >
                <Icon icon="lucide:split" className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">{t("compare.splitMode")}</span>
              </button>

              <button
                type="button"
                onClick={() => setMode("side")}
                className={`px-3 py-1.5 min-h-[36px] sm:min-h-0 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer touch-manipulation ${
                  mode === "side"
                    ? "bg-background text-foreground shadow-xs border border-border"
                    : "text-muted hover:text-foreground"
                }`}
                title={t("compare.sideBySideMode")}
              >
                <Icon icon="lucide:columns-2" className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">{t("compare.sideBySideMode")}</span>
              </button>

              <button
                type="button"
                onClick={() => setMode("diff")}
                className={`px-3 py-1.5 min-h-[36px] sm:min-h-0 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer touch-manipulation ${
                  mode === "diff"
                    ? "bg-background text-foreground shadow-xs border border-border"
                    : "text-muted hover:text-foreground"
                }`}
                title={t("compare.diffMode")}
              >
                <Icon icon="lucide:layers" className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">{t("compare.diffMode")}</span>
              </button>
            </div>

            {/* Swap Button */}
            <button
              type="button"
              onClick={handleSwap}
              disabled={!leftSlot && !rightSlot}
              className="h-9 min-h-[36px] px-3 rounded-xl border border-border bg-subtle hover:bg-background text-foreground text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40 transition-colors cursor-pointer shadow-xs touch-manipulation"
              title={t("compare.swap")}
            >
              <Icon icon="lucide:arrow-right-left" className="w-3.5 h-3.5 text-muted shrink-0" />
              <span>{t("compare.swap")}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex-1 flex flex-col min-w-0">
        {/* Slot Headers / Switchers Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          {/* Left Slot Card */}
          <div className="border border-border rounded-2xl bg-subtle p-3 sm:p-4 flex flex-col justify-between gap-3 shadow-xs min-w-0">
            <div className="flex items-center justify-between gap-2 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-[11px] shrink-0 uppercase tracking-wider">
                  {t("compare.original")}
                </span>
                <span className="font-semibold text-xs text-foreground truncate">
                  {leftSlot ? leftSlot.title : t("compare.selectLeft")}
                </span>
              </div>
              {leftSlot && (
                <button
                  type="button"
                  onClick={() => {
                    setLeftSlot(null);
                    updateUrlParams(undefined, rightSlot?.id);
                  }}
                  className="text-xs text-muted hover:text-red-500 transition-colors"
                  title={t("compare.clear")}
                >
                  <Icon icon="lucide:x" className="w-3.5 h-3.5 shrink-0" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/50 text-[11px] text-muted">
              <span className="truncate">
                {leftSlot?.dimensions
                  ? `${t("compare.dimensions")}: ${leftSlot.dimensions}`
                  : leftSlot?.createdAt
                  ? timeAgo(leftSlot.createdAt, t)
                  : t("compare.emptyStateDesc")}
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => void openPickerModal("left")}
                  className="px-2.5 py-1 min-h-[36px] sm:min-h-0 rounded-lg border border-border bg-subtle hover:bg-background text-foreground font-medium transition-colors cursor-pointer touch-manipulation flex items-center justify-center text-xs"
                >
                  {leftSlot ? t("compare.change") : t("compare.pickCapture")}
                </button>
                <button
                  type="button"
                  onClick={() => handleTriggerUpload("left")}
                  className="p-1 min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0 rounded-lg border border-border bg-subtle hover:bg-background text-muted hover:text-foreground transition-colors cursor-pointer touch-manipulation flex items-center justify-center"
                  title={t("compare.uploadImage")}
                >
                  <Icon icon="lucide:upload" className="w-3.5 h-3.5 shrink-0" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Slot Card */}
          <div className="border border-border rounded-2xl bg-subtle p-3 sm:p-4 flex flex-col justify-between gap-3 shadow-xs min-w-0">
            <div className="flex items-center justify-between gap-2 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="px-2 py-0.5 rounded-md bg-[#89BD49]/15 text-[#6B9A35] dark:text-[#A8D666] font-bold text-[11px] shrink-0 uppercase tracking-wider">
                  {t("compare.modified")}
                </span>
                <span className="font-semibold text-xs text-foreground truncate">
                  {rightSlot ? rightSlot.title : t("compare.selectRight")}
                </span>
              </div>
              {rightSlot && (
                <button
                  type="button"
                  onClick={() => {
                    setRightSlot(null);
                    updateUrlParams(leftSlot?.id, undefined);
                  }}
                  className="text-xs text-muted hover:text-red-500 transition-colors"
                  title={t("compare.clear")}
                >
                  <Icon icon="lucide:x" className="w-3.5 h-3.5 shrink-0" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/50 text-[11px] text-muted">
              <span className="truncate">
                {rightSlot?.dimensions
                  ? `${t("compare.dimensions")}: ${rightSlot.dimensions}`
                  : rightSlot?.createdAt
                  ? timeAgo(rightSlot.createdAt, t)
                  : t("compare.emptyStateDesc")}
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => void openPickerModal("right")}
                  className="px-2.5 py-1 min-h-[36px] sm:min-h-0 rounded-lg border border-border bg-subtle hover:bg-background text-foreground font-medium transition-colors cursor-pointer touch-manipulation flex items-center justify-center text-xs"
                >
                  {rightSlot ? t("compare.change") : t("compare.pickCapture")}
                </button>
                <button
                  type="button"
                  onClick={() => handleTriggerUpload("right")}
                  className="p-1 min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0 rounded-lg border border-border bg-subtle hover:bg-background text-muted hover:text-foreground transition-colors cursor-pointer touch-manipulation flex items-center justify-center"
                  title={t("compare.uploadImage")}
                >
                  <Icon icon="lucide:upload" className="w-3.5 h-3.5 shrink-0" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Loading Spinner */}
        {loadingCaptures && (
          <div className="flex-1 flex flex-col items-center justify-center py-20 border border-border rounded-2xl bg-subtle/40">
            <Icon
              icon="lucide:refresh-cw"
              className="w-6 h-6 animate-spin text-[#89BD49] mb-3"
            />
            <p className="text-xs text-muted">{t("compare.loading")}</p>
          </div>
        )}

        {/* Empty State (when neither slot is selected) */}
        {!loadingCaptures && !hasAnySelected && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12 border-2 border-dashed border-border rounded-3xl bg-subtle/30 text-center min-w-0">
            <div className="w-14 h-14 rounded-2xl bg-[#89BD49]/10 text-[#6B9A35] dark:text-[#A8D666] flex items-center justify-center mb-4">
              <Icon icon="lucide:columns-2" className="w-7 h-7" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-foreground">
              {t("compare.emptyStateTitle")}
            </h2>
            <p className="text-xs text-muted max-w-md mt-1 mb-6">
              {t("compare.emptyStateDesc")}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => void openPickerModal(!leftSlot ? "left" : "right")}
                className="px-4 py-2 min-h-[44px] rounded-xl bg-[#89BD49] hover:bg-[#78a83f] text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer touch-manipulation"
              >
                <Icon icon="lucide:camera" className="w-4 h-4 shrink-0" />
                <span>{t("compare.pickCapture")}</span>
              </button>
              <button
                type="button"
                onClick={() => handleTriggerUpload(!leftSlot ? "left" : "right")}
                className="px-4 py-2 min-h-[44px] rounded-xl border border-border bg-subtle hover:bg-background text-foreground font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer touch-manipulation"
              >
                <Icon icon="lucide:upload" className="w-4 h-4 shrink-0" />
                <span>{t("compare.uploadImage")}</span>
              </button>
            </div>
          </div>
        )}

        {/* Comparison Viewer Area (active when at least one slot is selected) */}
        {!loadingCaptures && hasAnySelected && (
          <div className="flex-1 flex flex-col min-w-0">
            {/* Split Slider Mode - Both Selected */}
            {mode === "split" && bothSelected && leftSlot && rightSlot && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs text-muted px-1">
                  <span>{t("compare.dragSliderHint")}</span>
                  <span className="font-semibold text-foreground">
                    {splitPercent}%
                  </span>
                </div>

                <div
                  ref={containerRef}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  className="relative w-full max-h-[75vh] min-h-[360px] rounded-2xl overflow-hidden border border-border bg-zinc-950 shadow-md select-none touch-none flex items-center justify-center cursor-ew-resize"
                >
                  {/* Bottom Image (Original / Left) */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={leftSlot.imageUrl}
                    alt={leftSlot.title}
                    onError={(e) => {
                      if (leftSlot.fallbackUrl && e.currentTarget.src !== leftSlot.fallbackUrl) {
                        e.currentTarget.src = leftSlot.fallbackUrl;
                      }
                    }}
                    className="w-full h-full object-contain pointer-events-none"
                  />

                  {/* Top Image (Modified / Right, Clipped) */}
                  <div
                    style={{
                      clipPath: `polygon(${splitPercent}% 0, 100% 0, 100% 100%, ${splitPercent}% 100%)`,
                    }}
                    className="absolute inset-0 w-full h-full pointer-events-none"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={rightSlot.imageUrl}
                      alt={rightSlot.title}
                      onError={(e) => {
                        if (rightSlot.fallbackUrl && e.currentTarget.src !== rightSlot.fallbackUrl) {
                          e.currentTarget.src = rightSlot.fallbackUrl;
                        }
                      }}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Divider Line & Handle */}
                  <div
                    style={{ left: `${splitPercent}%` }}
                    className="absolute inset-y-0 w-0.5 bg-white dark:bg-zinc-200 pointer-events-none z-20 shadow-[0_0_10px_rgba(0,0,0,0.5)] flex items-center justify-center -translate-x-1/2"
                  >
                    <div className="w-8 h-8 rounded-full bg-white text-zinc-900 border border-zinc-300 dark:border-zinc-700 shadow-xl flex items-center justify-center text-xs font-bold tracking-tight select-none">
                      ‹ ›
                    </div>
                  </div>

                  {/* Badges in corners */}
                  <div className="absolute top-3 left-3 z-10 pointer-events-none">
                    <span className="px-2.5 py-1 rounded-lg bg-black/70 text-white backdrop-blur-xs font-semibold text-[11px] shadow-sm">
                      {t("compare.original")}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3 z-10 pointer-events-none">
                    <span className="px-2.5 py-1 rounded-lg bg-[#89BD49]/90 text-white backdrop-blur-xs font-semibold text-[11px] shadow-sm">
                      {t("compare.modified")}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Split Slider Mode - Single Selected Preview */}
            {mode === "split" && !bothSelected && activeSingleSlot && (
              <div className="flex flex-col min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 sm:p-3.5 rounded-2xl border border-border bg-subtle/80 backdrop-blur-xs text-xs mb-3 shadow-xs min-w-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-2.5 h-2.5 rounded-full shrink-0 animate-pulse ${
                        leftSlot ? "bg-blue-500" : "bg-[#89BD49]"
                      }`}
                    />
                    <span className="text-muted truncate">
                      {t("compare.oneSelectedNotice", {
                        selected: leftSlot ? t("compare.original") : t("compare.modified"),
                        missing: !leftSlot ? t("compare.original") : t("compare.modified"),
                        mode: t("compare.splitMode"),
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => void openPickerModal(missingTarget)}
                      className="px-3 py-1.5 min-h-[36px] rounded-xl bg-[#89BD49] hover:bg-[#78a83f] text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer touch-manipulation"
                    >
                      <Icon icon="lucide:camera" className="w-3.5 h-3.5 shrink-0" />
                      <span>{t("compare.pickCapture")}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTriggerUpload(missingTarget)}
                      className="px-3 py-1.5 min-h-[36px] rounded-xl border border-border bg-background hover:bg-subtle text-foreground font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer touch-manipulation"
                    >
                      <Icon icon="lucide:upload" className="w-3.5 h-3.5 shrink-0" />
                      <span>{t("compare.uploadImage")}</span>
                    </button>
                  </div>
                </div>

                <div className="relative w-full max-h-[75vh] min-h-[360px] rounded-2xl overflow-hidden border border-border bg-zinc-950 shadow-md select-none flex items-center justify-center p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={activeSingleSlot.imageUrl}
                    alt={activeSingleSlot.title}
                    onError={(e) => {
                      if (
                        activeSingleSlot.fallbackUrl &&
                        e.currentTarget.src !== activeSingleSlot.fallbackUrl
                      ) {
                        e.currentTarget.src = activeSingleSlot.fallbackUrl;
                      }
                    }}
                    className="max-w-full max-h-[70vh] object-contain pointer-events-none rounded-lg"
                  />

                  <div className="absolute top-3 left-3 z-10 pointer-events-none">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-white backdrop-blur-xs font-semibold text-[11px] shadow-sm ${
                        leftSlot ? "bg-blue-600/90" : "bg-[#89BD49]/90"
                      }`}
                    >
                      {leftSlot ? t("compare.original") : t("compare.modified")}
                    </span>
                  </div>
                  {Boolean(activeSingleSlot.dimensions) && (
                    <div className="absolute top-3 right-3 z-10 pointer-events-none">
                      <span className="px-2.5 py-1 rounded-lg bg-black/70 text-zinc-300 backdrop-blur-xs font-medium text-[11px] shadow-sm">
                        {activeSingleSlot.dimensions}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Side by Side Mode (handles 1 or 2 slots seamlessly) */}
            {mode === "side" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Panel */}
                {leftSlot ? (
                  <div className="flex flex-col border border-border rounded-2xl bg-zinc-950 overflow-hidden shadow-xs min-w-0">
                    <div className="px-3 py-2 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
                      <span className="text-xs font-semibold text-white truncate">
                        {leftSlot.title}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400">
                        {t("compare.original")}
                      </span>
                    </div>
                    <div className="p-2 flex items-center justify-center min-h-[360px] max-h-[70vh]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={leftSlot.imageUrl}
                        alt={leftSlot.title}
                        onError={(e) => {
                          if (
                            leftSlot.fallbackUrl &&
                            e.currentTarget.src !== leftSlot.fallbackUrl
                          ) {
                            e.currentTarget.src = leftSlot.fallbackUrl;
                          }
                        }}
                        className="max-w-full max-h-[65vh] object-contain rounded-lg"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 sm:p-8 border-2 border-dashed border-border rounded-2xl bg-subtle/30 text-center min-h-[360px] min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-3">
                      <Icon icon="lucide:image" className="w-6 h-6" />
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 mb-2">
                      {t("compare.original")}
                    </span>
                    <h3 className="text-sm font-semibold text-foreground">
                      {t("compare.selectLeft")}
                    </h3>
                    <p className="text-xs text-muted max-w-xs mt-1 mb-4">
                      {t("compare.emptySlotHint")}
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => void openPickerModal("left")}
                        className="px-3 py-1.5 min-h-[36px] rounded-xl bg-[#89BD49] hover:bg-[#78a83f] text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer touch-manipulation"
                      >
                        <Icon icon="lucide:camera" className="w-3.5 h-3.5 shrink-0" />
                        <span>{t("compare.pickCapture")}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTriggerUpload("left")}
                        className="px-3 py-1.5 min-h-[36px] rounded-xl border border-border bg-background hover:bg-subtle text-foreground font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer touch-manipulation"
                      >
                        <Icon icon="lucide:upload" className="w-3.5 h-3.5 shrink-0" />
                        <span>{t("compare.uploadImage")}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Right Panel */}
                {rightSlot ? (
                  <div className="flex flex-col border border-border rounded-2xl bg-zinc-950 overflow-hidden shadow-xs min-w-0">
                    <div className="px-3 py-2 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
                      <span className="text-xs font-semibold text-white truncate">
                        {rightSlot.title}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#89BD49]/20 text-[#A8D666]">
                        {t("compare.modified")}
                      </span>
                    </div>
                    <div className="p-2 flex items-center justify-center min-h-[360px] max-h-[70vh]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={rightSlot.imageUrl}
                        alt={rightSlot.title}
                        onError={(e) => {
                          if (
                            rightSlot.fallbackUrl &&
                            e.currentTarget.src !== rightSlot.fallbackUrl
                          ) {
                            e.currentTarget.src = rightSlot.fallbackUrl;
                          }
                        }}
                        className="max-w-full max-h-[65vh] object-contain rounded-lg"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 sm:p-8 border-2 border-dashed border-border rounded-2xl bg-subtle/30 text-center min-h-[360px] min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-[#89BD49]/10 text-[#6B9A35] dark:text-[#A8D666] flex items-center justify-center mb-3">
                      <Icon icon="lucide:image-plus" className="w-6 h-6" />
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#89BD49]/20 text-[#A8D666] mb-2">
                      {t("compare.modified")}
                    </span>
                    <h3 className="text-sm font-semibold text-foreground">
                      {t("compare.selectRight")}
                    </h3>
                    <p className="text-xs text-muted max-w-xs mt-1 mb-4">
                      {t("compare.emptySlotHint")}
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => void openPickerModal("right")}
                        className="px-3 py-1.5 min-h-[36px] rounded-xl bg-[#89BD49] hover:bg-[#78a83f] text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer touch-manipulation"
                      >
                        <Icon icon="lucide:camera" className="w-3.5 h-3.5 shrink-0" />
                        <span>{t("compare.pickCapture")}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTriggerUpload("right")}
                        className="px-3 py-1.5 min-h-[36px] rounded-xl border border-border bg-background hover:bg-subtle text-foreground font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer touch-manipulation"
                      >
                        <Icon icon="lucide:upload" className="w-3.5 h-3.5 shrink-0" />
                        <span>{t("compare.uploadImage")}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Diff / Difference Overlay Mode - Both Selected */}
            {mode === "diff" && bothSelected && leftSlot && rightSlot && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs text-muted px-1">
                  <span>{t("compare.diffMode")}: pixels in common turn dark; differences light up brightly</span>
                </div>

                <div className="relative w-full max-h-[75vh] min-h-[360px] rounded-2xl overflow-hidden border border-border bg-black shadow-md flex items-center justify-center">
                  {/* Base Original Image */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={leftSlot.imageUrl}
                    alt={leftSlot.title}
                    onError={(e) => {
                      if (leftSlot.fallbackUrl && e.currentTarget.src !== leftSlot.fallbackUrl) {
                        e.currentTarget.src = leftSlot.fallbackUrl;
                      }
                    }}
                    className="w-full h-full object-contain pointer-events-none"
                  />

                  {/* Overlaid Modified Image with difference blend mode */}
                  <div className="absolute inset-0 w-full h-full mix-blend-difference pointer-events-none flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={rightSlot.imageUrl}
                      alt={rightSlot.title}
                      onError={(e) => {
                        if (rightSlot.fallbackUrl && e.currentTarget.src !== rightSlot.fallbackUrl) {
                          e.currentTarget.src = rightSlot.fallbackUrl;
                        }
                      }}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="absolute top-3 left-3 z-10 pointer-events-none">
                    <span className="px-2.5 py-1 rounded-lg bg-black/80 text-white backdrop-blur-xs font-semibold text-[11px] shadow-sm">
                      {t("compare.diffMode")}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Diff / Difference Overlay Mode - Single Selected Preview */}
            {mode === "diff" && !bothSelected && activeSingleSlot && (
              <div className="flex flex-col min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 sm:p-3.5 rounded-2xl border border-border bg-subtle/80 backdrop-blur-xs text-xs mb-3 shadow-xs min-w-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-2.5 h-2.5 rounded-full shrink-0 animate-pulse ${
                        leftSlot ? "bg-blue-500" : "bg-[#89BD49]"
                      }`}
                    />
                    <span className="text-muted truncate">
                      {t("compare.oneSelectedNotice", {
                        selected: leftSlot ? t("compare.original") : t("compare.modified"),
                        missing: !leftSlot ? t("compare.original") : t("compare.modified"),
                        mode: t("compare.diffMode"),
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => void openPickerModal(missingTarget)}
                      className="px-3 py-1.5 min-h-[36px] rounded-xl bg-[#89BD49] hover:bg-[#78a83f] text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer touch-manipulation"
                    >
                      <Icon icon="lucide:camera" className="w-3.5 h-3.5 shrink-0" />
                      <span>{t("compare.pickCapture")}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTriggerUpload(missingTarget)}
                      className="px-3 py-1.5 min-h-[36px] rounded-xl border border-border bg-background hover:bg-subtle text-foreground font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer touch-manipulation"
                    >
                      <Icon icon="lucide:upload" className="w-3.5 h-3.5 shrink-0" />
                      <span>{t("compare.uploadImage")}</span>
                    </button>
                  </div>
                </div>

                <div className="relative w-full max-h-[75vh] min-h-[360px] rounded-2xl overflow-hidden border border-border bg-zinc-950 shadow-md select-none flex items-center justify-center p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={activeSingleSlot.imageUrl}
                    alt={activeSingleSlot.title}
                    onError={(e) => {
                      if (
                        activeSingleSlot.fallbackUrl &&
                        e.currentTarget.src !== activeSingleSlot.fallbackUrl
                      ) {
                        e.currentTarget.src = activeSingleSlot.fallbackUrl;
                      }
                    }}
                    className="max-w-full max-h-[70vh] object-contain pointer-events-none rounded-lg"
                  />

                  <div className="absolute top-3 left-3 z-10 pointer-events-none">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-white backdrop-blur-xs font-semibold text-[11px] shadow-sm ${
                        leftSlot ? "bg-blue-600/90" : "bg-[#89BD49]/90"
                      }`}
                    >
                      {leftSlot ? t("compare.original") : t("compare.modified")}
                    </span>
                  </div>
                  {Boolean(activeSingleSlot.dimensions) && (
                    <div className="absolute top-3 right-3 z-10 pointer-events-none">
                      <span className="px-2.5 py-1 rounded-lg bg-black/70 text-zinc-300 backdrop-blur-xs font-medium text-[11px] shadow-sm">
                        {activeSingleSlot.dimensions}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Capture Picker Modal */}
      {pickerTarget && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setPickerTarget(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl max-h-[85vh] bg-subtle border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
          >
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-4 border-b border-border flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-bold text-sm sm:text-base text-foreground truncate">
                  {t("compare.modalTitle")}
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  {t("compare.onlyScreenshotsNote")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPickerTarget(null)}
                className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-lg hover:bg-subtle text-muted hover:text-foreground flex items-center justify-center transition-colors cursor-pointer shrink-0 touch-manipulation"
              >
                <Icon icon="lucide:x" className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Search Input */}
            <div className="p-4 border-b border-border bg-subtle/50">
              <div className="relative">
                <Icon
                  icon="lucide:search"
                  className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("compare.searchPlaceholder")}
                  className="w-full h-9 pl-9 pr-3 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-hidden focus:border-[#89BD49] focus:ring-1 focus:ring-[#89BD49] transition-all"
                />
              </div>
            </div>

            {/* Modal Capture List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {loadingList && (
                <div className="py-12 flex flex-col items-center justify-center text-muted">
                  <Icon
                    icon="lucide:refresh-cw"
                    className="w-5 h-5 animate-spin text-[#89BD49] mb-2"
                  />
                  <span className="text-xs">{t("compare.loading")}</span>
                </div>
              )}

              {!loadingList && filteredWorkspaceCaptures.length === 0 && (
                <div className="py-12 text-center text-muted">
                  <Icon
                    icon="lucide:alert-circle"
                    className="w-6 h-6 mx-auto mb-2 opacity-50"
                  />
                  <p className="text-xs">{t("compare.noScreenshots")}</p>
                </div>
              )}

              {!loadingList &&
                filteredWorkspaceCaptures.map((c) => {
                  const thumb = driveThumbUrl(c.drive_url, 300);
                  const isCurrentLeft = leftSlot?.id === c.id;
                  const isCurrentRight = rightSlot?.id === c.id;

                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => selectCaptureForSlot(c)}
                      className={`w-full p-2.5 rounded-xl border text-left flex items-center gap-3 transition-colors cursor-pointer ${
                        isCurrentLeft || isCurrentRight
                          ? "border-[#89BD49]/60 bg-[#89BD49]/10"
                          : "border-border hover:border-[#89BD49]/40 hover:bg-subtle"
                      }`}
                    >
                      {/* Thumbnail */}
                      <div className="w-14 h-10 rounded-lg bg-subtle border border-border overflow-hidden shrink-0 flex items-center justify-center">
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={thumb}
                            alt={c.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Icon
                            icon="lucide:camera"
                            className="w-4 h-4 text-muted"
                          />
                        )}
                      </div>

                      {/* Meta */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-xs text-foreground truncate">
                            {c.title}
                          </span>
                          {isCurrentLeft && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-500/20 text-blue-500 shrink-0">
                              {t("compare.original")}
                            </span>
                          )}
                          {isCurrentRight && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#89BD49]/20 text-[#6B9A35] dark:text-[#A8D666] shrink-0">
                              {t("compare.modified")}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-muted mt-0.5">
                          <span>{timeAgo(c.created_at, t)}</span>
                          {c.window_size && (
                            <>
                              <span>•</span>
                              <span>{c.window_size}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <Icon
                        icon="lucide:check"
                        className={`w-4 h-4 shrink-0 transition-opacity ${
                          isCurrentLeft || isCurrentRight
                            ? "text-[#89BD49] opacity-100"
                            : "opacity-0"
                        }`}
                      />
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-full flex items-center justify-center py-20 bg-background text-foreground">
          <Icon
            icon="lucide:refresh-cw"
            className="w-6 h-6 animate-spin text-[#89BD49]"
          />
        </div>
      }
    >
      <CompareContent />
    </Suspense>
  );
}
