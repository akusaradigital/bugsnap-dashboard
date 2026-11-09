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
  "lucide:x-circle": "/icons/lucide-x.svg",
  "lucide:trash-2": "/icons/trash.svg",
  "lucide:edit-3": "/icons/edit.svg",
  "lucide:more-vertical": "/icons/lucide-menu.svg",
  "lucide:bar-chart-2": "/icons/lucide-pie-chart.svg",
  "lucide:check-circle": "/icons/lucide-check.svg",
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
  ...props
}: StaticIconProps) {
  const mergedStyle: CSSProperties = {
    ...style,
    color,
    width: width ?? style?.width,
    height: height ?? style?.height,
  };

  const handleIconError = (event: SyntheticEvent<HTMLImageElement>) => {
    event.currentTarget.style.display = "none";
  };

  return createElement("img", {
    src: iconPath(icon),
    alt: "",
    style: mergedStyle,
    onError: handleIconError,
    ...props,
  });
}
