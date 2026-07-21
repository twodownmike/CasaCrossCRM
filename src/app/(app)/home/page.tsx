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
import type { Submission } from "@/lib/types";

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

  type Action = {
    kind: "lead" | "contract" | "payment" | "task" | "event";
    href: string;
    title: string;
    detail: string;
    tone: "warm" | "gold" | "sage" | "slate";
    icon: "mail" | "doc" | "dollar" | "check" | "calendar";
    priority: number;
    due?: string;
    bucket: "overdue" | "today" | "upcoming" | "waiting";
  };
  const actions: Action[] = [];

  const [{ data: submissionRows }, { data: portalMessages }, { data: portalReads }] =
    await Promise.all([
      supabase
        .from("submissions")
        .select("*")
        .neq("status", "approved")
        .neq("status", "archived")
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("portal_messages")
        .select("event_id, person_id, sender_name, body, created_at")
        .eq("sender_kind", "portal")
        .order("created_at", { ascending: false })
        .limit(100),
      user
        ? supabase
            .from("portal_thread_reads")
            .select("event_id, person_id, read_at")
            .eq("reader_kind", "team")
            .eq("user_id", user.id)
        : Promise.resolve({ data: [] as { event_id: string; person_id: string; read_at: string }[] }),
    ]);
  const submissions = (submissionRows ?? []) as Submission[];
  const crmDateKey = (date: Date) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Denver",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  const todayKey = crmDateKey(new Date());
  submissions.forEach((s) => {
    const age = Math.max(
      0,
      Math.floor((Date.now() - new Date(s.created_at).getTime()) / 86_400_000),
    );
    const name = s.preferred_name || s.name;
    const stagePriority =
      s.status === "pending" ? 95 : s.status === "reviewing" ? 82 : 64;
    const priorityBoost =
      s.priority === "urgent"
        ? 24
        : s.priority === "high"
          ? 12
          : s.priority === "low"
            ? -8
            : 0;
    const followUpAt = s.follow_up_at ? new Date(s.follow_up_at) : null;
    const followUpDateKey = followUpAt ? crmDateKey(followUpAt) : null;
    const followUpBucket = followUpAt
      ? followUpDateKey! < todayKey
        ? "overdue"
        : followUpDateKey === todayKey
          ? "today"
          : "upcoming"
      : null;
    actions.push({
      kind: "lead",
      href: `/inbox/${s.id}`,
      title:
        followUpAt
          ? `Follow up with ${name}`
          : s.status === "pending"
            ? `Review ${name}`
            : s.status === "reviewing"
              ? `Decide on ${name}`
              : `Follow up with ${name}`,
      detail: followUpAt
        ? `${s.role} application · ${followUpAt.toLocaleString(undefined, { timeZone: "America/Denver", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}`
        : `${s.role} application · ${age === 0 ? "new today" : `${age}d old`}`,
      tone: s.status === "pending" ? "warm" : "gold",
      icon: "mail",
      priority:
        stagePriority +
        priorityBoost +
        Math.min(age, 10) +
        (followUpBucket === "overdue" ? 20 : 0),
      due: s.follow_up_at || undefined,
      bucket:
        followUpBucket ||
        (s.status === "invited"
          ? "waiting"
          : age >= 7
            ? "overdue"
            : "today"),
    });
  });

  const readAtByThread = new Map(
    (portalReads ?? []).map((row) => [
      `${row.event_id}:${row.person_id}`,
      row.read_at,
    ]),
  );
  const latestUnreadByThread = new Map<
    string,
    {
      event_id: string;
      sender_name: string | null;
      body: string;
      created_at: string;
      count: number;
    }
  >();
  (portalMessages ?? []).forEach((message) => {
    const key = `${message.event_id}:${message.person_id}`;
    const readAt = readAtByThread.get(key);
    if (readAt && message.created_at <= readAt) return;
    const existing = latestUnreadByThread.get(key);
    if (!existing) {
      latestUnreadByThread.set(key, {
        event_id: message.event_id,
        sender_name: message.sender_name,
        body: message.body,
        created_at: message.created_at,
        count: 1,
      });
    } else {
      existing.count += 1;
    }
  });
  latestUnreadByThread.forEach((thread) => {
    const event = events.find((e) => e.id === thread.event_id);
    actions.push({
      kind: "lead",
      href: `/events/${thread.event_id}?tab=portal`,
      title: `Reply to ${thread.sender_name || "portal message"}`,
      detail: `${event?.name ?? "Portal"} · ${thread.count} unread`,
      tone: "warm",
      icon: "mail",
      priority: 96,
      bucket: "today",
    });
  });

  events.forEach((e) => {
    if (e.status === "wrapped") return;
    const daysToEvent = daysUntil(e.date);
    if (daysToEvent < 0 && e.stage !== "complete") {
      actions.push({
        kind: "event",
        href: `/events/${e.id}`,
        title: `Complete ${e.name}`,
        detail: "Event date has passed · reconcile and close out",
        tone: "warm",
        icon: "calendar",
        priority: 99,
        due: e.date,
        bucket: "overdue",
      });
    }
    if (daysToEvent >= 0 && daysToEvent <= 7) {
      actions.push({
        kind: "event",
        href: `/events/${e.id}`,
        title: daysToEvent === 0 ? `${e.name} is today` : `Prep ${e.name}`,
        detail:
          daysToEvent === 0
            ? "Check roster, tasks, and messages"
            : `${daysUntilLabel(e.date)} · ${e.participants.length} booked`,
        tone: "slate",
        icon: "calendar",
        priority: 76 - daysToEvent,
        due: e.date,
        bucket: daysToEvent === 0 ? "today" : "upcoming",
      });
    }
    e.participants.forEach((p) => {
      if (p.contract_required && p.contract === "unsent") {
        actions.push({
          kind: "contract",
          href: `/events/${e.id}/participants/${p.id}`,
          title: `Send contract to ${p.person.name}`,
          detail: e.name,
          tone: "warm",
          icon: "doc",
          priority: 74,
          bucket: "today",
        });
      } else if (
        p.contract_required &&
        (p.contract === "sent" || p.contract === "opened")
      ) {
        actions.push({
          kind: "contract",
          href: `/events/${e.id}/participants/${p.id}`,
          title: `Awaiting ${p.person.name}'s signature`,
          detail: `${e.name} · ${p.contract === "opened" ? "opened" : "sent"}`,
          tone: "gold",
          icon: "doc",
          priority: p.contract === "opened" ? 61 : 54,
          bucket: "waiting",
        });
      }
      if (
        p.payment_required &&
        (p.status === "due" || p.status === "partial") &&
        Number(p.paid) < Number(p.rate) &&
        p.due_date &&
        daysUntil(p.due_date) < 7
      ) {
        const daysToDue = daysUntil(p.due_date);
        actions.push({
          kind: "payment",
          href: `/events/${e.id}/participants/${p.id}`,
          title:
            daysToDue < 0
              ? `Payment overdue from ${p.person.name}`
              : `Payment due from ${p.person.name}`,
          detail: `${e.name} · due ${fmtDate(p.due_date, { short: true })}`,
          tone: daysToDue < 0 ? "warm" : "sage",
          icon: "dollar",
          priority: daysToDue < 0 ? 92 : 70 - daysToDue,
          due: p.due_date,
          bucket: daysToDue < 0 ? "overdue" : "waiting",
        });
      }
    });
  });

  const { data: openTasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("done", false);
  (openTasks ?? []).forEach((t) => {
    const e = events.find((ev) => ev.id === t.event_id);
    const d = t.due ? daysUntil(t.due) : null;
    if (e && (d === null || d <= 14)) {
      actions.push({
        kind: "task",
        href: `/events/${e.id}?tab=tasks`,
        title: t.title,
        detail: `${e.name}${t.due ? ` · ${daysUntilLabel(t.due) || fmtDate(t.due, { short: true })}` : ""}`,
        tone: d !== null && d < 0 ? "warm" : "sage",
        icon: "check",
        priority: d === null ? 48 : d < 0 ? 90 : 68 - d,
        due: t.due ?? undefined,
        bucket:
          d !== null && d < 0
            ? "overdue"
            : d === 0 || d === null
              ? "today"
              : "upcoming",
      });
    }
  });
  actions.sort((a, b) => b.priority - a.priority);
  const actionGroups = [
    { key: "overdue", label: "Overdue", tone: "warm" },
    { key: "today", label: "Today", tone: "slate" },
    { key: "upcoming", label: "Upcoming", tone: "sage" },
    { key: "waiting", label: "Waiting", tone: "gold" },
  ] as const;

  const leadCount = submissions.length;
  const tasksDueCount = actions.filter((a) => a.kind === "task").length;
  const iconFor = {
    mail: Icon.mail,
    doc: Icon.doc,
    dollar: Icon.dollar,
    check: Icon.check,
    calendar: Icon.calendar,
  };
  const toneStyle = {
    warm: {
      background: "var(--terracotta-tint)",
      color: "var(--terracotta)",
    },
    gold: { background: "var(--gold-tint)", color: "var(--gold)" },
    sage: { background: "var(--sage-tint)", color: "var(--sage)" },
    slate: { background: "var(--slate-tint)", color: "var(--slate)" },
  };

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

      <div className="home-priority-layout">
        <div className="home-stats-wrap">
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
            <div className="stat">
              <div className="label">Active leads</div>
              <div className="val tabnums">{leadCount}</div>
              <div className="delta down">in booking pipeline</div>
            </div>
            <div className="stat">
              <div className="label">Open tasks</div>
              <div className="val tabnums">{tasksDueCount}</div>
              <div className="delta">due or unscheduled</div>
            </div>
          </div>
        </div>

        {next && (
          <div className="home-next-wrap">
          <div className="section-label">
            <h2>Up next</h2>
            <Link className="more" href="/events">
              All events ›
            </Link>
          </div>
          <div style={{ padding: "0 var(--s-5)" }}>
            <EventCard event={next} />
          </div>
          </div>
        )}

        {actions.length > 0 && (
          <div className="home-actions-wrap">
          <div className="section-label">
            <h2>Action queue</h2>
            <span className="pill warn">
              <span className="dot" />
              {actions.length}
            </span>
          </div>
          <div className="action-groups">
            {actionGroups.map((group) => {
              const groupActions = actions
                .filter((action) => action.bucket === group.key)
                .slice(0, 5);
              if (groupActions.length === 0) return null;
              return (
                <section key={group.key} className="action-group">
                  <div className="action-group-head">
                    <span>{group.label}</span>
                    <span>{groupActions.length}</span>
                  </div>
                  <div className="card elev">
                    {groupActions.map((a) => {
                      const ActionIcon = iconFor[a.icon];
                      return (
                        <Link
                          key={`${group.key}-${a.kind}-${a.href}-${a.title}`}
                          className="card-row"
                          href={a.href}
                        >
                          <span
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: "50%",
                              ...toneStyle[a.tone],
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <ActionIcon />
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
                              {a.title}
                            </div>
                            <div
                              style={{
                                fontSize: 12,
                                color: "var(--ink-3)",
                                marginTop: 2,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {a.detail}
                            </div>
                          </div>
                          <Icon.chev style={{ color: "var(--ink-4)" }} />
                        </Link>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
          </div>
        )}
      </div>

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
