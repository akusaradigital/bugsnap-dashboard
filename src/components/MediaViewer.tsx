"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useT } from "@/components/I18nProvider";
import { supabase } from "@/lib/supabase";

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
  /** "members" makes the stream route require proof of access. */
  accessMode?: "public" | "members";
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
  if (!seconds || !isFinite(seconds) || isNaN(seconds) || seconds < 0) return "00:00";
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
  errorMarkers = [],
  accessMode = "public"
}: MediaViewerProps) {
  const { t } = useT();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const lightboxTriggerRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState<number>(0);
  const [hoveredMarker, setHoveredMarker] = useState<ErrorMarker | null>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const isDraggingScrubberRef = useRef(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const wasPlayingBeforeDragRef = useRef(false);
  const dragRef = useRef<{ startX: number; startY: number; panX: number; panY: number; dragging: boolean }>({
    startX: 0, startY: 0, panX: 0, panY: 0, dragging: false,
  });
  const fileId = driveUrl ? driveFileId(driveUrl) : null;
  const imageUrl = fileId ? `https://drive.google.com/thumbnail?id=${fileId}&sz=w2400` : null;
  // Public Drive URL: pointless for a members-only capture (the file is private
  // in Drive), and using it as a fallback would just render a broken tag.
  const directUrl = fileId && accessMode !== "members" ? `https://drive.google.com/uc?export=download&id=${fileId}` : null;
  // For members-only captures the stream route rejects an unsigned request, and
  // <img>/<video> cannot send an Authorization header — so append a signature
  // fetched once below. Public captures need none and stay on the plain URL.
  const [sigQuery, setSigQuery] = useState("");
  const [videoBlobUrl, setVideoBlobUrl] = useState<string | null>(null);
  const needsSig = accessMode === "members";
  const sigReady = !needsSig || sigQuery !== "";
  const streamUrl = fileId && sigReady ? `/api/google-drive/download?id=${encodeURIComponent(fileId)}&type=${type === "video" ? "video" : "screenshot"}&disposition=inline${sigQuery}` : null;
  const downloadUrl = fileId && sigReady ? `/api/google-drive/download?id=${encodeURIComponent(fileId)}&type=${type === "video" ? "video" : "screenshot"}&filename=${encodeURIComponent(title || "capture")}${sigQuery}` : null;
  const previewUrl = fileId ? `https://drive.google.com/file/d/${fileId}/preview` : null;
  const [activeImageSrc, setActiveImageSrc] = useState<string | null>(imageUrl);

  // Fetch full video into a local Blob URL so WebM seeking/scrubbing works instantly in-memory while paused
  useEffect(() => {
    if (type !== "video") return;
    const targetUrl = streamUrl || directUrl || downloadUrl;
    if (!targetUrl) return;

    let cancelled = false;
    const controller = new AbortController();

    fetch(targetUrl, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        const blobUrl = URL.createObjectURL(blob);
        setVideoBlobUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return blobUrl;
        });
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn("MediaViewer: blob fetch fallback to streamUrl:", err);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [type, streamUrl, directUrl, downloadUrl]);

  useEffect(() => {
    return () => {
      if (videoBlobUrl) URL.revokeObjectURL(videoBlobUrl);
    };
  }, [videoBlobUrl]);

  useEffect(() => {
    if (!fileId || !needsSig) { setSigQuery(""); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) return;
      const res = await fetch("/api/google-drive/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fileId }),
      }).catch(() => null);
      if (!res?.ok || cancelled) return;
      const { sig, exp } = await res.json();
      if (!cancelled && sig) setSigQuery(`&sig=${encodeURIComponent(sig)}&exp=${exp}`);
    })();
    return () => { cancelled = true; };
  }, [fileId, needsSig]);

  function handleDownloadMedia(e: React.MouseEvent) {
    e.stopPropagation();
    if (!downloadUrl) return;
    window.location.href = downloadUrl;
  }

  // Reset and verify image loading with fallback
  useEffect(() => {
    setVideoFailed(false);
    setImageFailed(false);
    setImageLoaded(false);
    setLightboxOpen(false);
    setIsPlaying(false);
    setActiveImageSrc(imageUrl);

    if (type === "screenshot" && imageUrl) {
      const probe = new Image();
      probe.referrerPolicy = "no-referrer";
      probe.src = imageUrl;
      probe.onload = () => {
        setActiveImageSrc(imageUrl);
        setImageLoaded(true);
      };
      probe.onerror = () => {
        if (streamUrl) {
          const fallbackProbe = new Image();
          fallbackProbe.src = streamUrl;
          fallbackProbe.onload = () => {
            setActiveImageSrc(streamUrl);
            setImageLoaded(true);
          };
          fallbackProbe.onerror = () => setImageFailed(true);
        } else {
          setImageFailed(true);
        }
      };
    }
  }, [driveUrl, type, imageUrl, streamUrl]);

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

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const effectiveDuration =
    isFinite(videoDuration) && videoDuration > 0
      ? videoDuration
      : videoRef.current?.duration && isFinite(videoRef.current.duration) && videoRef.current.duration > 0
      ? videoRef.current.duration
      : errorMarkers.length > 0
      ? Math.max(...errorMarkers.map((m) => m.timeSec))
      : 0;

  const seekRafRef = useRef<number | null>(null);
  const pendingSeekSecRef = useRef<number | null>(null);

  const applySeek = useCallback((targetSec: number, immediate = false) => {
    const vid = videoRef.current;
    if (!vid) return;

    if (immediate) {
      if (seekRafRef.current !== null) {
        cancelAnimationFrame(seekRafRef.current);
        seekRafRef.current = null;
      }
      pendingSeekSecRef.current = null;
      try {
        vid.currentTime = targetSec;
      } catch {}
      return;
    }

    pendingSeekSecRef.current = targetSec;
    if (seekRafRef.current === null) {
      seekRafRef.current = requestAnimationFrame(() => {
        seekRafRef.current = null;
        const s = pendingSeekSecRef.current;
        if (s !== null && videoRef.current) {
          try {
            const vid = videoRef.current as HTMLVideoElement & { fastSeek?: (time: number) => void };
            if (typeof vid.fastSeek === "function") {
              vid.fastSeek(s);
            } else {
              videoRef.current.currentTime = s;
            }
          } catch {}
        }
      });
    }
  }, []);

  const seekFromPointer = useCallback(
    (clientX: number, immediate = false) => {
      const vid = videoRef.current;
      const track = trackRef.current;
      if (!vid || !track) return;
      const dur =
        isFinite(videoDuration) && videoDuration > 0
          ? videoDuration
          : isFinite(vid.duration) && vid.duration > 0
          ? vid.duration
          : errorMarkers.length > 0
          ? Math.max(...errorMarkers.map((m) => m.timeSec))
          : 0;
      if (dur <= 0) return;

      const rect = track.getBoundingClientRect();
      if (rect.width <= 0) return;
      const clickX = clientX - rect.left;
      const clampedRatio = Math.max(0, Math.min(1, clickX / rect.width));
      const targetSec = clampedRatio * dur;

      setCurrentPlaybackTime(targetSec);
      onTimeUpdate?.(targetSec);

      applySeek(targetSec, immediate);
    },
    [videoDuration, errorMarkers, onTimeUpdate, applySeek]
  );

  const handleTrackPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      if ((e.target as HTMLElement)?.closest?.("button")) return;
      e.preventDefault();
      isDraggingScrubberRef.current = true;
      setIsScrubbing(true);
      wasPlayingBeforeDragRef.current = !videoRef.current?.paused;
      if (videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause();
      }
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {}
      seekFromPointer(e.clientX, true);
    },
    [seekFromPointer]
  );

  const handleTrackPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDraggingScrubberRef.current) return;
      seekFromPointer(e.clientX, false);
    },
    [seekFromPointer]
  );

  const handleTrackPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDraggingScrubberRef.current) return;
      isDraggingScrubberRef.current = false;
      setIsScrubbing(false);
      try {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch {}
      seekFromPointer(e.clientX, true);
      if (wasPlayingBeforeDragRef.current && videoRef.current) {
        videoRef.current.play().catch(() => {});
      }
    },
    [seekFromPointer]
  );

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else if (videoContainerRef.current) {
      videoContainerRef.current.requestFullscreen?.().catch(() => {});
    }
  }, []);

  const togglePlayPause = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    const vid = videoRef.current;
    if (!vid) return;

    if (vid.paused || vid.ended) {
      const isAtEnd =
        vid.ended ||
        (isFinite(vid.duration) && vid.duration > 0 && Math.abs(vid.currentTime - vid.duration) < 0.25) ||
        vid.currentTime === Infinity;
      if (isAtEnd) {
        vid.currentTime = 0;
      }
      const p = vid.play();
      if (p && typeof p.catch === "function") {
        p.catch((err) => console.warn("Video play prevented:", err));
      }
    } else {
      vid.pause();
    }
  }, []);

  // Keyboard shortcut matching extension editor: Space to toggle play/pause
  useEffect(() => {
    if (type !== "video") return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Spacebar") {
        const active = document.activeElement;
        if (
          active &&
          (active.tagName === "INPUT" ||
            active.tagName === "TEXTAREA" ||
            (active as HTMLElement).isContentEditable)
        ) {
          return;
        }
        e.preventDefault();
        togglePlayPause();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [type, togglePlayPause]);

  const unavailable = !fileId || (type !== "video" && type !== "screenshot");

  return (
    <>
      <div
        className="relative flex h-[clamp(18rem,45vw,32rem)] min-h-[18rem] w-full items-center justify-center overflow-hidden rounded-lg bg-[#f4f4f6] dark:bg-zinc-950 p-4"
      >
        {unavailable ? (
          <div className="px-6 text-center text-sm text-zinc-500 dark:text-white/70" role="status">{t("mv.unavailable")}</div>
        ) : type === "video" ? (
          !videoFailed && (streamUrl || directUrl || downloadUrl) ? (
            <div
              ref={videoContainerRef}
              onClick={togglePlayPause}
              className="relative flex h-full w-full items-center justify-center cursor-pointer select-none group/video"
            >
              <video
                ref={videoRef}
                playsInline
                preload="auto"
                src={videoBlobUrl || streamUrl || directUrl || downloadUrl || ""}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => {
                  setIsPlaying(false);
                  if (videoRef.current) videoRef.current.currentTime = 0;
                }}
                onSeeked={(e) => {
                  const vid = e.currentTarget;
                  if (!isDraggingScrubberRef.current && isFinite(vid.currentTime)) {
                    setCurrentPlaybackTime(vid.currentTime);
                    onTimeUpdate?.(vid.currentTime);
                  }
                }}
                onTimeUpdate={(e) => {
                  const cur = e.currentTarget.currentTime;
                  const dur = e.currentTarget.duration;
                  if (isFinite(dur) && dur > 0 && videoDuration !== dur) {
                    setVideoDuration(dur);
                  }
                  if (!isDraggingScrubberRef.current && isFinite(cur)) {
                    setCurrentPlaybackTime(cur);
                    onTimeUpdate?.(cur);
                  }
                }}
                onDurationChange={(e) => {
                  const dur = e.currentTarget.duration;
                  if (isFinite(dur) && dur > 0) {
                    setVideoDuration(dur);
                  }
                }}
                onCanPlay={(e) => {
                  const dur = e.currentTarget.duration;
                  if (isFinite(dur) && dur > 0 && videoDuration !== dur) {
                    setVideoDuration(dur);
                  }
                }}
                onLoadedMetadata={(e) => {
                  const vid = e.currentTarget;
                  if (isFinite(vid.duration) && vid.duration > 0) {
                    setVideoDuration(vid.duration);
                  }
                  if (currentPlaybackTime > 0 && Math.abs(vid.currentTime - currentPlaybackTime) > 0.1) {
                    try {
                      vid.currentTime = currentPlaybackTime;
                    } catch {}
                  } else if (vid.duration === Infinity) {
                    let settled = false;
                    const timeout = setTimeout(() => {
                      if (!settled) {
                        settled = true;
                        if (isFinite(vid.duration) && vid.duration > 0) setVideoDuration(vid.duration);
                      }
                    }, 2500);

                    const onSeekedToStart = () => {
                      vid.removeEventListener("seeked", onSeekedToStart);
                      if (!settled) {
                        settled = true;
                        clearTimeout(timeout);
                        if (isFinite(vid.duration) && vid.duration > 0) setVideoDuration(vid.duration);
                      }
                    };

                    const onSeekedToEnd = () => {
                      vid.removeEventListener("seeked", onSeekedToEnd);
                      if (isFinite(vid.duration) && vid.duration > 0) {
                        setVideoDuration(vid.duration);
                      }
                      vid.addEventListener("seeked", onSeekedToStart, { once: true });
                      if (!isDraggingScrubberRef.current && vid.paused) {
                        vid.currentTime = 0;
                      }
                    };

                    if (vid.paused && vid.currentTime === 0) {
                      vid.addEventListener("seeked", onSeekedToEnd, { once: true });
                      try {
                        vid.currentTime = 1e101;
                      } catch {
                        clearTimeout(timeout);
                        if (isFinite(vid.duration) && vid.duration > 0) setVideoDuration(vid.duration);
                      }
                    }
                  }
                }}
                onError={() => {
                  if (videoRef.current && directUrl && videoRef.current.src !== directUrl) {
                    videoRef.current.src = directUrl;
                    videoRef.current.load();
                  } else {
                    setVideoFailed(true);
                  }
                }}
                className="h-full w-full object-contain pointer-events-none"
                aria-label={title}
              >
                {t("mv.noVideoSupport")}
              </video>

              {/* HUD Play Overlay - Exact Extension Editor Behavior (.video-hud-overlay & .hud-play-btn) */}
              <div
                className={`absolute inset-0 z-10 flex items-center justify-center transition-all duration-200 pointer-events-none ${
                  isPlaying
                    ? "opacity-0 invisible bg-transparent"
                    : "opacity-100 visible bg-slate-950/20"
                }`}
              >
                <div
                  className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-white/95 hover:bg-white text-slate-900 shadow-2xl transition-all duration-200 hover:scale-108 active:scale-95 border border-white/40 cursor-pointer pointer-events-auto"
                  aria-label={t("mv.play")}
                  title={t("mv.play")}
                >
                  <svg
                    className="w-7 h-7 sm:w-8 sm:h-8 fill-current"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </div>
          ) : previewUrl ? (
            <iframe
              src={previewUrl}
              className="h-full w-full border-0"
              allow="autoplay; fullscreen; encrypted-media"
              allowFullScreen
              title={`${title} video preview`}
            />
          ) : (
            <div className="px-6 text-center text-sm text-zinc-500 dark:text-white/70" role="status">{t("mv.unavailable")}</div>
          )
        ) : (activeImageSrc || imageUrl) && !imageFailed ? (
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
                src={activeImageSrc || imageUrl || ""}
                alt={title}
                referrerPolicy="no-referrer"
                onLoad={() => setImageLoaded(true)}
                onError={() => {
                  if (activeImageSrc !== streamUrl && streamUrl) {
                    setActiveImageSrc(streamUrl);
                  } else {
                    setImageFailed(true);
                  }
                }}
                className={`h-full w-full object-contain transition-all duration-200 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
              />
            </div>

            {/* Subtle hover feedback so it's obvious the image is clickable (no center icon per earlier feedback) */}
            <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-150 group-hover:bg-black/10" />

            {/* Download stays as a separate explicit action (not implied by the hover affordance above) */}
            {(directUrl || imageUrl) && (
              <div className="absolute right-3 top-3 z-10 opacity-100 sm:opacity-0 transition-opacity duration-200 sm:group-hover:opacity-100">
                <button
                  type="button"
                  onClick={handleDownloadMedia}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/90 hover:bg-white text-zinc-700 hover:text-zinc-900 dark:bg-zinc-900/80 dark:hover:bg-zinc-900 dark:text-white border border-zinc-200/80 dark:border-white/10 backdrop-blur-md transition-all shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-white cursor-pointer"
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
          <div className="px-6 text-center text-sm text-zinc-500 dark:text-white/70" role="status">{t("mv.unavailable")}</div>
        )}
      </div>

      {type === "video" && !videoFailed && (streamUrl || directUrl || downloadUrl) && (
        <div className="mt-3 rounded-xl border border-border bg-white dark:bg-zinc-900/70 p-3 shadow-xs">
          {errorMarkers.length > 0 && (
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
            </div>
          )}

          {/* Controls row matching extension editor (play on the left, slider track in middle) */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Play/Pause toggle button (.play-btn) */}
            <button
              type="button"
              onClick={togglePlayPause}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-indigo-500/40"
              aria-label={isPlaying ? t("mv.pause") : t("mv.play")}
              title={isPlaying ? t("mv.pause") : t("mv.play")}
            >
              {isPlaying ? (
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Scrubber track (.trim-track-wrapper) */}
            <div
              ref={trackRef}
              onPointerDown={handleTrackPointerDown}
              onPointerMove={handleTrackPointerMove}
              onPointerUp={handleTrackPointerUp}
              onPointerCancel={handleTrackPointerUp}
              className="relative flex-1 h-6 flex items-center cursor-pointer select-none touch-none group/track"
            >
              {/* Track bar */}
              <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-700/60 overflow-hidden relative pointer-events-none">
                {/* Progress bar */}
                <div
                  className={`h-full bg-indigo-600 rounded-full ${
                    isScrubbing ? "transition-none" : "transition-all duration-75"
                  }`}
                  style={{ width: `${effectiveDuration > 0 ? (currentPlaybackTime / effectiveDuration) * 100 : 0}%` }}
                />
              </div>

              {/* Scrubber Playhead thumb (.trim-playhead) */}
              <div
                className={`absolute w-3.5 h-3.5 rounded-full bg-indigo-600 border-2 border-white dark:border-zinc-900 shadow-md pointer-events-none top-1/2 -translate-y-1/2 -translate-x-1/2 transition-transform duration-75 group-hover/track:scale-125 ${
                  isScrubbing ? "scale-125" : ""
                }`}
                style={{ left: `${effectiveDuration > 0 ? (currentPlaybackTime / effectiveDuration) * 100 : 0}%` }}
              />

              {/* Error Marker Pins */}
              {errorMarkers.map((marker, idx) => {
                const leftPercent = effectiveDuration > 0
                  ? Math.min(99, Math.max(1, (marker.timeSec / effectiveDuration) * 100))
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

            {/* Time display */}
            <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 shrink-0 select-none">
              {formatSec(currentPlaybackTime)} / {formatSec(effectiveDuration)}
            </div>

            {/* Speed selector (.playback-speed-label) */}
            <div className="flex items-center gap-1 shrink-0">
              <label htmlFor="video-playback-speed" className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium hidden sm:inline">
                {t("mv.speed")}
              </label>
              <select
                id="video-playback-speed"
                value={playbackRate}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setPlaybackRate(val);
                  if (videoRef.current) videoRef.current.playbackRate = val;
                }}
                className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-md px-1.5 py-1 border border-zinc-200 dark:border-zinc-700 cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                title={t("mv.speed")}
              >
                <option value="0.5">0.5x</option>
                <option value="1">1x</option>
                <option value="1.5">1.5x</option>
                <option value="2">2x</option>
              </select>
            </div>

            {/* Fullscreen button */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer focus:outline-hidden"
              aria-label={isFullscreen ? t("mv.exitFullscreen") : t("mv.openFullscreen")}
              title={isFullscreen ? t("mv.exitFullscreen") : t("mv.openFullscreen")}
            >
              {isFullscreen ? (
                <svg className="w-4 h-4 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                </svg>
              ) : (
                <svg className="w-4 h-4 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                </svg>
              )}
            </button>
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
        className="m-auto h-[85vh] w-[90vw] max-w-5xl rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-0 text-zinc-900 dark:text-white shadow-2xl backdrop:bg-black/40 dark:backdrop:bg-black/70 backdrop:backdrop-blur-sm"
      >
        <div
          className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-2xl p-6 sm:p-10 bg-zinc-50/50 dark:bg-zinc-950/50"
          onWheel={handleWheel}
        >
          {/* Controls */}
          <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
            {(directUrl || imageUrl) && (
              <button
                type="button"
                onClick={handleDownloadMedia}
                className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg bg-white/90 hover:bg-zinc-100 text-zinc-700 hover:text-zinc-900 border border-zinc-200 shadow-md dark:bg-zinc-900/90 dark:hover:bg-zinc-800 dark:text-white dark:border-white/10 dark:shadow-lg backdrop-blur-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-white transition-colors cursor-pointer"
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
              className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg bg-white/90 hover:bg-zinc-100 text-zinc-700 hover:text-zinc-900 border border-zinc-200 shadow-md dark:bg-zinc-900/90 dark:hover:bg-zinc-800 dark:text-white dark:border-white/10 dark:shadow-lg backdrop-blur-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-white transition-colors cursor-pointer"
              aria-label={t("mv.closeViewer")}
              title={t("mv.closeViewer")}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
            </button>
          </div>

          {/* Zoom indicator */}
          {zoom > MIN_ZOOM && (
            <div className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-lg bg-white/95 dark:bg-zinc-900/90 border border-zinc-200 dark:border-white/10 px-3 py-1 text-xs font-semibold text-zinc-800 dark:text-white shadow-md dark:shadow-lg backdrop-blur-md">
              {t("mv.dragToPan", { zoom: Math.round(zoom * 100) })}
            </div>
          )}

          {(activeImageSrc || imageUrl) && (
            <div
              className={`h-full w-full flex items-center justify-center overflow-hidden ${zoom > MIN_ZOOM ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"}`}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onDoubleClick={handleDoubleClick}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeImageSrc || imageUrl || ""}
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
