"use client";

import { useEffect, useRef, useState } from "react";
import { useT } from "@/components/I18nProvider";
import { CommentRow } from "@/components/Comments";

interface MediaViewerProps {
  type: string;
  driveUrl: string | null;
  title: string;
  comments?: CommentRow[];
  onPlacePin?: (coords: { x: number; y: number }) => void;
  activePin?: { x: number; y: number } | null;
  onSelectComment?: (commentId: string) => void;
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

export default function MediaViewer({
  type,
  driveUrl,
  title,
  comments = [],
  onPlacePin,
  activePin,
  onSelectComment,
}: MediaViewerProps) {
  const { t } = useT();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const lightboxTriggerRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [videoFailed, setVideoFailed] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; panX: number; panY: number; dragging: boolean }>({
    startX: 0, startY: 0, panX: 0, panY: 0, dragging: false,
  });
  const [isFullscreen, setIsFullscreen] = useState(false);

  const fileId = driveUrl ? driveFileId(driveUrl) : null;
  const imageUrl = fileId ? `https://drive.google.com/thumbnail?id=${fileId}&sz=w2400` : null;
  const directUrl = fileId ? `https://drive.google.com/uc?export=download&id=${fileId}` : null;
  const previewUrl = fileId ? `https://drive.google.com/file/d/${fileId}/preview` : null;

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

  useEffect(() => {
    const dialog = dialogRef.current;
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    dialog?.addEventListener("fullscreenchange", onFullscreenChange);
    return () => dialog?.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  function closeLightbox() {
    dialogRef.current?.close();
  }

  function handleDialogClose() {
    setLightboxOpen(false);
    setPan({ x: 0, y: 0 });
    setZoom(MIN_ZOOM);
    lightboxTriggerRef.current?.focus();
  }

  function toggleFullscreen() {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      dialog.requestFullscreen?.().catch(() => {});
    }
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

  const unavailable = !fileId || (type !== "video" && type !== "screenshot");

  return (
    <>
      <div
        className="relative flex h-[clamp(16rem,40vh,28rem)] min-h-[16rem] sm:h-[clamp(28rem,72vh,60rem)] sm:min-h-[28rem] w-full items-center justify-center overflow-hidden rounded-2xl bg-[#f4f4f6] dark:bg-zinc-950 p-4 shadow-inner sm:p-6"
      >
        {unavailable ? (
          <div className="px-6 text-center text-sm text-white/70" role="status">{t("mv.unavailable")}</div>
        ) : type === "video" ? (
          previewUrl ? (
            <iframe
              src={previewUrl}
              className="h-full w-full border-0"
              allow="autoplay; fullscreen; encrypted-media"
              allowFullScreen
              title={`${title} video preview`}
            />
          ) : !videoFailed && directUrl ? (
            <video
              controls
              preload="metadata"
              src={directUrl}
              onError={() => setVideoFailed(true)}
              className="h-full w-full object-contain"
              aria-label={title}
            >
              {t("mv.noVideoSupport")}
            </video>
          ) : (
            <div className="px-6 text-center text-sm text-white/70" role="status">{t("mv.unavailable")}</div>
          )
        ) : imageUrl && !imageFailed ? (
          <div className="group relative flex h-full w-full items-center justify-center">
            <div
              className="relative flex h-full w-full items-center justify-center cursor-crosshair select-none"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
                const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
                onPlacePin?.({ x, y });
              }}
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

              {/* Render existing persistent comment pins */}
              {comments
                .filter((c) => !c.parent_id && c.pin_x != null && c.pin_y != null)
                .map((c, idx) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectComment?.(c.id);
                    }}
                    style={{ left: `${c.pin_x}%`, top: `${c.pin_y}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group/pin flex items-center justify-center"
                    title={`${c.author_name || "Guest"}: ${c.body}`}
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-[11px] shadow-lg ring-2 ring-white hover:scale-125 transition-transform">
                      {idx + 1}
                    </span>
                    <span className="absolute bottom-full mb-1.5 hidden group-hover/pin:flex whitespace-nowrap rounded bg-black/80 px-2 py-0.5 text-[10px] text-white backdrop-blur-sm shadow z-30 pointer-events-none">
                      {c.author_name || "Guest"}: {c.body.length > 25 ? `${c.body.slice(0, 25)}…` : c.body}
                    </span>
                  </button>
                ))}

              {/* Active temporary pin waiting for comment submit */}
              {activePin && (
                <div
                  style={{ left: `${activePin.x}%`, top: `${activePin.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none flex items-center justify-center"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white font-bold text-[11px] shadow-lg ring-2 ring-white animate-bounce">
                    +
                  </span>
                </div>
              )}

              {/* Hover Badge Indicator */}
              <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-sm px-3 py-1 text-xs font-medium text-white/90 opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:-translate-y-0.5 shadow-sm">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  <line x1="11" y1="8" x2="11" y2="14" />
                  <line x1="8" y1="11" x2="14" y2="11" />
                </svg>
                <span>Click image to drop a pin</span>
              </div>
            </div>

            {/* Quick Action Top-Right Controls */}
            <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              {directUrl && (
                <a
                  href={directUrl}
                  download={`${title || "capture"}.png`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-black/70 text-white/90 backdrop-blur-sm hover:bg-black hover:text-white transition-all shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
                  aria-label={t("mv.download")}
                  title={t("mv.download")}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </a>
              )}
              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-black/70 text-white/90 backdrop-blur-sm hover:bg-black hover:text-white transition-all shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
                aria-label={t("mv.openFullscreen")}
                title="Expand"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                </svg>
              </button>
            </div>
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

      <dialog
        ref={dialogRef}
        onClose={handleDialogClose}
        onClick={(event) => { if (event.target === event.currentTarget) closeLightbox(); }}
        aria-label={`${title} image viewer`}
        className="m-0 h-screen max-h-none w-screen max-w-none bg-white/95 dark:bg-black/95 p-0 text-foreground dark:text-white backdrop:bg-white/95 dark:backdrop:bg-black/95"
      >
        <div
          className="relative flex h-full w-full items-center justify-center overflow-hidden p-4 sm:p-8"
          onWheel={handleWheel}
        >
          {/* Controls */}
          <div className="absolute right-3 top-3 z-10 flex items-center gap-2 sm:right-4 sm:top-4">
            {zoom > MIN_ZOOM && (
              <button
                type="button"
                onClick={resetView}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg bg-black/10 dark:bg-black/75 text-zinc-900 dark:text-white hover:bg-black/20 dark:hover:bg-black border border-black/10 dark:border-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:focus-visible:outline-white transition-colors"
                aria-label={t("mv.resetZoom")}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v6h6M20 20v-6h-6M4 10a8 8 0 0114-4.9M20 14a8 8 0 01-14 4.9" /></svg>
              </button>
            )}
            {directUrl && (
              <a
                href={directUrl}
                download={`${title || "capture"}.${type === "video" ? "webm" : "png"}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg bg-black/10 dark:bg-black/75 text-zinc-900 dark:text-white hover:bg-black/20 dark:hover:bg-black border border-black/10 dark:border-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:focus-visible:outline-white transition-colors"
                aria-label={t("mv.download")}
                title={t("mv.download")}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
              </a>
            )}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg bg-black/10 dark:bg-black/75 text-zinc-900 dark:text-white hover:bg-black/20 dark:hover:bg-black border border-black/10 dark:border-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:focus-visible:outline-white transition-colors"
              aria-label={isFullscreen ? t("mv.exitFullscreen") : t("mv.openFullscreen")}
            >
              {isFullscreen ? (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" /></svg>
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M4 8V5a1 1 0 011-1h3M16 4h3a1 1 0 011 1v3M20 16v3a1 1 0 01-1 1h-3M8 20H5a1 1 0 01-1-1v-3" /></svg>
              )}
            </button>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={closeLightbox}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg bg-black/10 dark:bg-black/75 text-zinc-900 dark:text-white hover:bg-black/20 dark:hover:bg-black border border-black/10 dark:border-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:focus-visible:outline-white transition-colors"
              aria-label={t("mv.closeViewer")}
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
            </button>
          </div>

          {/* Zoom indicator */}
          {zoom > MIN_ZOOM && (
            <div className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-lg bg-black/80 dark:bg-black/75 px-3 py-1 text-xs font-semibold text-white">
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
