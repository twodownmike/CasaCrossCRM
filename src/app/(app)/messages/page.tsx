import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { relTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const supabase = createClient();

  const [{ data: events }, { data: portalMsgs }] = await Promise.all([
    supabase.from("events").select("id, name, cover, cover_image_url"),
    supabase
      .from("portal_messages")
      .select("id, event_id, person_id, sender_kind, sender_name, body, created_at")
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  type LastMsg = { sender_name: string | null; sender_kind: string; body: string; created_at: string; count: number };
  const lastByEvent = new Map<string, LastMsg>();
  (portalMsgs ?? []).forEach((m) => {
    const existing = lastByEvent.get(m.event_id);
    if (!existing) {
      lastByEvent.set(m.event_id, {
        sender_name: m.sender_name,
        sender_kind: m.sender_kind,
        body: m.body,
        created_at: m.created_at,
        count: 1,
      });
    } else {
      existing.count += 1;
    }
  });

  const eventById = new Map((events ?? []).map((e) => [e.id, e]));
  const threads = Array.from(lastByEvent.entries())
    .map(([eventId, last]) => ({ event: eventById.get(eventId), last }))
    .filter((t): t is { event: NonNullable<typeof t.event>; last: LastMsg } => !!t.event)
    .sort((a, b) => b.last.created_at.localeCompare(a.last.created_at));

  return (
    <div className="fade-in">
      <div className="page-head">
        <div className="eyebrow">Portal</div>
        <h1>
          All <em>messages</em>
        </h1>
        <div className="sub">Conversations with your vendors and clients</div>
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
            href={`/events/${event.id}?tab=portal`}
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
              className={event.cover_image_url ? "" : `cover-${event.cover || "modern"}`}
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                flexShrink: 0,
                backgroundImage: event.cover_image_url
                  ? `url(${event.cover_image_url})`
                  : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
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
                  {relTime(last.created_at)}
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
                {last.sender_name && (
                  <strong style={{ color: "var(--ink-2)", fontWeight: 500 }}>
                    {last.sender_kind === "team" ? "You" : last.sender_name}:{" "}
                  </strong>
                )}
                {last.body}
              </div>
              <div style={{ fontSize: 11, color: "var(--ink-4)", marginTop: 3 }}>
                {last.count} message{last.count === 1 ? "" : "s"}
              </div>
            </div>
          </Link>
        ))}

        {threads.length === 0 && (
          <div className="empty">
            <h3>No conversations yet</h3>
            <div>Portal messages from vendors and clients will appear here.</div>
          </div>
        )}
      </div>
    </div>
  );
}
