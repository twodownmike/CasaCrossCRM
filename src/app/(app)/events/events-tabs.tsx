"use client";

import Link from "next/link";

const TABS: Array<[string, string]> = [
  ["all", "All"],
  ["upcoming", "Upcoming"],
  ["wrapped", "Wrapped"],
];

export function EventsTabs({ filter }: { filter: string }) {
  return (
    <div className="tabs" style={{ marginTop: 4 }}>
      {TABS.map(([k, l]) => (
        <Link
          key={k}
          href={`/events?filter=${k}`}
          className={`tab ${filter === k ? "active" : ""}`}
        >
          {l}
        </Link>
      ))}
    </div>
  );
}
