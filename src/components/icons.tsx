import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export const Icon = {
  home: (p: P) => (
    <svg width="22" height="22" viewBox="0 0 24 24" {...base} strokeWidth={1.6} {...p}>
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10h14V10" />
    </svg>
  ),
  calendar: (p: P) => (
    <svg width="22" height="22" viewBox="0 0 24 24" {...base} strokeWidth={1.6} {...p}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  ),
  spark: (p: P) => (
    <svg width="22" height="22" viewBox="0 0 24 24" {...base} strokeWidth={1.6} {...p}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" />
    </svg>
  ),
  people: (p: P) => (
    <svg width="22" height="22" viewBox="0 0 24 24" {...base} strokeWidth={1.6} {...p}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M15 14c2.5 0 4.5 2 4.5 4.5" />
    </svg>
  ),
  chat: (p: P) => (
    <svg width="22" height="22" viewBox="0 0 24 24" {...base} strokeWidth={1.6} {...p}>
      <path d="M4 5h16v11H8l-4 4z" />
    </svg>
  ),
  bell: (p: P) => (
    <svg width="20" height="20" viewBox="0 0 24 24" {...base} strokeWidth={1.6} {...p}>
      <path d="M6 9a6 6 0 1112 0c0 6 2 7 2 7H4s2-1 2-7z" />
      <path d="M10 20a2 2 0 004 0" />
    </svg>
  ),
  search: (p: P) => (
    <svg width="18" height="18" viewBox="0 0 24 24" {...base} strokeWidth={1.8} {...p}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4-4" />
    </svg>
  ),
  plus: (p: P) => (
    <svg width="22" height="22" viewBox="0 0 24 24" {...base} strokeWidth={2} {...p}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  back: (p: P) => (
    <svg width="20" height="20" viewBox="0 0 24 24" {...base} strokeWidth={1.8} {...p}>
      <path d="M15 6l-6 6 6 6" />
    </svg>
  ),
  more: (p: P) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" {...p}>
      <circle cx="6" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="18" cy="12" r="1.6" />
    </svg>
  ),
  share: (p: P) => (
    <svg width="18" height="18" viewBox="0 0 24 24" {...base} strokeWidth={1.8} {...p}>
      <path d="M12 4v12M8 8l4-4 4 4M5 14v5h14v-5" />
    </svg>
  ),
  pin: (p: P) => (
    <svg width="14" height="14" viewBox="0 0 24 24" {...base} strokeWidth={1.7} {...p}>
      <path d="M12 22s7-7 7-12a7 7 0 10-14 0c0 5 7 12 7 12z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  ),
  clock: (p: P) => (
    <svg width="14" height="14" viewBox="0 0 24 24" {...base} strokeWidth={1.7} {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),
  users: (p: P) => (
    <svg width="14" height="14" viewBox="0 0 24 24" {...base} strokeWidth={1.7} {...p}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 19c0-3 2.7-5.5 6-5.5s6 2.5 6 5.5" />
      <circle cx="17" cy="9" r="2.3" />
      <path d="M15 14c2.4 0 4.5 2 4.5 4.5" />
    </svg>
  ),
  check: (p: P) => (
    <svg width="14" height="14" viewBox="0 0 24 24" {...base} strokeWidth={2.2} {...p}>
      <path d="M5 13l4 4 10-10" />
    </svg>
  ),
  doc: (p: P) => (
    <svg width="16" height="16" viewBox="0 0 24 24" {...base} strokeWidth={1.7} {...p}>
      <path d="M14 3H6v18h12V7z" />
      <path d="M14 3v4h4M9 13h6M9 17h6" />
    </svg>
  ),
  dollar: (p: P) => (
    <svg width="16" height="16" viewBox="0 0 24 24" {...base} strokeWidth={1.7} {...p}>
      <path d="M12 3v18M16 7H10a3 3 0 000 6h4a3 3 0 010 6H7" />
    </svg>
  ),
  phone: (p: P) => (
    <svg width="16" height="16" viewBox="0 0 24 24" {...base} strokeWidth={1.7} {...p}>
      <path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3 19.5 19.5 0 01-6-6 19.8 19.8 0 01-3-8.6A2 2 0 014.1 2h3a2 2 0 012 1.7 12 12 0 00.7 2.8 2 2 0 01-.5 2L8 9.7a16 16 0 006 6l1.2-1.2a2 2 0 012-.5 12 12 0 002.8.7 2 2 0 011.7 2z" />
    </svg>
  ),
  mail: (p: P) => (
    <svg width="16" height="16" viewBox="0 0 24 24" {...base} strokeWidth={1.7} {...p}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  ),
  ig: (p: P) => (
    <svg width="16" height="16" viewBox="0 0 24 24" {...base} strokeWidth={1.7} {...p}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
    </svg>
  ),
  send: (p: P) => (
    <svg width="20" height="20" viewBox="0 0 24 24" {...base} strokeWidth={1.7} {...p}>
      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" />
    </svg>
  ),
  chev: (p: P) => (
    <svg width="16" height="16" viewBox="0 0 24 24" {...base} strokeWidth={1.8} {...p}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  ),
  close: (p: P) => (
    <svg width="18" height="18" viewBox="0 0 24 24" {...base} strokeWidth={1.8} {...p}>
      <path d="M6 6l12 12M6 18L18 6" />
    </svg>
  ),
  exit: (p: P) => (
    <svg width="18" height="18" viewBox="0 0 24 24" {...base} strokeWidth={1.7} {...p}>
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  ),
};
