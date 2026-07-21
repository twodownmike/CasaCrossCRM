"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { Sheet } from "@/components/sheet";

const PRIMARY_TABS = [
  ["overview", "Overview"],
  ["roster", "Roster"],
  ["tasks", "Tasks"],
] as const;

const MORE_TABS = [
  ["packet", "Packet", "doc"],
  ["portal", "Portal", "mail"],
  ["money", "Money", "dollar"],
  ["notes", "Notes", "chat"],
] as const;

export function EventTabs({
  eventId,
  active,
  openTaskCount,
}: {
  eventId: string;
  active: string;
  openTaskCount: number;
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const tabs: Array<[string, string]> = [
    ["overview", "Overview"],
    ["roster", "Roster"],
    ["packet", "Packet"],
    ["portal", "Portal"],
    ["money", "Money"],
    ["tasks", `Tasks (${openTaskCount})`],
    ["notes", "Notes"],
  ];
  const activeMoreTab = MORE_TABS.find(([key]) => key === active);
  return (
    <>
      <div className="event-tabs-shell">
        <div className="tabs event-tabs-desktop">
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

        <div className="tabs event-tabs-mobile">
          {PRIMARY_TABS.map(([key, label]) => (
            <Link
              key={key}
              href={`/events/${eventId}?tab=${key}`}
              className={`tab ${active === key ? "active" : ""}`}
              scroll={false}
            >
              {key === "tasks" ? `${label} (${openTaskCount})` : label}
            </Link>
          ))}
          <button
            className={`tab event-more-tab ${activeMoreTab ? "active" : ""}`}
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-label="More event sections"
          >
            {activeMoreTab?.[1] || "More"}
            <Icon.more />
          </button>
        </div>
      </div>

      <Sheet
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        title="Event sections"
      >
        <div className="event-more-list">
          {MORE_TABS.map(([key, label, icon]) => {
            const ItemIcon = Icon[icon];
            return (
              <Link
                key={key}
                href={`/events/${eventId}?tab=${key}`}
                className={`card-row ${active === key ? "selected" : ""}`}
                onClick={() => setMoreOpen(false)}
                scroll={false}
              >
                <span className="event-more-icon">
                  <ItemIcon />
                </span>
                <span>{label}</span>
                {active === key ? <Icon.check /> : <Icon.chev />}
              </Link>
            );
          })}
        </div>
      </Sheet>
    </>
  );
}
