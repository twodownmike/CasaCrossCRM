"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Icon } from "./icons";

function TopbarSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (
        (e.metaKey || e.ctrlKey) &&
        e.key.toLowerCase() === "k" &&
        !e.shiftKey
      ) {
        e.preventDefault();
        const target = document.getElementById("topbar-search-input") as
          | HTMLInputElement
          | null;
        target?.focus();
        target?.select();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = q.trim();
    if (!value) return;
    router.push(`/search?q=${encodeURIComponent(value)}`);
  }

  return (
    <form onSubmit={submit} className="ds-search">
      <Icon.search />
      <input
        id="topbar-search-input"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search events, people, vendors…"
      />
      <span className="kbd">⌘K</span>
    </form>
  );
}

export function DesktopTopbar() {
  const pathname = usePathname();
  const crumbs = buildCrumbs(pathname);

  return (
    <div className="ds-topbar">
      <div className="crumb">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <span
              key={i}
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              {i > 0 && <span style={{ color: "var(--ink-5)" }}>/</span>}
              {c.href && !last ? (
                <Link href={c.href}>{c.label}</Link>
              ) : last ? (
                <strong>{c.label}</strong>
              ) : (
                <span>{c.label}</span>
              )}
            </span>
          );
        })}
      </div>
      <div className="grow" />
      <TopbarSearch />
      <PrimaryCta pathname={pathname} />
    </div>
  );
}

function PrimaryCta({ pathname }: { pathname: string }) {
  const onPeople =
    pathname.startsWith("/people") &&
    !pathname.includes("/new") &&
    !pathname.includes("/edit");
  if (onPeople) {
    return (
      <Link className="btn primary sm" href="/people/new">
        <Icon.plus /> Add person
      </Link>
    );
  }
  return (
    <Link className="btn primary sm" href="/events/new">
      <Icon.plus /> New event
    </Link>
  );
}

function buildCrumbs(
  pathname: string,
): Array<{ label: string; href?: string }> {
  if (pathname.startsWith("/home")) return [{ label: "Dashboard" }];
  if (pathname.startsWith("/calendar")) return [{ label: "Calendar" }];
  if (pathname.startsWith("/messages")) return [{ label: "Messages" }];
  if (pathname.startsWith("/account")) return [{ label: "Account" }];

  if (pathname.startsWith("/events/new"))
    return [{ label: "Events", href: "/events" }, { label: "New event" }];

  if (pathname.match(/^\/events\/[^/]+\/edit/))
    return [
      { label: "Events", href: "/events" },
      { label: "Edit event" },
    ];

  if (pathname.match(/^\/events\/[^/]+\/participants/))
    return [
      { label: "Events", href: "/events" },
      { label: "Booking" },
    ];

  if (pathname.match(/^\/events\/[^/]+/))
    return [
      { label: "Events", href: "/events" },
      { label: "Event" },
    ];

  if (pathname.startsWith("/events")) return [{ label: "Events" }];

  if (pathname.startsWith("/people/new"))
    return [{ label: "People", href: "/people" }, { label: "New contact" }];

  if (pathname.match(/^\/people\/[^/]+\/edit/))
    return [
      { label: "People", href: "/people" },
      { label: "Edit contact" },
    ];

  if (pathname.match(/^\/people\/[^/]+/))
    return [
      { label: "People", href: "/people" },
      { label: "Contact" },
    ];

  if (pathname.startsWith("/people")) return [{ label: "People" }];

  return [{ label: "Casa Cross" }];
}
