import Link from "next/link";
import { listEvents, aggregateFinances } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import {
  fmtMoney,
  fmtDate,
  daysUntil,
  daysUntilLabel,
  eyebrowToday,
} from "@/lib/format";
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

  const events = await listEvents();

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
  const leadCount = submissions.length;
  const tasksDueCount = actions.filter((a) => a.kind === "task").length;
  const actionable = actions.filter((action) => action.bucket !== "waiting");
  const focusActions = actionable.slice(0, 3);
  const moreActions = actionable.slice(3);
  const waitingActions = actions.filter((action) => action.bucket === "waiting");
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
  const actionRow = (action: Action, keyPrefix: string) => {
    const ActionIcon = iconFor[action.icon];
    return (
      <Link
        key={`${keyPrefix}-${action.kind}-${action.href}-${action.title}`}
        className="card-row home-action-row"
        href={action.href}
      >
        <span className="home-action-icon" style={toneStyle[action.tone]}>
          <ActionIcon />
        </span>
        <span className="home-action-copy">
          <strong>{action.title}</strong>
          <small>{action.detail}</small>
        </span>
        <Icon.chev />
      </Link>
    );
  };

  return (
    <div className="fade-in home-page">
      <div className="page-head home-head">
        <div className="page-head-text">
          <div className="eyebrow">{eyebrowToday()}</div>
          <h1>
            Morning, <em>{firstName}</em>.
          </h1>
          <div className="sub">Here&apos;s what matters most today.</div>
        </div>
      </div>

      <div className="home-dashboard-grid">
        <section className="home-focus">
          <div className="section-label">
            <h2>Focus</h2>
          </div>
          <div className="home-section-body">
            {focusActions.length > 0 ? (
              <div className="card elev">{focusActions.map((action) => actionRow(action, "focus"))}</div>
            ) : (
              <div className="home-caught-up">
                <span><Icon.check /></span>
                <div>
                  <strong>You&apos;re caught up</strong>
                  <small>No urgent follow-ups right now.</small>
                </div>
              </div>
            )}

            {moreActions.length > 0 && (
              <details className="home-more-items">
                <summary>
                  <span>View remaining</span>
                  <span>{moreActions.length}</span>
                  <Icon.chev />
                </summary>
                <div className="card">{moreActions.map((action) => actionRow(action, "more"))}</div>
              </details>
            )}

            {waitingActions.length > 0 && (
              <details className="home-more-items waiting">
                <summary>
                  <span>Waiting on others</span>
                  <span>{waitingActions.length}</span>
                  <Icon.chev />
                </summary>
                <div className="card">{waitingActions.map((action) => actionRow(action, "waiting"))}</div>
              </details>
            )}
          </div>
        </section>

        {next && (
          <section className="home-next">
          <div className="section-label">
            <h2>Up next</h2>
            <Link className="more" href="/events">All events</Link>
          </div>
          <div className="home-section-body">
            <Link href={`/events/${next.id}`} className="card elev home-next-card">
              <span className="home-next-date">
                <strong>{new Date(`${next.date}T12:00:00`).toLocaleDateString(undefined, { month: "short", timeZone: "America/Denver" })}</strong>
                <span>{new Date(`${next.date}T12:00:00`).toLocaleDateString(undefined, { day: "numeric", timeZone: "America/Denver" })}</span>
              </span>
              <span className="home-next-copy">
                <strong>{next.name}</strong>
                <small>{[daysUntilLabel(next.date), next.location].filter(Boolean).join(" · ")}</small>
              </span>
              <Icon.chev />
            </Link>
          </div>
          </section>
        )}
      </div>

      <details className="home-overview">
        <summary>
          <span>
            <strong>Studio overview</strong>
            <small>{upcoming.length} active events</small>
          </span>
          <span className="home-overview-total">{fmtMoney(fin.owed)} outstanding</span>
          <Icon.chev />
        </summary>
        <div className="home-overview-grid">
          <div><span>Collected</span><strong>{fmtMoney(fin.paid)}</strong></div>
          <div><span>Overdue</span><strong>{fmtMoney(fin.overdue)}</strong></div>
          <div><span>Active leads</span><strong>{leadCount}</strong></div>
          <div><span>Open tasks</span><strong>{tasksDueCount}</strong></div>
        </div>
      </details>

      <div style={{ height: 24 }} />
    </div>
  );
}
