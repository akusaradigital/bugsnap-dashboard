import React from "react";
import { Icon } from "@/lib/iconify";

export interface IconProps {
  size?: number | string;
  strokeWidth?: number | string;
  className?: string;
  style?: React.CSSProperties;
  color?: string;
  id?: string;
  role?: string;
  "aria-hidden"?: boolean | "true" | "false";
  "aria-label"?: string;
  onClick?: React.MouseEventHandler<SVGElement>;
}

function LucideBridge({
  icon,
  size = 20,
  className = "",
  style,
  color,
  id,
  role,
  "aria-hidden": ariaHidden = true,
  "aria-label": ariaLabel,
  onClick,
}: IconProps & { icon: string }) {
  return (
    <Icon
      icon={icon}
      width={size}
      height={size}
      className={`shrink-0 ${className}`.trim()}
      style={style}
      color={color}
      id={id}
      role={role}
      aria-hidden={ariaHidden}
      aria-label={ariaLabel}
      onClick={onClick}
    />
  );
}

export function IconSun(props: IconProps) {
  return <LucideBridge icon="lucide:sun" {...props} />;
}

export function IconMoon(props: IconProps) {
  return <LucideBridge icon="lucide:moon" {...props} />;
}

export function IconDeviceDesktop(props: IconProps) {
  return <LucideBridge icon="lucide:monitor" {...props} />;
}

export function IconCheck(props: IconProps) {
  return <LucideBridge icon="lucide:check" {...props} />;
}

export function IconX(props: IconProps) {
  return <LucideBridge icon="lucide:x" {...props} />;
}

export function IconChevronDown(props: IconProps) {
  return <LucideBridge icon="lucide:chevron-down" {...props} />;
}

export function IconChevronRight(props: IconProps) {
  return <LucideBridge icon="lucide:chevron-right" {...props} />;
}

export function IconArrowRight(props: IconProps) {
  return <LucideBridge icon="lucide:arrow-right" {...props} />;
}

export function IconArrowDown(props: IconProps) {
  return <LucideBridge icon="lucide:arrow-down" {...props} />;
}

export function IconArrowLeft(props: IconProps) {
  return <LucideBridge icon="lucide:arrow-left" {...props} />;
}

export function IconMenu2(props: IconProps) {
  return <LucideBridge icon="lucide:menu" {...props} />;
}

export function IconBug(props: IconProps) {
  return <LucideBridge icon="lucide:bug" {...props} />;
}

export function IconCamera(props: IconProps) {
  return <LucideBridge icon="lucide:camera" {...props} />;
}

export function IconVideo(props: IconProps) {
  return <LucideBridge icon="lucide:video" {...props} />;
}

export function IconTerminal2(props: IconProps) {
  return <LucideBridge icon="lucide:terminal" {...props} />;
}

export function IconWorld(props: IconProps) {
  return <LucideBridge icon="lucide:globe" {...props} />;
}

export function IconLock(props: IconProps) {
  return <LucideBridge icon="lucide:lock" {...props} />;
}

export function IconShieldCheck(props: IconProps) {
  return <LucideBridge icon="lucide:shield-check" {...props} />;
}

export function IconCopy(props: IconProps) {
  return <LucideBridge icon="lucide:copy" {...props} />;
}

export function IconShare(props: IconProps) {
  return <LucideBridge icon="lucide:share-2" {...props} />;
}

export function IconMail(props: IconProps) {
  return <LucideBridge icon="lucide:mail" {...props} />;
}

export function IconBuilding(props: IconProps) {
  return <LucideBridge icon="lucide:building" {...props} />;
}

export function IconHelpCircle(props: IconProps) {
  return <LucideBridge icon="lucide:help-circle" {...props} />;
}

export function IconBolt(props: IconProps) {
  return <LucideBridge icon="lucide:zap" {...props} />;
}

export function IconCreditCard(props: IconProps) {
  return <LucideBridge icon="lucide:credit-card" {...props} />;
}

export function IconSquare(props: IconProps) {
  return <LucideBridge icon="lucide:square" {...props} />;
}

export function IconPencil(props: IconProps) {
  return <LucideBridge icon="lucide:pencil" {...props} />;
}

export function IconPlayerPlay(props: IconProps) {
  return <LucideBridge icon="lucide:play" {...props} />;
}

export function IconUser(props: IconProps) {
  return <LucideBridge icon="lucide:user" {...props} />;
}

export function IconUsers(props: IconProps) {
  return <LucideBridge icon="lucide:users" {...props} />;
}

export function IconFolder(props: IconProps) {
  return <LucideBridge icon="lucide:folder" {...props} />;
}

export function IconExternalLink(props: IconProps) {
  return <LucideBridge icon="lucide:external-link" {...props} />;
}

export function IconDatabase(props: IconProps) {
  return <LucideBridge icon="lucide:database" {...props} />;
}

export function IconSparkles(props: IconProps) {
  return <LucideBridge icon="lucide:sparkles" {...props} />;
}

export function IconHome(props: IconProps) {
  return <LucideBridge icon="lucide:home" {...props} />;
}
