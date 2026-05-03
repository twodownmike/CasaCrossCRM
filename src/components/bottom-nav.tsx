"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./icons";

const TABS: Array<{
  href: string;
  match: RegExp;
  label: string;
  icon: keyof typeof Icon;
}> = [
  { href: "/home", match: /^\/home/, label: "Home", icon: "home" },
  { href: "/events", match: /^\/events/, label: "Events", icon: "spark" },
  { href: "/calendar", match: /^\/calendar/, label: "Calendar", icon: "calendar" },
  { href: "/people", match: /^\/people/, label: "People", icon: "people" },
  { href: "/messages", match: /^\/messages/, label: "Messages", icon: "chat" },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="bottom-nav">
      {TABS.map((t) => {
        const Ico = Icon[t.icon];
        const active = t.match.test(pathname);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`tab ${active ? "active" : ""}`}
          >
            <Ico />
            <span className="label">{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
