"use client";

import { useState } from "react";
import { Avatar } from "@/components/avatar";
import { Icon } from "@/components/icons";
import { relTime } from "@/lib/format";
import { sendTeamPortalMessage } from "@/app/portal-actions";
import { PortalThreadReadMarker } from "@/app/portal-thread-read-marker";

export type PortalThread = {
  personId: string;
  eventId: string;
  person: { name: string; initials: string | null; tint: string | null; ink: string | null };
  messages: {
    id: string;
    sender_kind: "portal" | "team";
    sender_name: string | null;
    body: string;
    created_at: string;
  }[];
  unreadCount: number;
};

export function PortalThreadList({ threads }: { threads: PortalThread[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(
    threads.find((thread) => thread.unreadCount > 0)?.personId ?? null,
  );

  if (threads.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>
        No contacts have portal access yet. Grant access from a person's profile page.
      </div>
    );
  }

  return (
    <div className="card elev" style={{ overflow: "hidden" }}>
      {threads.map((thread) => {
        const expanded = expandedId === thread.personId;
        const last = thread.messages[thread.messages.length - 1];
        const hasMessages = thread.messages.length > 0;

        return (
          <div key={thread.personId} style={{ borderBottom: "1px solid var(--hair)" }}>
            <button
              type="button"
              onClick={() => setExpandedId(expanded ? null : thread.personId)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: 14,
                background: "none",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <Avatar person={thread.person} size="sm" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>
                  {thread.person.name}
                </div>
                <div
                  className="muted"
                  style={{
                    fontSize: 11.5,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {hasMessages
                    ? `${thread.messages.length} message${thread.messages.length === 1 ? "" : "s"} · ${relTime(last!.created_at)}`
                    : "No messages yet"}
                </div>
              </div>
              <Icon.chev
                style={{
                  flexShrink: 0,
                  color: "var(--ink-4)",
                  transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.15s",
                }}
              />
            </button>

            {expanded && (
              <div style={{ padding: "0 14px 14px" }}>
                <PortalThreadReadMarker
                  eventId={thread.eventId}
                  personId={thread.personId}
                  kind="team"
                />
                {hasMessages ? (
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}
                  >
                    {thread.messages.map((message) => {
                      const team = message.sender_kind === "team";
                      return (
                        <div
                          key={message.id}
                          style={{
                            alignSelf: team ? "flex-end" : "flex-start",
                            maxWidth: "86%",
                          }}
                        >
                          <div
                            style={{
                              fontSize: 10.5,
                              color: "var(--ink-4)",
                              marginBottom: 3,
                              textAlign: team ? "right" : "left",
                            }}
                          >
                            {team ? "Casa Cross" : thread.person.name} · {relTime(message.created_at)}
                          </div>
                          <div
                            style={{
                              padding: "8px 11px",
                              borderRadius: team
                                ? "14px 14px 4px 14px"
                                : "14px 14px 14px 4px",
                              background: team ? "var(--ink)" : "var(--hair-2)",
                              color: team ? "white" : "var(--ink)",
                              fontSize: 13,
                              lineHeight: 1.45,
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            {message.body}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p
                    style={{
                      fontSize: 13,
                      color: "var(--ink-3)",
                      margin: "0 0 12px",
                      textAlign: "center",
                    }}
                  >
                    No messages yet — start the conversation.
                  </p>
                )}
                <form action={sendTeamPortalMessage} className="form-grid">
                  <input type="hidden" name="event_id" value={thread.eventId} />
                  <input type="hidden" name="person_id" value={thread.personId} />
                  <textarea
                    name="body"
                    required
                    className="input textarea"
                    placeholder={`Message ${thread.person.name}…`}
                    style={{ minHeight: 74 }}
                  />
                  <button className="btn primary block" type="submit">
                    <Icon.send /> Send
                  </button>
                </form>
              </div>
            )}
            {!expanded && thread.unreadCount > 0 && (
              <div style={{ padding: "0 14px 12px 60px" }}>
                <span className="pill warn">
                  <span className="dot" />
                  {thread.unreadCount} unread
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
