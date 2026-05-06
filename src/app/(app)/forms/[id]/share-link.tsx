"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";

export function ShareLink({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  const baseUrl =
    process.env.NEXT_PUBLIC_PORTAL_URL || process.env.NEXT_PUBLIC_EVENTS_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");
  const path = `/f/${slug}`;
  const url = `${baseUrl}${path}`;

  function copy() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div
      className="card elev"
      style={{
        padding: 12,
        display: "flex",
        gap: 8,
        alignItems: "center",
      }}
    >
      <code
        style={{
          flex: 1,
          fontSize: 12,
          color: "var(--ink-2)",
          background: "var(--hair-2)",
          padding: "8px 12px",
          borderRadius: 8,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          fontFamily: "ui-monospace, Menlo, monospace",
        }}
      >
        {url}
      </code>
      <button className="btn sm" type="button" onClick={copy}>
        {copied ? "Copied" : "Copy"}
      </button>
      <a
        className="btn sm"
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Open"
      >
        <Icon.share />
      </a>
    </div>
  );
}
