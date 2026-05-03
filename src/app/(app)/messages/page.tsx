import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { relTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const supabase = createClient();
  const { data: events } = await supabase
    .from("events")
    .select("id, name, cover")
    .order("date", { ascending: true });

  const { data: lastMsgs } = await supabase
    .from("messages")
    .select("id, event_id, sender_name, text, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  const lastByEvent = new Map<
    string,
    { sender_name: string | null; text: string; created_at: string }
  >();
  (lastMsgs ?? []).forEach((m) => {
    if (!lastByEvent.has(m.event_id))
      lastByEvent.set(m.event_id, {
        sender_name: m.sender_name,
        text: m.text,
        created_at: m.created_at,
      });
  });

  const threads = (events ?? [])
    .map((e) => ({ event: e, last: lastByEvent.get(e.id) }))
    .filter((t) => t.last);

  return (
    <div className="fade-in">
      <div className="page-head">
        <div className="eyebrow">Conversations</div>
        <h1>
          All <em>messages</em>
        </h1>
        <div className="sub">Per-event group chats with your team</div>
      </div>

      <div
        style={{
          padding: "0 var(--s-5)",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {threads.map(({ event, last }) => (
          <Link
            key={event.id}
            href={`/events/${event.id}?tab=chat`}
            className="card elev"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: 14,
              textAlign: "left",
              border: "1px solid var(--hair)",
              background: "var(--paper)",
            }}
          >
            <div
              className={`cover-${event.cover || "modern"}`}
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="row between" style={{ marginBottom: 3 }}>
                <div
                  style={{
                    fontFamily: "var(--serif)",
                    fontWeight: 500,
                    fontSize: 15,
                  }}
                >
                  {event.name}
                </div>
                <div style={{ fontSize: 11, color: "var(--ink-4)" }}>
                  {relTime(last!.created_at)}
                </div>
              </div>
              <div
                style={{
                  fontSize: 12.5,
                  color: "var(--ink-3)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {last!.sender_name && (
                  <strong
                    style={{ color: "var(--ink-2)", fontWeight: 500 }}
                  >
                    {last!.sender_name}:{" "}
                  </strong>
                )}
                {last!.text}
              </div>
            </div>
          </Link>
        ))}

        {threads.length === 0 && (
          <div className="empty">
            <h3>No conversations yet</h3>
            <div>Open an event chat to start talking with your team.</div>
          </div>
        )}
      </div>
    </div>
  );
}
