"use client";

import Link from "next/link";

export function InboxViewSwitcher({
  view,
  submissionCount,
  conversationCount,
}: {
  view: "submissions" | "conversations";
  submissionCount: number;
  conversationCount: number;
}) {
  return (
    <div className="tabs" style={{ marginBottom: 4 }}>
      <Link
        href="/inbox"
        className={`tab ${view === "submissions" ? "active" : ""}`}
        scroll={false}
      >
        Submissions
        {submissionCount > 0 && (
          <span className="ds-count" style={{ marginLeft: 6 }}>
            {submissionCount}
          </span>
        )}
      </Link>
      <Link
        href="/inbox?view=conversations"
        className={`tab ${view === "conversations" ? "active" : ""}`}
        scroll={false}
      >
        Conversations
        {conversationCount > 0 && (
          <span className="ds-count" style={{ marginLeft: 6 }}>
            {conversationCount}
          </span>
        )}
      </Link>
    </div>
  );
}
