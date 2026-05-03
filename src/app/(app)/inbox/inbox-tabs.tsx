"use client";

import Link from "next/link";

const TABS: Array<[string, string]> = [
  ["pending", "Pending"],
  ["approved", "Approved"],
  ["archived", "Archived"],
];

export function InboxTabs({ filter }: { filter: string }) {
  return (
    <div className="tabs">
      {TABS.map(([k, l]) => (
        <Link
          key={k}
          href={`/inbox?filter=${k}`}
          className={`tab ${filter === k ? "active" : ""}`}
        >
          {l}
        </Link>
      ))}
    </div>
  );
}
