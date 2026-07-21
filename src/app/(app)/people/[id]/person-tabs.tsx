"use client";

import Link from "next/link";

export function PersonTabs({
  personId,
  active,
  eventCount,
}: {
  personId: string;
  active: string;
  eventCount: number;
}) {
  const tabs: Array<[string, string]> = [
    ["about", "About"],
    ["activity", "Activity"],
    ["events", `Events (${eventCount})`],
    ["money", "Money"],
    ["notes", "Notes"],
  ];
  return (
    <div className="tabs">
      {tabs.map(([k, l]) => (
        <Link
          key={k}
          href={`/people/${personId}?tab=${k}`}
          className={`tab ${active === k ? "active" : ""}`}
          scroll={false}
        >
          {l}
        </Link>
      ))}
    </div>
  );
}
