"use client";

import { createElement, type CSSProperties, type ImgHTMLAttributes, type MouseEventHandler, type SyntheticEvent } from "react";

type StaticIconProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt" | "width" | "height"> & {
  icon: string;
  width?: number | string;
  height?: number | string;
  color?: string;
  "aria-hidden"?: boolean | "true" | "false";
  onClick?: MouseEventHandler<HTMLImageElement>;
};

const OFFLINE_ICON_PATHS: Record<string, string> = {
  "lucide:alert-triangle": "/icons/lucide-circle-alert.svg",
  "lucide:alert-circle": "/icons/lucide-circle-alert.svg",
  "lucide:x-circle": "/icons/lucide-x-circle.svg",
  "custom:x-white": "/icons/lucide-x-white.svg",
  "lucide:trash-2": "/icons/trash.svg",
  "lucide:edit-3": "/icons/edit.svg",
  "lucide:edit-2": "/icons/edit.svg",
  "lucide:more-horizontal": "/icons/lucide-more-horizontal.svg",
  "lucide:more-vertical": "/icons/lucide-menu.svg",
  "lucide:bar-chart-2": "/icons/lucide-pie-chart.svg",
  "lucide:check-circle": "/icons/lucide-check.svg",
  "lucide:cookie": "/icons/lucide-cookie.svg",
  "lucide:chevron-down": "/icons/chevron-down.svg",
  "lucide:arrow-up": "/icons/lucide-arrow-up.svg",
  "logos:github-icon": "/integrations/github.png",
  "logos:slack-icon": "/integrations/slack.png",
  "logos:jira": "/integrations/jira.png",
  "tabler:lock": "/icons/lucide-lock.svg",
  "tabler:x": "/icons/lucide-x.svg",
  "tabler:layout-columns": "/icons/lucide-columns-2.svg",
  "tabler:layers-difference": "/icons/lucide-layers.svg",
  "tabler:upload": "/icons/lucide-upload.svg",
  "tabler:repeat": "/icons/lucide-refresh-cw.svg",
  "tabler:link": "/icons/lucide-link.svg",
  "tabler:alert-triangle": "/icons/lucide-circle-alert.svg",
  "tabler:circle-check": "/icons/lucide-check.svg",
  "tabler:loader-2": "/icons/lucide-loader-circle.svg",
  "lucide:loader-2": "/icons/lucide-loader-circle.svg",
  "tabler:player-play": "/icons/lucide-play.svg",
  "tabler:shield-check": "/icons/lucide-shield-check.svg",
  "tabler:sparkles": "/icons/lucide-sparkles.svg",
  "tabler:check": "/icons/lucide-check.svg",
};

function iconPath(icon: string): string {
  return OFFLINE_ICON_PATHS[icon] ?? `/icons/${icon.replace(/:/g, "-")}.svg`;
}

export function Icon({
  icon,
  width,
  height,
  color,
  style,
  className,
  ...props
}: StaticIconProps) {
  const isWhiteIcon = className?.split(/\s+/).includes("invert");
  const mergedStyle: CSSProperties = {
    ...style,
    color: color ?? style?.color ?? "#2563eb",
    width: width ?? style?.width,
    height: height ?? style?.height,
    minWidth: style?.minWidth ?? 0,
    filter:
      style?.filter ??
      (isWhiteIcon
        ? "brightness(0) invert(1)"
        : "brightness(0) saturate(100%) invert(35%) sepia(98%) saturate(1685%) hue-rotate(205deg) brightness(94%) contrast(94%)"),
  };

  const handleIconError = (event: SyntheticEvent<HTMLImageElement>) => {
    event.currentTarget.style.display = "none";
  };

  if (icon === "custom:folder-filled") {
    return createElement(
      "svg",
      {
        ...props,
        className,
        viewBox: "0 0 24 24",
        fill: "currentColor",
        xmlns: "http://www.w3.org/2000/svg",
        style: {
          ...mergedStyle,
          filter: style?.filter,
        },
      },
      createElement("path", {
        d: "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z",
      }),
    );
  }

  return createElement("img", {
    src: iconPath(icon),
    alt: "",
    className,
    style: mergedStyle,
    onError: handleIconError,
    ...props,
  });
}
