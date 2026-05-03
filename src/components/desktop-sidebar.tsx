"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./icons";
import { fmtDate, deriveInitials } from "@/lib/format";

type NavItem = {
  href: string;
  match: RegExp;
  label: string;
  icon: keyof typeof Icon;
  count?: number;
};

export type SidebarPin = {
  id: string;
  name: string;
  date: string;
  cover: string | null;
  cover_image_url: string | null;
};

export function DesktopSidebar({
  upcomingCount,
  peopleCount,
  messageCount,
  pinned,
  user,
}: {
  upcomingCount: number;
  peopleCount: number;
  messageCount: number;
  pinned: SidebarPin[];
  user: { name: string; email: string | null } | null;
}) {
  const pathname = usePathname();

  const items: NavItem[] = [
    { href: "/home", match: /^\/home/, label: "Dashboard", icon: "home" },
    {
      href: "/events",
      match: /^\/events/,
      label: "Events",
      icon: "spark",
      count: upcomingCount,
    },
    { href: "/calendar", match: /^\/calendar/, label: "Calendar", icon: "calendar" },
    {
      href: "/people",
      match: /^\/people/,
      label: "People",
      icon: "people",
      count: peopleCount,
    },
    {
      href: "/messages",
      match: /^\/messages/,
      label: "Messages",
      icon: "chat",
      count: messageCount || undefined,
    },
  ];

  const userName = user?.name || user?.email?.split("@")[0] || "Anna";
  const initials = deriveInitials(userName);

  return (
    <aside className="ds-sidebar">
      <div className="ds-brand">
        <span className="mark" />
        <span>Casa Cross</span>
      </div>

      <nav className="ds-nav">
        {items.map((it) => {
          const Ico = Icon[it.icon];
          const active = it.match.test(pathname);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`ds-nav-item ${active ? "active" : ""}`}
            >
              <Ico />
              <span>{it.label}</span>
              {it.count !== undefined && (
                <span className="ds-count">{it.count}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {pinned.length > 0 && (
        <>
          <div className="ds-nav-section">Pinned events</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {pinned.map((e) => {
              const swatchClass = e.cover_image_url
                ? "swatch"
                : `swatch cover-${e.cover || "modern"}`;
              const swatchStyle = e.cover_image_url
                ? { backgroundImage: `url(${e.cover_image_url})` }
                : undefined;
              return (
                <Link
                  key={e.id}
                  className="ds-pinned"
                  href={`/events/${e.id}`}
                >
                  <div className={swatchClass} style={swatchStyle} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="pname">{e.name}</div>
                    <div className="pdate">
                      {fmtDate(e.date, { short: true })}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}

      <div className="ds-user">
        <Link
          href="/account"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flex: 1,
            color: "inherit",
          }}
        >
          <span
            className="avatar sm"
            style={{
              background: "var(--terracotta-tint)",
              color: "var(--terracotta)",
            }}
          >
            {initials}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="name">{userName}</div>
            <div className="role">
              {user?.email || "Signed in"}
            </div>
          </div>
        </Link>
      </div>
    </aside>
  );
}
