"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useT } from "@/components/I18nProvider";
import { supabase } from "@/lib/supabase";

export interface ErrorMarker {
  timeSec: number;
  label: string;
  type?: "error" | "warn";
  badgeText?: string;
  category?: "network" | "console" | "warn";
  status?: number;
  count?: number;
  popupTitle?: string;
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
  /** The password the viewer unlocked with, if the capture has one. The stream
   *  route gates password-protected captures too, and this is what signs them. */
  unlockPassword?: string | null;
  initialDuration?: number | null;
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

function getSavedVolume(): { volume: number; muted: boolean } {
  if (typeof window === "undefined") return { volume: 1, muted: false };
  try {
    const v = localStorage.getItem("bugsnap_volume");
    const m = localStorage.getItem("bugsnap_muted");
    return {
      volume: v !== null && !isNaN(Number(v)) ? Math.max(0, Math.min(1, Number(v))) : 1,
      muted: m === "true",
    };
  } catch {
    return { volume: 1, muted: false };
  }
}

function saveVolumeState(volume: number, muted: boolean) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("bugsnap_volume", String(volume));
    localStorage.setItem("bugsnap_muted", String(muted));
  } catch {}
}

function getFsElement(): Element | null {
  if (typeof document === "undefined") return null;
  const d = document as unknown as {
    fullscreenElement?: Element;
    webkitFullscreenElement?: Element;
    mozFullScreenElement?: Element;
    msFullscreenElement?: Element;
  };
  return d.fullscreenElement || d.webkitFullscreenElement || d.mozFullScreenElement || d.msFullscreenElement || null;
}

export default function MediaViewer({
  type,
  driveUrl,
  title,
  onTimeUpdate,
  seekToTime,
  errorMarkers = [],
  accessMode = "public",
  initialDuration = 0,
  unlockPassword = null,
}: MediaViewerProps) {
  const { t } = useT();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const lightboxTriggerRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const imageViewportRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [videoDuration, setVideoDuration] = useState<number>(initialDuration || 0);
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState<number>(0);
  const [hoveredMarker, setHoveredMarker] = useState<ErrorMarker | null>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const isDraggingScrubberRef = useRef(false);
  const [showControls, setShowControls] = useState(true);
  const isHoveringControlsRef = useRef(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Audio and PiP states
  const [volumeState, setVolumeState] = useState(getSavedVolume);
  const [isPip, setIsPip] = useState(false);
  const isPipSupported =
    typeof document !== "undefined" &&
    ("pictureInPictureEnabled" in document ||
      (typeof HTMLVideoElement !== "undefined" && "webkitSupportsPresentationMode" in HTMLVideoElement.prototype));

  // Flags for click discrimination & WebM duration discovery
  const isDiscoveringDurationRef = useRef(false);
  // `initialDuration` is the extension's own recording-timer value: a good
  // placeholder before metadata loads, but it drifts from the real media length
  // (encoder flush, dropped frames). Only a decoder-derived figure is trusted,
  // and until we have one the discovery seek must keep being allowed to run.
  const isDurationConfirmedRef = useRef(false);
  const discoveryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);
  const videoClickCoordRef = useRef<{ x: number; y: number } | null>(null);

  const progressBarRef = useRef<HTMLDivElement>(null);
  const playheadRef = useRef<HTMLDivElement>(null);
  const fsProgressBarRef = useRef<HTMLDivElement>(null);
  const fsPlayheadRef = useRef<HTMLDivElement>(null);

  const updateScrubberDom = useCallback((percent: number) => {
    const pStr = `${Math.max(0, Math.min(100, percent))}%`;
    if (progressBarRef.current) progressBarRef.current.style.width = pStr;
    if (playheadRef.current) playheadRef.current.style.left = pStr;
    if (fsProgressBarRef.current) fsProgressBarRef.current.style.width = pStr;
    if (fsPlayheadRef.current) fsPlayheadRef.current.style.left = pStr;
  }, []);

  // Every decoder-derived duration lands here. Once one arrives the value is
  // frozen: the old code let onTimeUpdate raise it whenever `cur > videoDuration`,
  // so a WebM reporting Infinity had its "total" rewritten to the playhead on
  // every tick - which is exactly why the right-hand number crept up during
  // playback and the bar never reached the end.
  const commitDuration = useCallback((dur: number) => {
    if (!isFinite(dur) || dur <= 0) return;
    isDurationConfirmedRef.current = true;
    setVideoDuration((prev) => (Math.abs(prev - dur) < 0.05 ? prev : dur));
  }, []);

  // WebM Infinity duration discovery: seek to end to let decoder calculate true duration
  const discoverWebmDuration = useCallback((vid: HTMLVideoElement) => {
    if (!vid || !vid.paused || (isFinite(vid.duration) && vid.duration > 0) || isDiscoveringDurationRef.current) return;
    // Was `videoDuration > 0 || initialDuration > 0`, which meant the metadata
    // placeholder suppressed discovery outright and the displayed total stayed
    // an estimate forever. Only a confirmed decoder value stops the seek.
    if (isDurationConfirmedRef.current) return;

    isDiscoveringDurationRef.current = true;
    const cleanup = () => {
      isDiscoveringDurationRef.current = false;
      if (discoveryTimeoutRef.current) {
        clearTimeout(discoveryTimeoutRef.current);
        discoveryTimeoutRef.current = null;
      }
      vid.removeEventListener("seeked", onSeekedToEnd);
      vid.removeEventListener("seeked", onSeekedToStart);
      vid.removeEventListener("error", cleanup);
    };

    discoveryTimeoutRef.current = setTimeout(() => {
      cleanup();
      if (isFinite(vid.currentTime) && vid.currentTime > 0) {
        try {
          vid.currentTime = 0;
        } catch {}
      }
    }, 2000);

    const onSeekedToStart = () => {
      cleanup();
    };

    const onSeekedToEnd = () => {
      vid.removeEventListener("seeked", onSeekedToEnd);
      const discoveredDur = vid.currentTime;
      commitDuration(discoveredDur);
      vid.addEventListener("seeked", onSeekedToStart, { once: true });
      try {
        vid.currentTime = 0;
      } catch {
        cleanup();
      }
    };

    vid.addEventListener("seeked", onSeekedToEnd, { once: true });
    vid.addEventListener("error", cleanup, { once: true });
    try {
      vid.currentTime = 1e101;
    } catch {
      cleanup();
    }
  }, [commitDuration]);

  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isFullscreen && isPlaying && !isDraggingScrubberRef.current && !isHoveringControlsRef.current) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 2500);
    }
  }, [isFullscreen, isPlaying]);

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    resetControlsTimeout();
  }, [resetControlsTimeout]);
  const trackRef = useRef<HTMLDivElement>(null);
  const wasPlayingBeforeDragRef = useRef(false);
  const dragRef = useRef<{ startX: number; startY: number; panX: number; panY: number; dragging: boolean }>({
    startX: 0, startY: 0, panX: 0, panY: 0, dragging: false,
  });
  const fileId = driveUrl ? driveFileId(driveUrl) : null;
  const isDirectWebUrl = Boolean(
    driveUrl &&
      !fileId &&
      (driveUrl.startsWith("http://") || driveUrl.startsWith("https://") || driveUrl.startsWith("data:image/"))
  );
  const isImage = type === "screenshot" || type === "image";
  const imageUrl = fileId
    ? `https://drive.google.com/thumbnail?id=${fileId}&sz=w2400`
    : isDirectWebUrl
    ? driveUrl
    : null;
  // Public Drive URL: pointless for a members-only capture (the file is private
  // in Drive), and using it as a fallback would just render a broken tag.
  const directUrl = fileId && accessMode !== "members" && !unlockPassword ? `https://drive.google.com/uc?export=download&id=${fileId}` : isDirectWebUrl ? driveUrl : null;
  // For members-only captures the stream route rejects an unsigned request, and
  // <img>/<video> cannot send an Authorization header - so append a signature
  // fetched once below. Public captures need none and stay on the plain URL.
  const [sigQuery, setSigQuery] = useState("");
  const needsSig = accessMode === "members" || Boolean(unlockPassword);
  const sigReady = !needsSig || sigQuery !== "";
  const streamUrl = fileId && sigReady ? `/api/google-drive/download?id=${encodeURIComponent(fileId)}&type=${type === "video" ? "video" : "screenshot"}&disposition=inline${sigQuery}` : null;
  const downloadUrl = fileId && sigReady ? `/api/google-drive/download?id=${encodeURIComponent(fileId)}&type=${type === "video" ? "video" : "screenshot"}&filename=${encodeURIComponent(title || "capture")}${sigQuery}` : isDirectWebUrl ? driveUrl : null;
  const previewUrl = fileId ? `https://drive.google.com/file/d/${fileId}/preview` : null;
  const [activeImageSrc, setActiveImageSrc] = useState<string | null>(imageUrl);
  const [activeVideoSrc, setActiveVideoSrc] = useState<string>("");

  useEffect(() => {
    const src = streamUrl || directUrl || downloadUrl || "";
    setActiveVideoSrc(src);
  }, [streamUrl, directUrl, downloadUrl]);

  useEffect(() => {
    if (initialDuration && initialDuration > 0 && (!videoDuration || videoDuration === 0)) {
      setVideoDuration(initialDuration);
    }
  }, [initialDuration, videoDuration]);

  // Smooth 60fps playhead update loop during video playback
  useEffect(() => {
    if (!isPlaying) return;
    let animId: number;
    let lastSec = -1;
    const step = () => {
      const vid = videoRef.current;
      if (vid && !vid.paused && !isDraggingScrubberRef.current) {
        const cur = vid.currentTime;
        const dur =
          isFinite(videoDuration) && videoDuration > 0
            ? videoDuration
            : isFinite(vid.duration) && vid.duration > 0
            ? vid.duration
            : 0;
        if (isFinite(cur) && dur > 0) {
          const pct = (cur / dur) * 100;
          updateScrubberDom(pct);
          const curFloor = Math.floor(cur);
          if (curFloor !== lastSec) {
            lastSec = curFloor;
            setCurrentPlaybackTime(cur);
            // Parent only renders a whole-second readout, so it gets the same
            // once-per-second tick instead of the native ~4x/s one.
            onTimeUpdate?.(cur);
          }
        }
      }
      animId = requestAnimationFrame(step);
    };
    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, videoDuration, updateScrubberDom, onTimeUpdate]);

  useEffect(() => {
    if (!fileId) { setSigQuery(""); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      // Either credential will do: a session for members-only, the unlock
      // password for a protected public capture. Neither means no signature.
      if (!token && !unlockPassword) return;
      // Fetched even when `needsSig` is false: a member viewing their own
      // password-protected capture skips the lock screen, so there is no unlock
      // password to flag it - but the stream route still gates it. An extra
      // signature on an unprotected capture is ignored.
      const res = await fetch("/api/google-drive/sign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ fileId, password: unlockPassword || undefined }),
      }).catch(() => null);
      if (!res?.ok || cancelled) return;
      const { sig, exp } = await res.json();
      if (!cancelled && sig) setSigQuery(`&sig=${encodeURIComponent(sig)}&exp=${exp}`);
    })();
    return () => { cancelled = true; };
  }, [fileId, needsSig, unlockPassword]);

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

    let cancelled = false;
    let probe: HTMLImageElement | null = null;
    let fallbackProbe: HTMLImageElement | null = null;

    if (isImage && imageUrl) {
      probe = new Image();
      probe.referrerPolicy = "no-referrer";
      probe.src = imageUrl;
      probe.onload = () => {
        if (cancelled) return;
        setActiveImageSrc(imageUrl);
        setImageLoaded(true);
      };
      probe.onerror = () => {
        if (cancelled) return;
        if (streamUrl) {
          fallbackProbe = new Image();
          fallbackProbe.src = streamUrl;
          fallbackProbe.onload = () => {
            if (cancelled) return;
            setActiveImageSrc(streamUrl);
            setImageLoaded(true);
          };
          fallbackProbe.onerror = () => {
            if (cancelled) return;
            if (directUrl && directUrl !== streamUrl) {
              setActiveImageSrc(directUrl);
              setImageLoaded(true);
            } else {
              setImageFailed(true);
            }
          };
        } else if (directUrl) {
          setActiveImageSrc(directUrl);
          setImageLoaded(true);
        } else {
          setImageFailed(true);
        }
      };
    }

    return () => {
      cancelled = true;
      if (probe) {
        probe.onload = null;
        probe.onerror = null;
      }
      if (fallbackProbe) {
        fallbackProbe.onload = null;
        fallbackProbe.onerror = null;
      }
    };
  }, [driveUrl, type, imageUrl, streamUrl, directUrl, isImage]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (lightboxOpen && dialog && !dialog.open) {
      try {
        dialog.showModal();
      } catch {}
      closeButtonRef.current?.focus();
    }
  }, [lightboxOpen]);

  // Reset zoom/pan whenever the lightbox opens or closes
  useEffect(() => {
    setZoom(MIN_ZOOM);
    setPan({ x: 0, y: 0 });
  }, [lightboxOpen]);

  function closeLightbox() {
    try {
      dialogRef.current?.close();
    } catch {}
  }

  function handleDialogClose() {
    setLightboxOpen(false);
    setPan({ x: 0, y: 0 });
    setZoom(MIN_ZOOM);
    lightboxTriggerRef.current?.focus();
  }

  const clampPan = useCallback((x: number, y: number, currentZoom: number) => {
    if (currentZoom <= MIN_ZOOM) return { x: 0, y: 0 };
    const el = imageViewportRef.current;
    if (!el) return { x, y };
    const maxPanX = Math.max(0, (el.clientWidth * (currentZoom - 1)) / 2);
    const maxPanY = Math.max(0, (el.clientHeight * (currentZoom - 1)) / 2);
    return {
      x: Math.max(-maxPanX, Math.min(maxPanX, x)),
      y: Math.max(-maxPanY, Math.min(maxPanY, y)),
    };
  }, []);

  const resetView = useCallback(() => {
    setZoom(MIN_ZOOM);
    setPan({ x: 0, y: 0 });
  }, []);

  const zoomIn = useCallback(() => {
    setZoom((z) => Math.min(MAX_ZOOM, z + STEP_ZOOM));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((z) => {
      const next = Math.max(MIN_ZOOM, z - STEP_ZOOM);
      if (next <= MIN_ZOOM) {
        setPan({ x: 0, y: 0 });
      } else {
        setPan((p) => clampPan(p.x, p.y, next));
      }
      return next;
    });
  }, [clampPan]);

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();
    const nextZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom + (e.deltaY > 0 ? -STEP_ZOOM : STEP_ZOOM)));
    setZoom(nextZoom);
    if (nextZoom <= MIN_ZOOM) {
      setPan({ x: 0, y: 0 });
    } else {
      setPan((prev) => clampPan(prev.x, prev.y, nextZoom));
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
    try {
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    } catch {}
  }

  function handlePointerMove(e: React.PointerEvent) {
    const drag = dragRef.current;
    if (!drag.dragging || zoom <= MIN_ZOOM) return;
    const rawX = drag.panX + (e.clientX - drag.startX);
    const rawY = drag.panY + (e.clientY - drag.startY);
    setPan(clampPan(rawX, rawY, zoom));
  }

  function handlePointerUp(e: React.PointerEvent) {
    dragRef.current.dragging = false;
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {}
  }

  // Multi-touch pinch-to-zoom support
  const touchDistanceRef = useRef<number | null>(null);
  const initialTouchZoomRef = useRef<number>(MIN_ZOOM);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchDistanceRef.current = Math.hypot(dx, dy);
      initialTouchZoomRef.current = zoom;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchDistanceRef.current !== null && touchDistanceRef.current > 0) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const factor = dist / touchDistanceRef.current;
      const targetZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, initialTouchZoomRef.current * factor));
      setZoom(targetZoom);
      if (targetZoom <= MIN_ZOOM) {
        setPan({ x: 0, y: 0 });
      } else {
        setPan((p) => clampPan(p.x, p.y, targetZoom));
      }
    }
  };

  const handleTouchEnd = () => {
    touchDistanceRef.current = null;
  };

  // Keyboard controls when lightbox is active
  useEffect(() => {
    if (!lightboxOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        zoomIn();
      } else if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        zoomOut();
      } else if (e.key === "0") {
        e.preventDefault();
        resetView();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setPan((p) => clampPan(p.x + 40, p.y, zoom));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setPan((p) => clampPan(p.x - 40, p.y, zoom));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setPan((p) => clampPan(p.x, p.y + 40, zoom));
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setPan((p) => clampPan(p.x, p.y - 40, zoom));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lightboxOpen, zoom, clampPan, zoomIn, zoomOut, resetView]);

  function handleDoubleClick() {
    if (zoom > MIN_ZOOM) {
      resetView();
    } else {
      setZoom(DOUBLE_CLICK_ZOOM);
      setPan({ x: 0, y: 0 });
    }
  }

  const effectiveDuration =
    isFinite(videoDuration) && videoDuration > 0
      ? videoDuration
      : videoRef.current?.duration && isFinite(videoRef.current.duration) && videoRef.current.duration > 0
      ? videoRef.current.duration
      : errorMarkers.length > 0
      ? Math.max(...errorMarkers.map((m) => m.timeSec))
      : 0;

  // Synchronize seek target time from external controls (DevTools / Timeline dots) without forcing autoplay
  useEffect(() => {
    if (typeof seekToTime === "number" && !isNaN(seekToTime) && videoRef.current) {
      try {
        videoRef.current.currentTime = Math.max(0, seekToTime);
      } catch {}
      setCurrentPlaybackTime(seekToTime);
      if (effectiveDuration > 0) {
        updateScrubberDom((seekToTime / effectiveDuration) * 100);
      }
    }
  }, [seekToTime, effectiveDuration, updateScrubberDom]);

  useEffect(() => {
    const onFsChange = () => {
      const fsActive = !!getFsElement();
      setIsFullscreen(fsActive);
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      if (fsActive && isPlaying) {
        controlsTimeoutRef.current = setTimeout(() => {
          setShowControls(false);
        }, 2500);
      }
    };

    const events = ["fullscreenchange", "webkitfullscreenchange", "mozfullscreenchange", "MSFullscreenChange"];
    events.forEach((ev) => document.addEventListener(ev, onFsChange));

    const vid = videoRef.current;
    const onIosFsBegin = () => setIsFullscreen(true);
    const onIosFsEnd = () => setIsFullscreen(false);
    vid?.addEventListener("webkitbeginfullscreen", onIosFsBegin);
    vid?.addEventListener("webkitendfullscreen", onIosFsEnd);

    return () => {
      events.forEach((ev) => document.removeEventListener(ev, onFsChange));
      vid?.removeEventListener("webkitbeginfullscreen", onIosFsBegin);
      vid?.removeEventListener("webkitendfullscreen", onIosFsEnd);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isPlaying]);

  // Picture-in-picture listener
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    const onEnter = () => setIsPip(true);
    const onLeave = () => setIsPip(false);
    vid.addEventListener("enterpictureinpicture", onEnter);
    vid.addEventListener("leavepictureinpicture", onLeave);
    return () => {
      vid.removeEventListener("enterpictureinpicture", onEnter);
      vid.removeEventListener("leavepictureinpicture", onLeave);
    };
  }, []);

  // Sync volume, muted, and playbackRate with HTMLVideoElement
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volumeState.volume;
      videoRef.current.muted = volumeState.muted;
    }
  }, [volumeState, activeVideoSrc]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  useEffect(() => {
    if (!isFullscreen) {
      setShowControls(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      return;
    }
    if (!isPlaying) {
      setShowControls(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    } else {
      resetControlsTimeout();
    }
  }, [isPlaying, isFullscreen, resetControlsTimeout]);

  const seekRafRef = useRef<number | null>(null);
  const pendingSeekSecRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (seekRafRef.current !== null) {
        cancelAnimationFrame(seekRafRef.current);
        seekRafRef.current = null;
      }
    };
  }, []);

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
      if (!isFinite(dur) || dur <= 0) return;

      const rect = track.getBoundingClientRect();
      if (rect.width <= 0) return;
      const clickX = clientX - rect.left;
      const clampedRatio = Math.max(0, Math.min(1, clickX / rect.width));
      const targetSec = clampedRatio * dur;

      updateScrubberDom(clampedRatio * 100);
      setCurrentPlaybackTime(targetSec);
      onTimeUpdate?.(targetSec);

      applySeek(targetSec, immediate);
    },
    [videoDuration, errorMarkers, onTimeUpdate, applySeek, updateScrubberDom]
  );

  const handleTrackPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      if ((e.target as HTMLElement)?.closest?.("button")) return;
      e.preventDefault();
      isDraggingScrubberRef.current = true;
      setIsScrubbing(true);
      setShowControls(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
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
        const vid = videoRef.current;
        const dur = effectiveDuration > 0 ? effectiveDuration : vid.duration;
        if (isFinite(dur) && dur > 0 && Math.abs(vid.currentTime - dur) < 0.35) {
          vid.currentTime = 0;
          setCurrentPlaybackTime(0);
          updateScrubberDom(0);
          onTimeUpdate?.(0);
        }
        vid.play().catch((err) => {
          if (err?.name !== "AbortError") console.warn("Video play prevented:", err);
        });
      }
      resetControlsTimeout();
    },
    [seekFromPointer, resetControlsTimeout, effectiveDuration, updateScrubberDom, onTimeUpdate]
  );

  const handleTrackPointerCancel = useCallback(() => {
    if (!isDraggingScrubberRef.current) return;
    isDraggingScrubberRef.current = false;
    setIsScrubbing(false);
    if (wasPlayingBeforeDragRef.current && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
    resetControlsTimeout();
  }, [resetControlsTimeout]);

  // Global pointer release listeners to prevent scrubber dragging lock-up if pointer leaves track
  useEffect(() => {
    const handleGlobalPointerUp = () => {
      if (isDraggingScrubberRef.current) {
        isDraggingScrubberRef.current = false;
        setIsScrubbing(false);
        if (wasPlayingBeforeDragRef.current && videoRef.current) {
          videoRef.current.play().catch(() => {});
        }
      }
    };
    window.addEventListener("pointerup", handleGlobalPointerUp);
    window.addEventListener("pointercancel", handleGlobalPointerUp);
    return () => {
      window.removeEventListener("pointerup", handleGlobalPointerUp);
      window.removeEventListener("pointercancel", handleGlobalPointerUp);
    };
  }, []);

  const toggleMute = useCallback(() => {
    setVolumeState((prev) => {
      const nextMuted = !prev.muted;
      if (videoRef.current) {
        videoRef.current.muted = nextMuted;
        videoRef.current.volume = prev.volume;
      }
      saveVolumeState(prev.volume, nextMuted);
      return { ...prev, muted: nextMuted };
    });
  }, []);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    const newVol = isNaN(val) ? 1 : Math.max(0, Math.min(1, val));
    const nextMuted = newVol === 0;
    if (videoRef.current) {
      videoRef.current.volume = newVol;
      videoRef.current.muted = nextMuted;
    }
    saveVolumeState(newVol, nextMuted);
    setVolumeState({ volume: newVol, muted: nextMuted });
  }, []);

  const togglePip = useCallback(async () => {
    const vid = videoRef.current as (HTMLVideoElement & {
      webkitSupportsPresentationMode?: (mode: string) => boolean;
      webkitPresentationMode?: string;
      webkitSetPresentationMode?: (mode: string) => void;
    }) | null;
    if (!vid) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled && vid.requestPictureInPicture) {
        await vid.requestPictureInPicture();
      } else if (vid.webkitSupportsPresentationMode?.("picture-in-picture")) {
        vid.webkitSetPresentationMode?.(
          vid.webkitPresentationMode === "picture-in-picture" ? "inline" : "picture-in-picture"
        );
      }
    } catch (err) {
      console.warn("PiP toggle failed:", err);
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    const fsEl = getFsElement();
    const d = document as unknown as {
      exitFullscreen?: () => Promise<void>;
      webkitExitFullscreen?: () => Promise<void>;
      mozCancelFullScreen?: () => Promise<void>;
      msExitFullscreen?: () => Promise<void>;
    };

    if (fsEl) {
      const exitFn = d.exitFullscreen || d.webkitExitFullscreen || d.mozCancelFullScreen || d.msExitFullscreen;
      if (exitFn) {
        exitFn.call(document)?.catch(() => {});
      }
      return;
    }

    const container = videoContainerRef.current as (HTMLDivElement & {
      webkitRequestFullscreen?: () => Promise<void>;
      mozRequestFullScreen?: () => Promise<void>;
      msRequestFullscreen?: () => Promise<void>;
    }) | null;

    const vid = videoRef.current as (HTMLVideoElement & {
      webkitEnterFullscreen?: () => void;
    }) | null;

    if (container?.requestFullscreen) {
      container.requestFullscreen().catch(() => {});
    } else if (container?.webkitRequestFullscreen) {
      container.webkitRequestFullscreen().catch(() => {});
    } else if (container?.mozRequestFullScreen) {
      container.mozRequestFullScreen().catch(() => {});
    } else if (container?.msRequestFullscreen) {
      container.msRequestFullscreen().catch(() => {});
    } else if (vid?.webkitEnterFullscreen) {
      try {
        vid.webkitEnterFullscreen();
      } catch {}
    }
  }, []);

  const togglePlayPause = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    const vid = videoRef.current;
    if (!vid) return;

    if (vid.paused || vid.ended) {
      const dur = effectiveDuration > 0 ? effectiveDuration : vid.duration;
      const isAtEnd =
        vid.ended ||
        (isFinite(dur) && dur > 0 && Math.abs(vid.currentTime - dur) < 0.35);
      if (isAtEnd) {
        vid.currentTime = 0;
        setCurrentPlaybackTime(0);
        updateScrubberDom(0);
        onTimeUpdate?.(0);
      }
      const p = vid.play();
      if (p && typeof p.catch === "function") {
        p.catch((err) => {
          if (err?.name !== "AbortError") console.warn("Video play prevented:", err);
        });
      }
    } else {
      vid.pause();
    }
  }, [effectiveDuration, updateScrubberDom, onTimeUpdate]);

  // Click vs Double-click discrimination for play/pause and fullscreen
  const handleVideoClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoClickCoordRef.current) {
      const dx = Math.abs(e.clientX - videoClickCoordRef.current.x);
      const dy = Math.abs(e.clientY - videoClickCoordRef.current.y);
      videoClickCoordRef.current = null;
      if (dx > 6 || dy > 6) return;
    }
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
      toggleFullscreen();
    } else {
      clickTimerRef.current = setTimeout(() => {
        clickTimerRef.current = null;
        togglePlayPause();
      }, 220);
    }
  }, [toggleFullscreen, togglePlayPause]);

  useEffect(() => {
    return () => {
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    };
  }, []);

  // Keyboard shortcuts matching extension editor: Space (play/pause), Left/Right (seek), F (fullscreen), M (mute)
  useEffect(() => {
    if (type !== "video") return;

    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.tagName === "BUTTON" ||
          target.isContentEditable ||
          target.closest?.("[role='dialog']") ||
          target.closest?.("dialog"))
      ) {
        return;
      }

      const vid = videoRef.current;
      if (!vid) return;

      if (e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        const targetSec = Math.max(0, vid.currentTime - 5);
        try { vid.currentTime = targetSec; } catch {}
        setCurrentPlaybackTime(targetSec);
        if (effectiveDuration > 0) updateScrubberDom((targetSec / effectiveDuration) * 100);
        onTimeUpdate?.(targetSec);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        const maxSec = effectiveDuration > 0 ? effectiveDuration : vid.duration || Infinity;
        const targetSec = Math.min(maxSec, vid.currentTime + 5);
        try { vid.currentTime = targetSec; } catch {}
        setCurrentPlaybackTime(targetSec);
        if (effectiveDuration > 0) updateScrubberDom((targetSec / effectiveDuration) * 100);
        onTimeUpdate?.(targetSec);
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        toggleMute();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [type, togglePlayPause, toggleFullscreen, toggleMute, effectiveDuration, updateScrubberDom, onTimeUpdate]);

  const renderControls = (inFs: boolean) => (
    <>
      {errorMarkers.length > 0 && (
        <div className="flex items-center justify-between gap-2 mb-2 text-xs">
          <div className={`flex items-center gap-1.5 font-medium ${inFs ? "text-white" : "text-foreground"}`}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            <span>Interactive Error Timeline</span>
            <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
              inFs
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                : "bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400"
            }`}>
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
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#89BD49] hover:bg-[#6B9A35] text-white shadow-md shadow-[#89BD49]/25 hover:scale-105 active:scale-95 transition-all cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-[#89BD49]/40"
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
          onPointerCancel={handleTrackPointerCancel}
          className="relative flex-1 h-6 flex items-center cursor-pointer select-none touch-none group/track"
        >
          {/* Track bar */}
          <div className={`w-full h-2 rounded-full overflow-hidden relative pointer-events-none ${
            inFs ? "bg-white/20" : "bg-zinc-200 dark:bg-zinc-700/60"
          }`}>
            {/* Progress bar */}
            <div
              ref={inFs ? fsProgressBarRef : progressBarRef}
              className={`h-full bg-[#89BD49] rounded-full ${
                isScrubbing || isPlaying ? "transition-none" : "transition-all duration-75"
              }`}
              style={{ width: `${effectiveDuration > 0 ? (currentPlaybackTime / effectiveDuration) * 100 : 0}%` }}
            />
          </div>

          {/* Scrubber Playhead thumb (.trim-playhead) */}
          <div
            ref={inFs ? fsPlayheadRef : playheadRef}
            className={`absolute w-3.5 h-3.5 rounded-full bg-[#89BD49] border-2 border-white dark:border-zinc-900 shadow-md pointer-events-none top-1/2 -translate-y-1/2 -translate-x-1/2 group-hover/track:scale-125 ${
              isScrubbing || isPlaying ? "transition-none" : "transition-transform duration-75"
            } ${isScrubbing ? "scale-125" : ""}`}
            style={{ left: `${effectiveDuration > 0 ? (currentPlaybackTime / effectiveDuration) * 100 : 0}%` }}
          />

          {/* Error Marker Pins & Badges matching Image #19 */}
          {errorMarkers.map((marker, idx) => {
            const leftPercent = effectiveDuration > 0
              ? Math.min(99, Math.max(1, (marker.timeSec / effectiveDuration) * 100))
              : ((idx + 1) / (errorMarkers.length + 1)) * 100;
            const isNearActive = Math.abs(currentPlaybackTime - marker.timeSec) < 1.2;
            const isHovered = hoveredMarker === marker;

            // Determine badge color and label
            const isWarn = marker.type === "warn" || marker.category === "warn";
            const is5xx = marker.status && marker.status >= 500;
            const badgeBg = isWarn
              ? "bg-amber-500 hover:bg-amber-600"
              : is5xx
              ? "bg-red-600 hover:bg-red-700"
              : "bg-rose-500 hover:bg-rose-600";

            const badgeText = marker.badgeText || (marker.status ? String(marker.status) : isWarn ? "warn" : "err");
            const popupTitle = marker.popupTitle || (marker.category === "network" ? `${marker.count || 1} Network Error` : `${marker.count || 1} Error`);

            return (
              <div
                key={idx}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 flex items-center justify-center pointer-events-auto"
                style={{ left: `${leftPercent}%` }}
              >
                {/* Popover Pill matching Image #19 */}
                {(isHovered || isNearActive) && (
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-30 pointer-events-none transition-all duration-150 animate-in fade-in zoom-in-95">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-950/95 dark:bg-black/95 text-white text-[11px] font-semibold shadow-xl border border-white/15 whitespace-nowrap backdrop-blur-xs">
                      <span>{popupTitle}</span>
                      <svg className="w-3 h-3 text-zinc-300 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </div>
                  </div>
                )}

                {/* Circular Badge matching Image #19 */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (videoRef.current) {
                      try {
                        videoRef.current.currentTime = marker.timeSec;
                      } catch {}
                      setCurrentPlaybackTime(marker.timeSec);
                      if (effectiveDuration > 0) {
                        updateScrubberDom((marker.timeSec / effectiveDuration) * 100);
                      }
                      onTimeUpdate?.(marker.timeSec);
                    }
                  }}
                  onMouseEnter={() => setHoveredMarker(marker)}
                  onMouseLeave={() => setHoveredMarker(null)}
                  className={`relative flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-md text-white text-[10px] font-bold border-2 border-white dark:border-zinc-900 shadow-md transition-transform hover:scale-125 focus:outline-hidden cursor-pointer ${badgeBg} ${
                    isNearActive ? "scale-115 ring-2 ring-rose-500/50" : ""
                  }`}
                  title={`[${formatSec(marker.timeSec)}] ${marker.label}`}
                >
                  {isNearActive && (
                    <span className="absolute -inset-0.5 rounded-full bg-rose-500 opacity-60 animate-ping pointer-events-none" />
                  )}
                  <span className="relative z-10 leading-none tracking-tight">
                    {badgeText}
                  </span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Time display */}
        <div className={`text-[11px] font-mono shrink-0 select-none ${
          inFs ? "text-zinc-300" : "text-zinc-500 dark:text-zinc-400"
        }`}>
          {formatSec(currentPlaybackTime)} / {formatSec(effectiveDuration)}
        </div>

        {/* Speed selector (.playback-speed-label) */}
        <div className="flex items-center gap-1 shrink-0">
          <label htmlFor={`video-playback-speed${inFs ? "-fs" : ""}`} className={`text-[11px] font-medium hidden sm:inline ${
            inFs ? "text-zinc-300" : "text-zinc-600 dark:text-zinc-400"
          }`}>
            {t("mv.speed")}
          </label>
          <select
            id={`video-playback-speed${inFs ? "-fs" : ""}`}
            value={playbackRate}
            onChange={(e) => {
              const val = Number(e.target.value);
              setPlaybackRate(val);
              if (videoRef.current) videoRef.current.playbackRate = val;
            }}
            className={`text-xs rounded-md px-1.5 py-1 cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-[#89BD49] ${
              inFs
                ? "bg-white/10 text-white border border-white/20 hover:bg-white/20"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
            }`}
            title={t("mv.speed")}
          >
            <option value="0.5" className="bg-zinc-900 text-white">0.5x</option>
            <option value="0.75" className="bg-zinc-900 text-white">0.75x</option>
            <option value="1" className="bg-zinc-900 text-white">1x</option>
            <option value="1.25" className="bg-zinc-900 text-white">1.25x</option>
            <option value="1.5" className="bg-zinc-900 text-white">1.5x</option>
            <option value="2" className="bg-zinc-900 text-white">2x</option>
          </select>
        </div>

        {/* Volume & Mute control */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleMute();
            }}
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors cursor-pointer focus:outline-hidden ${
              inFs
                ? "text-white hover:bg-white/20"
                : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            }`}
            aria-label={volumeState.muted || volumeState.volume === 0 ? t("mv.unmute") : t("mv.mute")}
            title={volumeState.muted || volumeState.volume === 0 ? t("mv.unmute") : t("mv.mute")}
          >
            {volumeState.muted || volumeState.volume === 0 ? (
              <svg className="w-4 h-4 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            ) : volumeState.volume < 0.5 ? (
              <svg className="w-4 h-4 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            ) : (
              <svg className="w-4 h-4 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volumeState.muted ? 0 : volumeState.volume}
            onChange={handleVolumeChange}
            onClick={(e) => e.stopPropagation()}
            aria-label="Volume"
            className="w-14 sm:w-16 h-1.5 accent-[#89BD49] bg-zinc-200 dark:bg-zinc-700 rounded-lg cursor-pointer"
          />
        </div>

        {/* Picture-in-Picture button */}
        {isPipSupported && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              togglePip();
            }}
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors cursor-pointer focus:outline-hidden ${
              inFs
                ? isPip ? "text-[#A8D666] bg-white/20" : "text-white hover:bg-white/20 hover:text-white"
                : isPip ? "text-[#6B9A35] dark:text-[#A8D666] bg-[#89BD49]/10 dark:bg-[#89BD49]/20" : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            }`}
            aria-label={t("mv.pip")}
            title={t("mv.pip")}
          >
            <svg className="w-4 h-4 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <rect x="12" y="10" width="8" height="6" rx="1" />
            </svg>
          </button>
        )}

        {/* Download button */}
        {downloadUrl && (
          <button
            type="button"
            onClick={handleDownloadMedia}
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors cursor-pointer focus:outline-hidden ${
              inFs
                ? "text-white hover:bg-white/20 hover:text-white"
                : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            }`}
            aria-label={t("mv.download")}
            title={t("mv.download")}
          >
            <svg className="w-4 h-4 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>
        )}

        {/* Fullscreen button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleFullscreen();
          }}
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors cursor-pointer focus:outline-hidden ${
            inFs
              ? "text-white hover:bg-white/20 hover:text-white"
              : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
          }`}
          aria-label={isFullscreen ? t("mv.exitFullscreen") : t("mv.openFullscreen")}
          title={isFullscreen ? `${t("mv.exitFullscreen")} (Esc)` : t("mv.openFullscreen")}
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
        <div className={`mt-2 text-xs font-mono truncate ${
          inFs ? "text-rose-400" : "text-rose-600 dark:text-rose-400"
        }`}>
          📍 [{formatSec(hoveredMarker.timeSec)}] {hoveredMarker.label}
        </div>
      )}
    </>
  );

  const unavailable = (!fileId && !isDirectWebUrl) || (type !== "video" && !isImage);

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
              onMouseDown={(e) => {
                videoClickCoordRef.current = { x: e.clientX, y: e.clientY };
              }}
              onClick={handleVideoClick}
              onMouseMove={handleMouseMove}
              onMouseEnter={() => {
                setShowControls(true);
                resetControlsTimeout();
              }}
              onMouseLeave={() => {
                if (isFullscreen && isPlaying && !isDraggingScrubberRef.current) {
                  if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
                  controlsTimeoutRef.current = setTimeout(() => {
                    setShowControls(false);
                  }, 1000);
                }
              }}
              className={`relative flex h-full w-full items-center justify-center select-none group/video ${
                isFullscreen
                  ? `bg-black ${showControls ? "cursor-default" : "cursor-none"}`
                  : "cursor-pointer"
              }`}
            >
              <video
                ref={videoRef}
                playsInline
                preload="auto"
                poster={imageUrl || undefined}
                src={activeVideoSrc || streamUrl || directUrl || downloadUrl || ""}
                onPlay={() => {
                  setIsPlaying(true);
                  setIsBuffering(false);
                }}
                onPause={() => {
                  setIsPlaying(false);
                  setIsBuffering(false);
                }}
                onWaiting={() => setIsBuffering(true)}
                onPlaying={() => setIsBuffering(false)}
                onCanPlay={(e) => {
                  setIsBuffering(false);
                  const dur = e.currentTarget.duration;
                  if (isFinite(dur) && dur > 0) {
                    commitDuration(dur);
                  } else if (!isDurationConfirmedRef.current) {
                    discoverWebmDuration(e.currentTarget);
                  }
                  if (videoRef.current) {
                    videoRef.current.playbackRate = playbackRate;
                    videoRef.current.volume = volumeState.volume;
                    videoRef.current.muted = volumeState.muted;
                  }
                }}
                onEnded={() => {
                  setIsPlaying(false);
                  setIsBuffering(false);
                  if (videoRef.current) {
                    const vid = videoRef.current;
                    // Playing to the end is the one moment currentTime IS the
                    // duration, so an Infinity-header WebM gets its real length
                    // confirmed here even if the discovery seek never ran.
                    const finalDur = isFinite(vid.duration) && vid.duration > 0
                      ? vid.duration
                      : isFinite(vid.currentTime) && vid.currentTime > 0
                      ? vid.currentTime
                      : videoDuration;
                    if (isFinite(finalDur) && finalDur > 0) {
                      commitDuration(finalDur);
                      setCurrentPlaybackTime(finalDur);
                      updateScrubberDom(100);
                      onTimeUpdate?.(finalDur);
                    }
                  }
                }}
                onSeeked={(e) => {
                  setIsBuffering(false);
                  const vid = e.currentTarget;
                  if (!isDiscoveringDurationRef.current && !isDraggingScrubberRef.current && isFinite(vid.currentTime)) {
                    setCurrentPlaybackTime(vid.currentTime);
                    if (effectiveDuration > 0) {
                      updateScrubberDom((vid.currentTime / effectiveDuration) * 100);
                    }
                    onTimeUpdate?.(vid.currentTime);
                  }
                }}
                onTimeUpdate={(e) => {
                  if (isDiscoveringDurationRef.current) return;
                  const cur = e.currentTarget.currentTime;
                  // No `cur > videoDuration` branch here any more: growing the
                  // total to match the playhead is what made the end time count
                  // up during playback. A real duration only comes from the
                  // decoder or from the end-of-seek discovery above.
                  commitDuration(e.currentTarget.duration);
                  // While playing, the rAF loop already owns the playhead and
                  // throttles to one state write per second. This handler fires
                  // ~4x/s and used to write the same value again, re-rendering
                  // this component AND the whole /v/[id] page through the
                  // onTimeUpdate callback - the stutter the user saw on play.
                  if (!isDraggingScrubberRef.current && isFinite(cur) && e.currentTarget.paused) {
                    setCurrentPlaybackTime(cur);
                    onTimeUpdate?.(cur);
                  }
                }}
                onDurationChange={(e) => {
                  commitDuration(e.currentTarget.duration);
                }}
                onLoadedMetadata={(e) => {
                  const vid = e.currentTarget;
                  if (isFinite(vid.duration) && vid.duration > 0) {
                    commitDuration(vid.duration);
                  } else {
                    discoverWebmDuration(vid);
                  }
                  if (currentPlaybackTime > 0 && Math.abs(vid.currentTime - currentPlaybackTime) > 0.1) {
                    try {
                      vid.currentTime = currentPlaybackTime;
                    } catch {}
                  }
                  vid.playbackRate = playbackRate;
                  vid.volume = volumeState.volume;
                  vid.muted = volumeState.muted;
                }}
                onError={() => {
                  setIsBuffering(false);
                  if (directUrl && activeVideoSrc !== directUrl) {
                    setActiveVideoSrc(directUrl);
                  } else {
                    setVideoFailed(true);
                  }
                }}
                className="h-full w-full object-contain pointer-events-none"
                aria-label={title}
              >
                {t("mv.noVideoSupport")}
              </video>

              {/* Buffering Indicator */}
              {isBuffering && isPlaying && (
                <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-black/60 backdrop-blur-xs text-white shadow-lg">
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  </div>
                </div>
              )}

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

              {/* Fullscreen Top Header */}
              {isFullscreen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className={`absolute top-5 sm:top-6 left-5 sm:left-6 right-5 sm:right-6 flex items-center justify-between z-50 transition-all duration-300 select-none ${
                    showControls
                      ? "opacity-100 translate-y-0 pointer-events-auto"
                      : "opacity-0 -translate-y-4 pointer-events-none"
                  }`}
                >
                  <div className="flex items-center gap-2 rounded-xl bg-black/75 backdrop-blur-md px-3.5 py-1.5 text-xs text-white/90 border border-white/15 shadow-xl">
                    <span className="h-2 w-2 rounded-full bg-[#89BD49] animate-pulse" />
                    <span className="font-medium truncate max-w-xs sm:max-w-md">{title || "Video Capture"}</span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFullscreen();
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-black/75 hover:bg-black/90 active:scale-95 backdrop-blur-md px-3.5 py-1.5 text-xs font-semibold text-white border border-white/20 hover:border-white/40 transition-all shadow-xl cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-white/40"
                    title={t("mv.exitFullscreen")}
                    aria-label={t("mv.exitFullscreen")}
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                    </svg>
                    <span>{t("mv.exitFullscreen")} (Esc)</span>
                  </button>
                </div>
              )}

              {/* Fullscreen Floating Controls Bar */}
              {isFullscreen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  onMouseEnter={() => {
                    isHoveringControlsRef.current = true;
                    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
                  }}
                  onMouseLeave={() => {
                    isHoveringControlsRef.current = false;
                    resetControlsTimeout();
                  }}
                  className={`absolute bottom-5 sm:bottom-6 left-1/2 -translate-x-1/2 w-[94%] max-w-4xl z-50 transition-all duration-300 select-none ${
                    showControls
                      ? "opacity-100 translate-y-0 pointer-events-auto"
                      : "opacity-0 translate-y-4 pointer-events-none"
                  }`}
                >
                  <div className="rounded-2xl border border-white/15 bg-black/80 dark:bg-zinc-900/85 backdrop-blur-xl p-3 sm:p-4 shadow-2xl text-white">
                    {renderControls(true)}
                  </div>
                </div>
              )}
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
            <button
              type="button"
              ref={lightboxTriggerRef}
              className="relative flex h-full w-full items-center justify-center cursor-zoom-in select-none bg-transparent border-0 p-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#89BD49] rounded-lg"
              onClick={() => setLightboxOpen(true)}
              aria-label={t("mv.openViewer", { name: title || "screenshot" })}
              title={t("mv.openFullscreen")}
            >
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-6 h-6 border-2 border-[#89BD49]/30 border-t-[#89BD49] rounded-full animate-spin" />
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
            </button>

            {/* Subtle hover feedback so it's obvious the image is clickable (no center icon per earlier feedback) */}
            <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-150 group-hover:bg-black/10 rounded-lg" />

            {/* Download stays as a separate explicit action (not implied by the hover affordance above) */}
            {(directUrl || imageUrl || downloadUrl) && (
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

      {type === "video" && !videoFailed && !isFullscreen && (streamUrl || directUrl || downloadUrl) && (
        <div className="mt-3 rounded-xl border border-border bg-white dark:bg-zinc-900/70 p-3 shadow-xs">
          {renderControls(false)}
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
          <div className="absolute right-4 top-4 z-20 flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={zoomOut}
              disabled={zoom <= MIN_ZOOM}
              className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg bg-white/90 hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-700 hover:text-zinc-900 border border-zinc-200 shadow-md dark:bg-zinc-900/90 dark:hover:bg-zinc-800 dark:text-white dark:border-white/10 dark:shadow-lg backdrop-blur-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-white transition-colors cursor-pointer"
              aria-label={t("mv.zoomOut")}
              title={`${t("mv.zoomOut")} (-)`}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                <line x1="8" y1="11" x2="14" y2="11" />
              </svg>
            </button>
            <button
              type="button"
              onClick={zoomIn}
              disabled={zoom >= MAX_ZOOM}
              className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg bg-white/90 hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-700 hover:text-zinc-900 border border-zinc-200 shadow-md dark:bg-zinc-900/90 dark:hover:bg-zinc-800 dark:text-white dark:border-white/10 dark:shadow-lg backdrop-blur-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-white transition-colors cursor-pointer"
              aria-label={t("mv.zoomIn")}
              title={`${t("mv.zoomIn")} (+)`}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                <line x1="11" y1="8" x2="11" y2="14" />
                <line x1="8" y1="11" x2="14" y2="11" />
              </svg>
            </button>
            {zoom > MIN_ZOOM && (
              <button
                type="button"
                onClick={resetView}
                className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg bg-white/90 hover:bg-zinc-100 text-zinc-700 hover:text-zinc-900 border border-zinc-200 shadow-md dark:bg-zinc-900/90 dark:hover:bg-zinc-800 dark:text-white dark:border-white/10 dark:shadow-lg backdrop-blur-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-white transition-colors cursor-pointer"
                aria-label={t("mv.resetZoom")}
                title={`${t("mv.resetZoom")} (0)`}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
              </button>
            )}
            {(directUrl || imageUrl || downloadUrl) && (
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
              title={`${t("mv.closeViewer")} (Esc)`}
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
              ref={imageViewportRef}
              className={`h-full w-full flex items-center justify-center overflow-hidden ${zoom > MIN_ZOOM ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"}`}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
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
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: "center center",
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
