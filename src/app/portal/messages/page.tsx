import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/icons";
import { fmtDateFull, relTime } from "@/lib/format";
import type { EventRow, Participant, PortalMessage } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PortalMessagesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/portal/messages");

  const { data: access } = await supabase
    .from("portal_users")
    .select("person_id")
    .eq("active", true)
    .limit(1)
    .maybeSingle();
  if (!access) redirect("/portal");

  const { data: parts } = await supabase
    .from("participants")
    .select("*")
    .eq("person_id", access.person_id)
    .range(0, 999);
  const participants = (parts ?? []) as Participant[];
  const eventIds = participants.map((p) => p.event_id);

  const [{ data: events }, { data: messages }, { data: reads }] = await Promise.all([
    eventIds.length
      ? supabase.from("events").select("*").in("id", eventIds)
      : Promise.resolve({ data: [] as EventRow[] }),
    eventIds.length
      ? supabase
          .from("portal_messages")
          .select("*")
          .in("event_id", eventIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as PortalMessage[] }),
    eventIds.length
      ? supabase
          .from("portal_thread_reads")
          .select("event_id, person_id, read_at")
          .eq("reader_kind", "portal")
          .eq("user_id", user.id)
      : Promise.resolve({ data: [] as { event_id: string; person_id: string; read_at: string }[] }),
  ]);

  const eventById = new Map(
    ((events ?? []) as EventRow[]).map((event) => [event.id, event]),
  );
  const readAtByEvent = new Map(
    (reads ?? []).map((row) => [row.event_id, row.read_at]),
  );
  const threads = eventIds
    .map((eventId) => {
      const event = eventById.get(eventId);
      if (!event) return null;
      const threadMessages = ((messages ?? []) as PortalMessage[]).filter(
        (message) => message.event_id === eventId,
      );
      const latest = threadMessages[0] ?? null;
      const readAt = readAtByEvent.get(eventId);
      const unread = threadMessages.filter(
        (message) =>
          message.sender_kind === "team" &&
          (!readAt || message.created_at > readAt),
      ).length;
      return { event, latest, unread, count: threadMessages.length };
    })
    .filter(Boolean) as Array<{
    event: EventRow;
    latest: PortalMessage | null;
    unread: number;
    count: number;
  }>;

  threads
    .sort((a, b) => {
      const aDate = a.latest?.created_at ?? a.event.date;
      const bDate = b.latest?.created_at ?? b.event.date;
      return bDate.localeCompare(aDate);
    });

  const unreadTotal = threads.reduce((sum, thread) => sum + thread.unread, 0);

  return (
    <div>
      <header className="app-header" style={{ paddingLeft: 0, paddingRight: 0 }}>
        <Link className="icon-btn" href="/portal">
          <Icon.back />
        </Link>
        <div
          style={{
            fontFamily: "var(--serif)",
            fontWeight: 500,
            fontSize: 15,
          }}
        >
          Messages
        </div>
        <div style={{ width: 36 }} />
      </header>

      <div className="page-head" style={{ paddingLeft: 0, paddingRight: 0 }}>
        <div className="page-head-text">
          <div className="eyebrow">Portal</div>
          <h1>
            Your <em>messages</em>
          </h1>
          <div className="sub">
            {unreadTotal > 0
              ? `${unreadTotal} unread from Casa Cross`
              : "Event conversations in one place"}
          </div>
        </div>
      </div>

      <div className="card elev">
        {threads.length === 0 ? (
          <div style={{ padding: 24, color: "var(--ink-3)", fontSize: 13 }}>
            No event conversations are visible yet.
          </div>
        ) : (
          threads.map((thread) => (
            <Link
              key={thread.event.id}
              href={`/portal/events/${thread.event.id}#messages`}
              className="card-row"
              style={{ alignItems: "flex-start" }}
            >
              <span
                className="avatar"
                style={{
                  background: thread.unread
                    ? "var(--terracotta-tint)"
                    : "var(--sage-tint)",
                  color: thread.unread ? "var(--terracotta)" : "var(--sage)",
                }}
              >
                <Icon.chat style={{ width: 16, height: 16 }} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="row between" style={{ gap: 8 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {thread.event.name}
                  </div>
                  {thread.unread > 0 && (
                    <span className="pill warn" style={{ flexShrink: 0 }}>
                      {thread.unread}
                    </span>
                  )}
                </div>
                <div
                  style={{
                    fontSize: 11.5,
                    color: "var(--ink-4)",
                    marginTop: 3,
                  }}
                >
                  {fmtDateFull(thread.event.date)}
                  {thread.latest ? ` · ${relTime(thread.latest.created_at)}` : ""}
                </div>
                <div
                  style={{
                    fontSize: 12.5,
                    color: "var(--ink-3)",
                    marginTop: 5,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {thread.latest
                    ? `${thread.latest.sender_kind === "portal" ? "You" : "Casa Cross"}: ${thread.latest.body}`
                    : "No messages yet. Open the event to start a conversation."}
                </div>
              </div>
              <Icon.chev style={{ color: "var(--ink-4)", marginTop: 8 }} />
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
