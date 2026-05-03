import Link from "next/link";
import { listEvents, listPeople, aggregateFinances } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import {
  fmtMoney,
  fmtDate,
  daysUntil,
  daysUntilLabel,
  eyebrowToday,
} from "@/lib/format";
import { EventCard } from "@/components/event-card";
import { Avatar } from "@/components/avatar";
import { RolePill } from "@/components/pill";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const firstName =
    (user?.user_metadata?.name as string)?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "friend";

  const [events, people] = await Promise.all([listEvents(), listPeople()]);

  const upcoming = events.filter((e) => e.status !== "wrapped");
  const next = upcoming[0];
  const fin = aggregateFinances(events);

  type Action =
    | { kind: "contract"; eventId: string; eventName: string; personName: string }
    | {
        kind: "payment";
        eventId: string;
        eventName: string;
        personName: string;
        dueDate: string;
      };
  const actions: Action[] = [];
  events.forEach((e) => {
    if (e.status === "wrapped") return;
    e.participants.forEach((p) => {
      if (p.contract === "unsent") {
        // unsent + needs a contract; "na" signals no contract needed
        actions.push({
          kind: "contract",
          eventId: e.id,
          eventName: e.name,
          personName: p.person.name,
        });
      } else if (
        p.status === "due" &&
        p.due_date &&
        daysUntil(p.due_date) < 7
      ) {
        actions.push({
          kind: "payment",
          eventId: e.id,
          eventName: e.name,
          personName: p.person.name,
          dueDate: p.due_date,
        });
      }
    });
  });

  type TodoItem = { eventId: string; eventName: string; title: string; due: string };
  const todos: TodoItem[] = [];
  // Tasks come from events query? They don't — we need a separate fetch.
  const { data: openTasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("done", false);
  (openTasks ?? []).forEach((t) => {
    if (!t.due) return;
    const d = daysUntil(t.due);
    if (d <= 14 && d >= 0) {
      const e = events.find((ev) => ev.id === t.event_id);
      if (e) {
        todos.push({
          eventId: e.id,
          eventName: e.name,
          title: t.title,
          due: t.due,
        });
      }
    }
  });
  todos.sort((a, b) => a.due.localeCompare(b.due));

  const { count: inboxCount } = await supabase
    .from("submissions")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  return (
    <div className="fade-in">
      <div className="page-head">
        <div className="eyebrow">{eyebrowToday()}</div>
        <h1>
          Morning, <em>{firstName}</em>.
        </h1>
        <div className="sub">
          {upcoming.length} active events · {actions.length} need attention
        </div>
      </div>

      {inboxCount && inboxCount > 0 ? (
        <div style={{ padding: "0 var(--s-5) var(--s-4)" }}>
          <Link
            href="/inbox"
            className="card elev"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: 14,
              border: "1px solid var(--hair)",
              background: "var(--paper)",
            }}
          >
            <span
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: "var(--terracotta-tint)",
                color: "var(--terracotta)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon.mail />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>
                {inboxCount} new application{inboxCount === 1 ? "" : "s"}
              </div>
              <div
                style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}
              >
                Tap to review and approve.
              </div>
            </div>
            <Icon.chev style={{ color: "var(--ink-4)" }} />
          </Link>
        </div>
      ) : null}

      <div className="stat-grid">
        <div className="stat">
          <div className="label">Outstanding</div>
          <div className="val tabnums">{fmtMoney(fin.owed)}</div>
          <div className="delta down">{fmtMoney(fin.overdue)} overdue</div>
        </div>
        <div className="stat">
          <div className="label">Collected</div>
          <div className="val tabnums">{fmtMoney(fin.paid)}</div>
          <div className="delta up">across {events.length} events</div>
        </div>
      </div>

      {next && (
        <>
          <div className="section-label">
            <h2>Up next</h2>
            <Link className="more" href="/events">
              All events ›
            </Link>
          </div>
          <div style={{ padding: "0 var(--s-5)" }}>
            <EventCard event={next} />
          </div>
        </>
      )}

      {actions.length > 0 && (
        <>
          <div className="section-label">
            <h2>Needs your attention</h2>
            <span className="pill warn">
              <span className="dot" />
              {actions.length}
            </span>
          </div>
          <div style={{ padding: "0 var(--s-5)" }}>
            <div className="card elev">
              {actions.slice(0, 5).map((a, i) => (
                <Link
                  key={i}
                  className="card-row"
                  href={`/events/${a.eventId}`}
                >
                  <span
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: "var(--terracotta-tint)",
                      color: "var(--terracotta)",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {a.kind === "contract" ? <Icon.doc /> : <Icon.dollar />}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 500,
                        color: "var(--ink)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {a.kind === "contract"
                        ? `Send contract to ${a.personName}`
                        : `Payment due from ${a.personName}`}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--ink-3)",
                        marginTop: 2,
                      }}
                    >
                      {a.eventName}
                      {a.kind === "payment" &&
                        ` · due ${fmtDate(a.dueDate, { short: true })}`}
                    </div>
                  </div>
                  <Icon.chev style={{ color: "var(--ink-4)" }} />
                </Link>
              ))}
            </div>
          </div>
        </>
      )}

      {todos.length > 0 && (
        <>
          <div className="section-label">
            <h2>This week</h2>
            <span className="muted" style={{ fontSize: 12 }}>
              {todos.length} tasks
            </span>
          </div>
          <div style={{ padding: "0 var(--s-5)" }}>
            <div className="card elev">
              {todos.slice(0, 4).map((t, i) => (
                <Link
                  key={i}
                  className="card-row"
                  href={`/events/${t.eventId}`}
                >
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      border: "1.5px solid var(--ink-4)",
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, color: "var(--ink)" }}>
                      {t.title}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--ink-3)",
                        marginTop: 2,
                      }}
                    >
                      {t.eventName} ·{" "}
                      {daysUntilLabel(t.due) || fmtDate(t.due, { short: true })}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="section-label">
        <h2>Recent people</h2>
        <Link className="more" href="/people">
          Roster ›
        </Link>
      </div>
      <div
        style={{
          padding: "0 var(--s-5)",
          display: "flex",
          gap: 10,
          overflowX: "auto",
          paddingBottom: 4,
        }}
      >
        {people.slice(0, 8).map((p) => (
          <Link
            key={p.id}
            href={`/people/${p.id}`}
            style={{
              flexShrink: 0,
              width: 100,
              padding: 12,
              background: "var(--paper)",
              border: "1px solid var(--hair)",
              borderRadius: "var(--r-3)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Avatar person={p} size="lg" />
            <div
              style={{
                fontSize: 12,
                fontWeight: 500,
                textAlign: "center",
                lineHeight: 1.2,
              }}
            >
              {p.name.split(" ")[0]}
            </div>
            <RolePill role={p.role} />
          </Link>
        ))}
      </div>

      <div style={{ height: 24 }} />
    </div>
  );
}
