import React from "react";

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  strokeWidth?: number | string;
}

function BaseSvg({
  size = 20,
  strokeWidth = 2,
  className = "",
  children,
  ...props
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function IconSun(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M3 12h1m8 -9v1m8 8h1m-9 8v1m-6.4 -15.4l.7 .7m12.1 -.7l-.7 .7m0 11.4l.7 .7m-12.1 -.7l-.7 .7" />
    </BaseSvg>
  );
}

export function IconMoon(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z" />
    </BaseSvg>
  );
}

export function IconDeviceDesktop(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <rect x="3" y="4" width="18" height="12" rx="1" />
      <line x1="7" y1="20" x2="17" y2="20" />
      <line x1="9" y1="16" x2="9" y2="20" />
      <line x1="15" y1="16" x2="15" y2="20" />
    </BaseSvg>
  );
}

export function IconCheck(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <path d="M5 12l5 5l10 -10" />
    </BaseSvg>
  );
}

export function IconX(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </BaseSvg>
  );
}

export function IconChevronDown(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <polyline points="6 9 12 15 18 9" />
    </BaseSvg>
  );
}

export function IconChevronRight(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <polyline points="9 6 15 12 9 18" />
    </BaseSvg>
  );
}

export function IconArrowRight(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <line x1="13" y1="18" x2="19" y2="12" />
      <line x1="13" y1="6" x2="19" y2="12" />
    </BaseSvg>
  );
}

export function IconArrowDown(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="18" y1="13" x2="12" y2="19" />
      <line x1="6" y1="13" x2="12" y2="19" />
    </BaseSvg>
  );
}

export function IconArrowLeft(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <line x1="19" y1="12" x2="5" y2="12" />
      <line x1="11" y1="6" x2="5" y2="12" />
      <line x1="11" y1="18" x2="5" y2="12" />
    </BaseSvg>
  );
}

export function IconMenu2(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </BaseSvg>
  );
}

export function IconBug(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <path d="M9 9v-1a3 3 0 0 1 6 0v1" />
      <path d="M8 9h8a6 6 0 0 1 1 3v3a5 5 0 0 1 -10 0v-3a6 6 0 0 1 1 -3" />
      <line x1="3" y1="13" x2="7" y2="13" />
      <line x1="17" y1="13" x2="21" y2="13" />
      <line x1="12" y1="20" x2="12" y2="14" />
      <line x1="4" y1="19" x2="7.35" y2="16.8" />
      <line x1="20" y1="19" x2="16.65" y2="16.8" />
      <line x1="4" y1="7" x2="7.75" y2="9.4" />
      <line x1="20" y1="7" x2="16.25" y2="9.4" />
    </BaseSvg>
  );
}

export function IconCamera(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <path d="M5 7h1a2 2 0 0 0 2 -2a1 1 0 0 1 1 -1h6a1 1 0 0 1 1 1a2 2 0 0 0 2 2h1a2 2 0 0 1 2 2v9a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-9a2 2 0 0 1 2 -2" />
      <circle cx="12" cy="13" r="3" />
    </BaseSvg>
  );
}

export function IconVideo(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <path d="M15 10l4.553 -2.276a1 1 0 0 1 1.447 .894v6.764a1 1 0 0 1 -1.447 .894l-4.553 -2.276v-4z" />
      <rect x="3" y="6" width="12" height="12" rx="2" />
    </BaseSvg>
  );
}

export function IconTerminal2(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <path d="M8 9l3 3l-3 3" />
      <line x1="13" y1="15" x2="17" y2="15" />
      <rect x="3" y="4" width="18" height="16" rx="2" />
    </BaseSvg>
  );
}

export function IconWorld(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <circle cx="12" cy="12" r="9" />
      <line x1="3.6" y1="9" x2="20.4" y2="9" />
      <line x1="3.6" y1="15" x2="20.4" y2="15" />
      <path d="M11.5 3a17 17 0 0 0 0 18" />
      <path d="M12.5 3a17 17 0 0 1 0 18" />
    </BaseSvg>
  );
}

export function IconLock(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <circle cx="12" cy="16" r="1" />
      <path d="M8 11v-4a4 4 0 0 1 8 0v4" />
    </BaseSvg>
  );
}

export function IconShieldCheck(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <path d="M9 12l2 2l4 -4" />
      <path d="M12 3a12 12 0 0 0 8.5 3a12 12 0 0 1 -8.5 15a12 12 0 0 1 -8.5 -15a12 12 0 0 0 8.5 -3" />
    </BaseSvg>
  );
}

export function IconCopy(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M16 8v-2a2 2 0 0 0 -2 -2h-8a2 2 0 0 0 -2 2v8a2 2 0 0 0 2 2h2" />
    </BaseSvg>
  );
}

export function IconShare(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="6" r="3" />
      <circle cx="18" cy="18" r="3" />
      <line x1="8.7" y1="10.7" x2="15.3" y2="7.3" />
      <line x1="8.7" y1="13.3" x2="15.3" y2="16.7" />
    </BaseSvg>
  );
}

export function IconMail(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <polyline points="3 7 12 13 21 7" />
    </BaseSvg>
  );
}

export function IconBuilding(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <line x1="3" y1="21" x2="21" y2="21" />
      <line x1="9" y1="8" x2="10" y2="8" />
      <line x1="9" y1="12" x2="10" y2="12" />
      <line x1="9" y1="16" x2="10" y2="16" />
      <line x1="14" y1="8" x2="15" y2="8" />
      <line x1="14" y1="12" x2="15" y2="12" />
      <line x1="14" y1="16" x2="15" y2="16" />
      <path d="M5 21v-16a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v16" />
    </BaseSvg>
  );
}

export function IconHelpCircle(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="17" x2="12" y2="17.01" />
      <path d="M12 13.5a1.5 1.5 0 0 1 1 -1.5a2.6 2.6 0 1 0 -3 -4" />
    </BaseSvg>
  );
}

export function IconBolt(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <polyline points="13 3 13 10 19 10 11 21 11 14 5 14 13 3" />
    </BaseSvg>
  );
}

export function IconCreditCard(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="7" y1="15" x2="7.01" y2="15" />
      <line x1="11" y1="15" x2="13" y2="15" />
    </BaseSvg>
  );
}

export function IconSquare(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
    </BaseSvg>
  );
}

export function IconPencil(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <path d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4" />
      <line x1="13.5" y1="6.5" x2="17.5" y2="10.5" />
    </BaseSvg>
  );
}

export function IconPlayerPlay(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <path d="M7 4v16l13 -8z" />
    </BaseSvg>
  );
}

export function IconUser(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <circle cx="12" cy="7" r="4" />
      <path d="M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />
    </BaseSvg>
  );
}

export function IconUsers(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <circle cx="9" cy="7" r="4" />
      <path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      <path d="M21 21v-2a4 4 0 0 0 -3 -3.85" />
    </BaseSvg>
  );
}

export function IconFolder(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <path d="M5 4h4l3 3h7a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-11a2 2 0 0 1 2 -2" />
    </BaseSvg>
  );
}

export function IconExternalLink(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <path d="M11 7h-5a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-5" />
      <line x1="10" y1="14" x2="20" y2="4" />
      <polyline points="15 4 20 4 20 9" />
    </BaseSvg>
  );
}

export function IconDatabase(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <ellipse cx="12" cy="6" rx="8" ry="3" />
      <path d="M4 6v6a8 3 0 0 0 16 0v-6" />
      <path d="M4 12v6a8 3 0 0 0 16 0v-6" />
    </BaseSvg>
  );
}

export function IconSparkles(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <path d="M12 3l1.5 5.5l5.5 1.5l-5.5 1.5l-1.5 5.5l-1.5 -5.5l-5.5 -1.5l5.5 -1.5z" />
      <path d="M5 3l.5 1.5l1.5 .5l-1.5 .5l-.5 1.5l-.5 -1.5l-1.5 -.5l1.5 -.5z" />
      <path d="M19 16l.5 1.5l1.5 .5l-1.5 .5l-.5 1.5l-.5 -1.5l-1.5 -.5l1.5 -.5z" />
    </BaseSvg>
  );
}
