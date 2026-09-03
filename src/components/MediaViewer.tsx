"use client";

import { useEffect, useRef, useState } from "react";
import { useT } from "@/components/I18nProvider";

export interface ErrorMarker {
  timeSec: number;
  label: string;
  type?: "error" | "warn";
}

interface MediaViewerProps {
  type: string;
  driveUrl: string | null;
  title: string;
  onTimeUpdate?: (currentTimeSec: number) => void;
  seekToTime?: number | null;
  errorMarkers?: ErrorMarker[];
}

function driveFileId(url: string): string | null {
  const match =
    url.match(/[?&]id=([A-Za-z0-9_-]{10,200})/) ||
    url.match(/\/d\/([A-Za-z0-9_-]{10,200})/) ||
    url.match(/\/file\/d\/([A-Za-z0-9_-]{10,200})/);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 5;
const STEP_ZOOM = 0.5;
const DOUBLE_CLICK_ZOOM = 2.5;

function formatSec(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function MediaViewer({
  type,
  driveUrl,
  title,
  onTimeUpdate,
  seekToTime,
  errorMarkers = []
}: MediaViewerProps) {
  const { t } = useT();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const lightboxTriggerRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoFailed, setVideoFailed] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState<number>(0);
  const [hoveredMarker, setHoveredMarker] = useState<ErrorMarker | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; panX: number; panY: number; dragging: boolean }>({
    startX: 0, startY: 0, panX: 0, panY: 0, dragging: false,
  });
  const fileId = driveUrl ? driveFileId(driveUrl) : null;
  const imageUrl = fileId ? `https://drive.google.com/thumbnail?id=${fileId}&sz=w2400` : null;
  const directUrl = fileId ? `https://drive.google.com/uc?export=download&id=${fileId}` : null;
  const downloadUrl = fileId ? `/api/google-drive/download?id=${encodeURIComponent(fileId)}&type=${type === "video" ? "video" : "screenshot"}&filename=${encodeURIComponent(title || "capture")}` : null;
  const previewUrl = fileId ? `https://drive.google.com/file/d/${fileId}/preview` : null;

  function handleDownloadMedia(e: React.MouseEvent) {
    e.stopPropagation();
    if (!downloadUrl) return;
    window.location.href = downloadUrl;
  }

  // Reset and verify image loading
  useEffect(() => {
    setVideoFailed(false);
    setImageFailed(false);
    setImageLoaded(false);
    setLightboxOpen(false);

    if (type === "screenshot" && imageUrl) {
      const probe = new Image();
      probe.referrerPolicy = "no-referrer";
      probe.src = imageUrl;
      probe.onload = () => setImageLoaded(true);
      probe.onerror = () => setImageFailed(true);
    }
  }, [driveUrl, type, imageUrl]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (lightboxOpen && dialog && !dialog.open) {
      dialog.showModal();
      closeButtonRef.current?.focus();
    }
  }, [lightboxOpen]);

  // Reset zoom/pan whenever the lightbox opens or closes
  useEffect(() => {
    setZoom(MIN_ZOOM);
    setPan({ x: 0, y: 0 });
  }, [lightboxOpen]);

  function closeLightbox() {
    dialogRef.current?.close();
  }

  function handleDialogClose() {
    setLightboxOpen(false);
    setPan({ x: 0, y: 0 });
    setZoom(MIN_ZOOM);
    lightboxTriggerRef.current?.focus();
  }

  function resetView() {
    setZoom(MIN_ZOOM);
    setPan({ x: 0, y: 0 });
  }

  function handleWheel(e: React.WheelEvent) {
    if (zoom <= MIN_ZOOM && e.deltaY < 0) {
      // zooming in from 1x is always allowed
      setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z + STEP_ZOOM)));
      return;
    }
    e.preventDefault();
    setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z + (e.deltaY > 0 ? -STEP_ZOOM : STEP_ZOOM))));
    if (zoom > MIN_ZOOM) {
      // keep zoom centered-ish: no-op here; pan is manual
    }
  }

  function handlePointerDown(e: React.PointerEvent) {
    if (zoom <= MIN_ZOOM) return;
    const drag = dragRef.current;
    drag.dragging = true;
    drag.startX = e.clientX;
    drag.startY = e.clientY;
    drag.panX = pan.x;
    drag.panY = pan.y;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent) {
    const drag = dragRef.current;
    if (!drag.dragging || zoom <= MIN_ZOOM) return;
    setPan({
      x: drag.panX + (e.clientX - drag.startX),
      y: drag.panY + (e.clientY - drag.startY),
    });
  }

  function handlePointerUp(e: React.PointerEvent) {
    dragRef.current.dragging = false;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  }

  function handleDoubleClick() {
    if (zoom > MIN_ZOOM) {
      resetView();
    } else {
      setZoom(DOUBLE_CLICK_ZOOM);
      setPan({ x: 0, y: 0 });
    }
  }

  // Synchronize seek target time from external controls (DevTools / Timeline dots)
  useEffect(() => {
    if (typeof seekToTime === "number" && !isNaN(seekToTime) && videoRef.current) {
      videoRef.current.currentTime = Math.max(0, seekToTime);
      setCurrentPlaybackTime(seekToTime);
      if (videoRef.current.paused) {
        videoRef.current.play().catch(() => {});
      }
    }
  }, [seekToTime]);

  const unavailable = !fileId || (type !== "video" && type !== "screenshot");

  return (
    <>
      <div
        className="relative flex h-[clamp(18rem,45vw,32rem)] min-h-[18rem] w-full items-center justify-center overflow-hidden rounded-lg bg-[#f4f4f6] dark:bg-zinc-950 p-4"
      >
        {unavailable ? (
          <div className="px-6 text-center text-sm text-white/70" role="status">{t("mv.unavailable")}</div>
        ) : type === "video" ? (
          !videoFailed && (directUrl || downloadUrl) ? (
            <video
              ref={videoRef}
              controls
              preload="metadata"
              src={directUrl || downloadUrl || ""}
              onTimeUpdate={(e) => {
                const cur = e.currentTarget.currentTime;
                setCurrentPlaybackTime(cur);
                onTimeUpdate?.(cur);
              }}
              onLoadedMetadata={(e) => {
                if (e.currentTarget.duration && !isNaN(e.currentTarget.duration)) {
                  setVideoDuration(e.currentTarget.duration);
                }
              }}
              onError={() => setVideoFailed(true)}
              className="h-full w-full object-contain"
              aria-label={title}
            >
              {t("mv.noVideoSupport")}
            </video>
          ) : previewUrl ? (
            <iframe
              src={previewUrl}
              className="h-full w-full border-0"
              allow="autoplay; fullscreen; encrypted-media"
              allowFullScreen
              title={`${title} video preview`}
            />
          ) : (
            <div className="px-6 text-center text-sm text-white/70" role="status">{t("mv.unavailable")}</div>
          )
        ) : imageUrl && !imageFailed ? (
          <div className="group relative flex h-full w-full items-center justify-center">
            <div
              className="relative flex h-full w-full items-center justify-center cursor-zoom-in select-none"
              onClick={() => setLightboxOpen(true)}
              title={t("mv.openFullscreen")}
            >
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                </div>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt={title}
                referrerPolicy="no-referrer"
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageFailed(true)}
                className={`h-full w-full object-contain transition-all duration-200 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
              />
            </div>

            {/* Subtle hover feedback so it's obvious the image is clickable (no center icon per earlier feedback) */}
            <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-150 group-hover:bg-black/10" />

            {/* Download stays as a separate explicit action (not implied by the hover affordance above) */}
            {(directUrl || imageUrl) && (
              <div className="absolute right-3 top-3 z-10 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <button
                  type="button"
                  onClick={handleDownloadMedia}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900/80 text-white backdrop-blur-md hover:bg-zinc-900 transition-all shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-white cursor-pointer"
                  aria-label={t("mv.download")}
                  title={t("mv.download")}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        ) : previewUrl ? (
          <iframe
            src={previewUrl}
            className="h-full w-full border-0"
            allow="autoplay; fullscreen; encrypted-media"
            allowFullScreen
            title={`${title} media preview`}
          />
        ) : (
          <div className="px-6 text-center text-sm text-white/70" role="status">{t("mv.unavailable")}</div>
        )}
      </div>

      {type === "video" && errorMarkers.length > 0 && (
        <div className="mt-3 rounded-xl border border-border bg-white dark:bg-zinc-900/70 p-3 shadow-xs">
          <div className="flex items-center justify-between gap-2 mb-2 text-xs">
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
              <span>Interactive Error Timeline</span>
              <span className="rounded-full bg-rose-100 dark:bg-rose-950/50 px-2 py-0.5 text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                {errorMarkers.length} event{errorMarkers.length > 1 ? "s" : ""}
              </span>
            </div>
            <div className="text-[11px] text-muted font-mono">
              {formatSec(currentPlaybackTime)} / {formatSec(videoDuration)}
            </div>
          </div>

          {/* Interactive Timeline Bar */}
          <div
            className="relative h-4 w-full cursor-pointer rounded-md bg-zinc-100 dark:bg-zinc-800"
            onClick={(e) => {
              if (!videoDuration || !videoRef.current) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const targetSec = (clickX / rect.width) * videoDuration;
              videoRef.current.currentTime = Math.max(0, Math.min(videoDuration, targetSec));
            }}
          >
            {/* Playback progress bar */}
            <div
              className="absolute left-0 top-0 bottom-0 rounded-md bg-indigo-500/20 dark:bg-indigo-500/30 pointer-events-none transition-all duration-75"
              style={{ width: `${videoDuration > 0 ? (currentPlaybackTime / videoDuration) * 100 : 0}%` }}
            />
            {/* Playhead line */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-indigo-600 dark:bg-indigo-400 pointer-events-none z-10 transition-all duration-75"
              style={{ left: `${videoDuration > 0 ? (currentPlaybackTime / videoDuration) * 100 : 0}%` }}
            />

            {/* Error Marker Pins */}
            {errorMarkers.map((marker, idx) => {
              const leftPercent = videoDuration > 0
                ? Math.min(99, Math.max(1, (marker.timeSec / videoDuration) * 100))
                : ((idx + 1) / (errorMarkers.length + 1)) * 100;
              const isNearActive = Math.abs(currentPlaybackTime - marker.timeSec) < 1.5;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (videoRef.current) {
                      videoRef.current.currentTime = marker.timeSec;
                      if (videoRef.current.paused) videoRef.current.play().catch(() => {});
                    }
                  }}
                  onMouseEnter={() => setHoveredMarker(marker)}
                  onMouseLeave={() => setHoveredMarker(null)}
                  className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 flex items-center justify-center transition-transform hover:scale-125 focus:outline-hidden cursor-pointer ${
                    isNearActive ? "scale-125" : ""
                  }`}
                  style={{ left: `${leftPercent}%` }}
                  title={`[${formatSec(marker.timeSec)}] ${marker.label}`}
                >
                  <span className="relative flex h-3 w-3 items-center justify-center">
                    <span className="absolute h-full w-full rounded-full bg-rose-500 opacity-75 animate-ping" />
                    <span className="relative h-2.5 w-2.5 rounded-full bg-rose-600 border border-white dark:border-zinc-900 shadow-xs" />
                  </span>
                </button>
              );
            })}
          </div>

          {/* Tooltip on hovered marker */}
          {hoveredMarker && (
            <div className="mt-2 text-xs text-rose-600 dark:text-rose-400 font-mono truncate">
              📍 [{formatSec(hoveredMarker.timeSec)}] {hoveredMarker.label}
            </div>
          )}
        </div>
      )}

      <dialog
        ref={dialogRef}
        onClose={handleDialogClose}
        onClick={(event) => { if (event.target === event.currentTarget) closeLightbox(); }}
        aria-label={`${title} image viewer`}
        className="m-auto h-[85vh] w-[90vw] max-w-5xl rounded-2xl bg-zinc-950 p-0 text-white shadow-2xl backdrop:bg-black/70 backdrop:backdrop-blur-sm"
      >
        <div
          className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-2xl p-6 sm:p-10"
          onWheel={handleWheel}
        >
          {/* Controls */}
          <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
            {(directUrl || imageUrl) && (
              <button
                type="button"
                onClick={handleDownloadMedia}
                className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg bg-zinc-900/90 hover:bg-zinc-800 text-white border border-white/10 shadow-lg backdrop-blur-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-white transition-colors cursor-pointer"
                aria-label={t("mv.download")}
                title={t("mv.download")}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
              </button>
            )}
            <button
              ref={closeButtonRef}
              type="button"
              onClick={closeLightbox}
              className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg bg-zinc-900/90 hover:bg-zinc-800 text-white border border-white/10 shadow-lg backdrop-blur-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-white transition-colors"
              aria-label={t("mv.closeViewer")}
              title={t("mv.closeViewer")}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
            </button>
          </div>

          {/* Zoom indicator */}
          {zoom > MIN_ZOOM && (
            <div className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-lg bg-zinc-900/90 border border-white/10 px-3 py-1 text-xs font-semibold text-white shadow-lg backdrop-blur-md">
              {t("mv.dragToPan", { zoom: Math.round(zoom * 100) })}
            </div>
          )}

          {imageUrl && (
            <div
              className={`h-full w-full flex items-center justify-center overflow-hidden ${zoom > MIN_ZOOM ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"}`}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onDoubleClick={handleDoubleClick}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt={title}
                referrerPolicy="no-referrer"
                className="max-h-full max-w-full object-contain select-none"
                draggable={false}
                style={{
                  transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
                  transition: zoom === MIN_ZOOM ? "transform 0.15s ease-out" : "none",
                }}
              />
            </div>
          )}
        </div>
      </dialog>
    </>
  );
}
