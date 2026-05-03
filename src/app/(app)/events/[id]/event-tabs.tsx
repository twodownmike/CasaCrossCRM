"use client";

import Link from "next/link";

export function EventTabs({
  eventId,
  active,
  openTaskCount,
}: {
  eventId: string;
  active: string;
  openTaskCount: number;
}) {
  const tabs: Array<[string, string]> = [
    ["overview", "Overview"],
    ["roster", "Roster"],
    ["money", "Money"],
    ["tasks", `Tasks (${openTaskCount})`],
    ["board", "Mood"],
    ["chat", "Chat"],
  ];
  return (
    <div className="tabs">
      {tabs.map(([k, l]) => (
        <Link
          key={k}
          href={`/events/${eventId}?tab=${k}`}
          className={`tab ${active === k ? "active" : ""}`}
          scroll={false}
        >
          {l}
        </Link>
      ))}
    </div>
  );
}
