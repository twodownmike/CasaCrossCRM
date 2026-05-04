"use client";

import Link from "next/link";

const TABS: [string, string][] = [
  ["overview", "Overview"],
  ["by-event", "By Event"],
  ["by-person", "By Person"],
];

export function ReportsTabs({ active }: { active: string }) {
  return (
    <div className="tabs">
      {TABS.map(([k, l]) => (
        <Link
          key={k}
          href={`/reports?tab=${k}`}
          className={`tab ${active === k ? "active" : ""}`}
          scroll={false}
        >
          {l}
        </Link>
      ))}
    </div>
  );
}
