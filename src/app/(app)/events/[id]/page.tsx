import Link from "next/link";
import { notFound } from "next/navigation";
import { getEvent, listPeople } from "@/lib/queries";
import {
  fmtDate,
  fmtDateFull,
  fmtMoney,
  daysUntilLabel,
} from "@/lib/format";
import { ROLE_META, ROLE_ORDER, type RoleKind } from "@/lib/types";
import { StatusPill } from "@/components/pill";
import { Avatar } from "@/components/avatar";
import { Icon } from "@/components/icons";
import { TaskRow } from "./task-row";
import { ChatPanel } from "./chat-panel";
import { AddParticipantSheet } from "./add-participant-sheet";
import { EventTabs } from "./event-tabs";
import { relTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function EventDetail({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { tab?: string };
}) {
  const e = await getEvent(params.id);
  if (!e) notFound();

  const tab = searchParams.tab || "overview";
  const totals = e.participants.reduce(
    (acc, p) => {
      acc.rate += Number(p.rate);
      acc.paid += Number(p.paid);
      return acc;
    },
    { rate: 0, paid: 0 },
  );
  const remaining = totals.rate - totals.paid;
  const pct =
    totals.rate > 0 ? Math.round((totals.paid / totals.rate) * 100) : 100;

  const byRole: Partial<Record<RoleKind, typeof e.participants>> = {};
  e.participants.forEach((p) => {
    (byRole[p.role] ||= []).push(p);
  });

  const completed = e.tasks.filter((t) => t.done).length;
  const allPeople = await listPeople();
  const usedIds = new Set(e.participants.map((p) => p.person_id));
  const availablePeople = allPeople.filter((p) => !usedIds.has(p.id));

  return (
    <div className="fade-in">
      <div className="hero">
        <div className={`hero-img cover-${e.cover || "modern"}`} />
        <Link className="back" href="/events">
          <Icon.back />
        </Link>
        <div className="right-actions">
          <Link className="icon-btn" href={`/events/${e.id}/edit`}>
            <Icon.doc />
          </Link>
        </div>
        <div className="overlay">
          <div className="row gap-2" style={{ marginBottom: 6 }}>
            <StatusPill status={e.status} />
            <span
              className="pill"
              style={{
                background: "rgba(255,255,255,0.18)",
                color: "white",
                backdropFilter: "blur(8px)",
              }}
            >
              {daysUntilLabel(e.date) || fmtDate(e.date)}
            </span>
          </div>
          {e.subtitle && <div className="eyebrow">{e.subtitle}</div>}
          <h1>{e.name}</h1>
        </div>
      </div>

      <div
        style={{
          padding: "var(--s-5)",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <div className="label-line">
          <Icon.calendar style={{ width: 16, height: 16 }} />
          <span>
            {fmtDateFull(e.date)}
            {e.time_label ? ` · ${e.time_label}` : ""}
          </span>
        </div>
        {e.location && (
          <div className="label-line">
            <Icon.pin />
            <span>{e.location}</span>
          </div>
        )}
        <div className="label-line">
          <Icon.users />
          <span>
            {e.participants.length} participants · capacity {e.capacity ?? 12}
          </span>
        </div>
      </div>

      <EventTabs
        eventId={e.id}
        active={tab}
        openTaskCount={e.tasks.length - completed}
      />

      {tab === "overview" && (
        <div className="fade-in" style={{ padding: "var(--s-5)" }}>
          {e.description && (
            <p
              style={{
                margin: "0 0 var(--s-6)",
                fontFamily: "var(--serif)",
                fontSize: 16,
                lineHeight: 1.55,
                color: "var(--ink-2)",
              }}
            >
              {e.description}
            </p>
          )}

          <div
            className="card elev"
            style={{ padding: "var(--s-5)", marginBottom: 20 }}
          >
            <div className="row between" style={{ marginBottom: 10 }}>
              <div>
                <div
                  className="label"
                  style={{
                    fontSize: 11,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--ink-4)",
                    fontWeight: 500,
                  }}
                >
                  Collected
                </div>
                <div className="money" style={{ fontSize: 28, marginTop: 2 }}>
                  {fmtMoney(totals.paid)}{" "}
                  <small
                    style={{
                      fontFamily: "var(--sans)",
                      fontSize: 13,
                      color: "var(--ink-3)",
                    }}
                  >
                    of {fmtMoney(totals.rate)}
                  </small>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div
                  className="label"
                  style={{
                    fontSize: 11,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--ink-4)",
                    fontWeight: 500,
                  }}
                >
                  Outstanding
                </div>
                <div
                  className="money"
                  style={{
                    fontSize: 22,
                    marginTop: 2,
                    color:
                      remaining > 0 ? "var(--terracotta)" : "var(--sage)",
                  }}
                >
                  {fmtMoney(remaining)}
                </div>
              </div>
            </div>
            <div
              className={`progress ${pct === 100 ? "sage" : "terracotta"}`}
            >
              <i style={{ width: pct + "%" }} />
            </div>
          </div>

          {e.tags && e.tags.length > 0 && (
            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                marginBottom: 24,
              }}
            >
              {e.tags.map((t) => (
                <span key={t} className="pill">
                  {t}
                </span>
              ))}
            </div>
          )}

          {e.activity.length > 0 && (
            <div>
              <div
                style={{
                  fontFamily: "var(--serif)",
                  fontWeight: 500,
                  fontSize: 15,
                  marginBottom: 14,
                }}
              >
                Recent activity
              </div>
              <div className="timeline">
                {e.activity.map((a) => (
                  <div key={a.id} className={`item ${a.tone || ""}`}>
                    <div className="when">{relTime(a.occurred_at)}</div>
                    <div className="what">{a.what}</div>
                    {a.who && <div className="who">{a.who}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "roster" && (
        <div className="fade-in">
          {ROLE_ORDER.filter((r) => byRole[r]).map((role) => (
            <div key={role}>
              <div className="section-label" style={{ marginTop: 24 }}>
                <h2>{ROLE_META[role].plural}</h2>
                <span className="muted" style={{ fontSize: 12 }}>
                  {byRole[role]!.length}
                </span>
              </div>
              <div style={{ padding: "0 var(--s-5)" }}>
                <div className="card elev">
                  {byRole[role]!.map((part) => (
                    <Link
                      key={part.id}
                      href={`/people/${part.person.id}`}
                      className="card-row"
                    >
                      <Avatar person={part.person} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 500,
                            color: "var(--ink)",
                          }}
                        >
                          {part.person.name}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: "var(--ink-3)",
                            marginTop: 2,
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            flexWrap: "wrap",
                          }}
                        >
                          {Number(part.rate) > 0 ? (
                            <span className="tabnums">
                              {fmtMoney(Number(part.rate))}
                            </span>
                          ) : (
                            <span>Comp</span>
                          )}
                          <span>·</span>
                          <StatusPill status={part.contract} />
                        </div>
                      </div>
                      {Number(part.rate) > 0 && (
                        <StatusPill status={part.status} />
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}
          <div style={{ padding: "var(--s-6) var(--s-5)" }}>
            <AddParticipantSheet
              eventId={e.id}
              available={availablePeople}
            />
          </div>
        </div>
      )}

      {tab === "money" && (
        <div className="fade-in" style={{ padding: "var(--s-5)" }}>
          <div
            className="card elev"
            style={{ padding: "var(--s-5)", marginBottom: 16 }}
          >
            <div
              className="label"
              style={{
                fontSize: 11,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--ink-4)",
                fontWeight: 500,
                marginBottom: 4,
              }}
            >
              Total budget
            </div>
            <div className="money" style={{ fontSize: 32 }}>
              {fmtMoney(totals.rate)}
            </div>
            <div
              className="row between"
              style={{ marginTop: 14, marginBottom: 8 }}
            >
              <span className="muted" style={{ fontSize: 13 }}>
                {fmtMoney(totals.paid)} collected
              </span>
              <span className="muted tabnums" style={{ fontSize: 13 }}>
                {pct}%
              </span>
            </div>
            <div
              className={`progress ${pct === 100 ? "sage" : "terracotta"}`}
            >
              <i style={{ width: pct + "%" }} />
            </div>
          </div>

          <div className="card elev">
            {e.participants
              .filter((p) => Number(p.rate) > 0)
              .map((part) => {
                const rate = Number(part.rate);
                const paid = Number(part.paid);
                const left = rate - paid;
                return (
                  <Link
                    key={part.id}
                    href={`/events/${e.id}/participants/${part.id}`}
                    className="card-row"
                  >
                    <Avatar person={part.person} size="sm" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>
                        {part.person.name}
                      </div>
                      <div
                        style={{
                          fontSize: 11.5,
                          color: "var(--ink-3)",
                          marginTop: 2,
                        }}
                      >
                        {fmtMoney(paid)} of {fmtMoney(rate)}
                        {part.due_date && left > 0 &&
                          ` · due ${fmtDate(part.due_date, { short: true })}`}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div
                        className="money tabnums"
                        style={{
                          fontSize: 16,
                          color:
                            left > 0
                              ? "var(--terracotta)"
                              : "var(--sage)",
                        }}
                      >
                        {left > 0 ? fmtMoney(left) : "✓"}
                      </div>
                    </div>
                  </Link>
                );
              })}
            {e.participants.filter((p) => Number(p.rate) > 0).length === 0 && (
              <div
                style={{
                  padding: 24,
                  textAlign: "center",
                  color: "var(--ink-3)",
                  fontSize: 13,
                }}
              >
                No paid participants yet.
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "tasks" && (
        <div className="fade-in" style={{ padding: "var(--s-5)" }}>
          <div className="card elev">
            {e.tasks.length === 0 && (
              <div
                style={{
                  padding: 24,
                  textAlign: "center",
                  color: "var(--ink-3)",
                  fontSize: 13,
                }}
              >
                No tasks yet.
              </div>
            )}
            {e.tasks.map((t) => (
              <TaskRow key={t.id} task={t} eventId={e.id} />
            ))}
          </div>
          <NewTaskForm eventId={e.id} />
        </div>
      )}

      {tab === "board" && (
        <div className="fade-in" style={{ padding: "var(--s-5)" }}>
          <div
            style={{
              fontFamily: "var(--serif)",
              fontWeight: 500,
              fontSize: 15,
              marginBottom: 12,
            }}
          >
            Color story
          </div>
          {e.moodboard && e.moodboard.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(6, 1fr)",
                gap: 8,
                marginBottom: 24,
              }}
            >
              {e.moodboard.map((c, i) => (
                <div
                  key={i}
                  style={{
                    aspectRatio: "1",
                    borderRadius: "var(--r-2)",
                    background: c,
                    border: "1px solid var(--hair)",
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="muted" style={{ fontSize: 13, marginBottom: 24 }}>
              No palette yet.
            </div>
          )}
          <div
            style={{
              fontFamily: "var(--serif)",
              fontWeight: 500,
              fontSize: 15,
              marginBottom: 12,
            }}
          >
            Inspiration
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
            }}
          >
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`cover-${e.cover || "modern"}`}
                style={{
                  aspectRatio: i === 0 || i === 3 ? "3/4" : "1",
                  borderRadius: "var(--r-3)",
                  opacity: 0.6 + (i % 3) * 0.13,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {tab === "chat" && <ChatPanel eventId={e.id} messages={e.messages} />}
    </div>
  );
}

import { createTask } from "@/app/actions";
import { Icon as I } from "@/components/icons";

function NewTaskForm({ eventId }: { eventId: string }) {
  return (
    <form
      action={createTask}
      style={{
        marginTop: 16,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <input type="hidden" name="event_id" value={eventId} />
      <div className="form-row">
        <input
          name="title"
          required
          className="input"
          placeholder="Add a task…"
        />
        <input name="due" type="date" className="input" style={{ flex: 0.7 }} />
      </div>
      <button className="btn" type="submit">
        <I.plus /> Add task
      </button>
    </form>
  );
}
