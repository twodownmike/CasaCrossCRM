import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { relTime } from "@/lib/format";
import { Avatar } from "@/components/avatar";

export async function ConversationsList() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: events }, { data: people }, { data: portalMsgs }, { data: reads }] = await Promise.all([
    supabase.from("events").select("id, name, date, cover, cover_image_url"),
    supabase.from("people").select("id, name, initials, tint, ink"),
    supabase
      .from("portal_messages")
      .select(
        "id, event_id, person_id, sender_kind, sender_name, body, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(200),
    user
      ? supabase
          .from("portal_thread_reads")
          .select("event_id, person_id, read_at")
          .eq("reader_kind", "team")
          .eq("user_id", user.id)
      : Promise.resolve({ data: [] as { event_id: string; person_id: string; read_at: string }[] }),
  ]);

  type LastMsg = {
    event_id: string;
    person_id: string;
    sender_name: string | null;
    sender_kind: string;
    body: string;
    created_at: string;
    count: number;
    unread: number;
  };
  const readAtByThread = new Map(
    (reads ?? []).map((row) => [
      `${row.event_id}:${row.person_id}`,
      row.read_at,
    ]),
  );
  const lastByThread = new Map<string, LastMsg>();
  (portalMsgs ?? []).forEach((m) => {
    const threadKey = `${m.event_id}:${m.person_id}`;
    const readAt = readAtByThread.get(threadKey);
    const isUnread = m.sender_kind === "portal" && (!readAt || m.created_at > readAt);
    const existing = lastByThread.get(threadKey);
    if (!existing) {
      lastByThread.set(threadKey, {
        event_id: m.event_id,
        person_id: m.person_id,
        sender_name: m.sender_name,
        sender_kind: m.sender_kind,
        body: m.body,
        created_at: m.created_at,
        count: 1,
        unread: isUnread ? 1 : 0,
      });
    } else {
      existing.count += 1;
      if (isUnread) existing.unread += 1;
    }
  });

  const eventById = new Map((events ?? []).map((e) => [e.id, e]));
  const personById = new Map((people ?? []).map((p) => [p.id, p]));
  const threads = Array.from(lastByThread.values())
    .map((last) => ({
      event: eventById.get(last.event_id),
      person: personById.get(last.person_id),
      last,
    }))
    .filter(
      (
        t,
      ): t is {
        event: NonNullable<typeof t.event>;
        person: NonNullable<typeof t.person>;
        last: LastMsg;
      } => !!t.event && !!t.person,
    )
    .sort((a, b) => b.last.created_at.localeCompare(a.last.created_at));

  if (threads.length === 0) {
    return (
      <div className="empty">
        <h3>No conversations yet</h3>
        <div>Portal messages from vendors and clients will appear here.</div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "0 var(--s-5)",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      {threads.map(({ event, person, last }) => (
        <Link
          key={`${event.id}:${person.id}`}
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
          <Avatar person={person} size="sm" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="row between" style={{ marginBottom: 3 }}>
              <div
                style={{
                  fontFamily: "var(--serif)",
                  fontWeight: 500,
                  fontSize: 15,
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {person.name}
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                {last.unread > 0 && (
                  <span className="pill warn" style={{ padding: "4px 7px" }}>
                    {last.unread}
                  </span>
                )}
                <div style={{ fontSize: 11, color: "var(--ink-4)" }}>
                  {relTime(last.created_at)}
                </div>
              </div>
            </div>
            <div
              style={{
                fontSize: 11.5,
                color: "var(--ink-4)",
                marginBottom: 3,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {event.name}
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
                  {last.sender_kind === "team" ? "You" : person.name}:{" "}
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
    </div>
  );
}
