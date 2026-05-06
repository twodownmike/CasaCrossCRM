"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./icons";

const TABS: Array<{
  href: string;
  match: RegExp;
  label: string;
  icon: keyof typeof Icon;
  badgeKey?: "inbox";
}> = [
  { href: "/home", match: /^\/home/, label: "Home", icon: "home" },
  { href: "/events", match: /^\/events/, label: "Events", icon: "spark" },
  { href: "/calendar", match: /^\/calendar/, label: "Calendar", icon: "calendar" },
  { href: "/people", match: /^\/people/, label: "People", icon: "people" },
  {
    href: "/inbox",
    match: /^\/(inbox|messages)/,
    label: "Inbox",
    icon: "mail",
    badgeKey: "inbox",
  },
];

export function BottomNav({ inboxCount = 0 }: { inboxCount?: number }) {
  const pathname = usePathname();
  return (
    <nav className="bottom-nav">
      {TABS.map((t) => {
        const Ico = Icon[t.icon];
        const active = t.match.test(pathname);
        const showBadge = t.badgeKey === "inbox" && inboxCount > 0;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`tab ${active ? "active" : ""}`}
          >
            <span style={{ position: "relative" }}>
              <Ico />
              {showBadge && (
                <span
                  aria-hidden
                  style={{
                    position: "absolute",
                    top: -2,
                    right: -6,
                    minWidth: 14,
                    height: 14,
                    padding: "0 4px",
                    borderRadius: 999,
                    background: "var(--terracotta)",
                    color: "white",
                    fontSize: 9,
                    fontWeight: 600,
                    letterSpacing: 0,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    lineHeight: 1,
                  }}
                >
                  {inboxCount > 9 ? "9+" : inboxCount}
                </span>
              )}
            </span>
            <span className="label">{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
