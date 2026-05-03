"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "./icons";
import { Sheet } from "./sheet";

const ITEMS: Array<{
  icon: keyof typeof Icon;
  label: string;
  sub: string;
  href: string;
}> = [
  {
    icon: "spark",
    label: "New event",
    sub: "A new styled shoot",
    href: "/events/new",
  },
  {
    icon: "people",
    label: "Add a person",
    sub: "Vendor, photographer, model…",
    href: "/people/new",
  },
];

export function Fab() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className="fab"
        aria-label="New"
        onClick={() => setOpen(true)}
      >
        <Icon.plus />
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Create new">
        <div
          style={{
            paddingTop: 8,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {ITEMS.map((it) => {
            const Ico = Icon[it.icon];
            return (
              <Link
                key={it.label}
                href={it.href}
                onClick={() => setOpen(false)}
                className="card-row"
                style={{
                  borderRadius: 12,
                  border: "1px solid var(--hair)",
                  borderBottom: "1px solid var(--hair)",
                }}
              >
                <span
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: "var(--hair-2)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--ink-2)",
                  }}
                >
                  <Ico />
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>
                    {it.label}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ink-3)" }}>
                    {it.sub}
                  </div>
                </div>
                <Icon.chev style={{ color: "var(--ink-4)" }} />
              </Link>
            );
          })}
        </div>
      </Sheet>
    </>
  );
}
