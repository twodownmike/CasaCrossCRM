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
import { AddParticipantSheet } from "./add-participant-sheet";
import { EventTabs } from "./event-tabs";
import { RosterClient } from "./roster-client";
import { ExpensesPanel } from "./expenses-panel";
import { AddEventNoteForm } from "./add-event-note-form";
import { PacketPrintButton } from "./packet-print-button";
import { createClient as createSupabase } from "@/lib/supabase/server";
import { PortalThreadList } from "./portal-thread-list";

async function loadTemplates(): Promise<Array<{ id: string; name: string }>> {
  const supabase = createSupabase();
  const { data } = await supabase
    .from("contract_templates")
    .select("id, name")
    .order("updated_at", { ascending: false });
  return (data ?? []) as Array<{ id: string; name: string }>;
}
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
        <div
          className={e.cover_image_url ? "hero-img" : `hero-img cover-${e.cover || "modern"}`}
          style={
            e.cover_image_url
              ? {
                  backgroundImage: `url(${e.cover_image_url})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : undefined
          }
        />
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
          <RosterClient
            eventId={e.id}
            participants={e.participants.map((p) => ({
              id: p.id,
              role: p.role,
              rate: Number(p.rate),
              paid: Number(p.paid),
              status: p.status,
              contract: p.contract,
              role_note: p.role_note,
              person: {
                id: p.person.id,
                name: p.person.name,
                initials: p.person.initials,
                tint: p.person.tint,
                ink: p.person.ink,
                specialty: p.person.specialty,
              },
            }))}
            templates={await loadTemplates()}
          />
          <div style={{ padding: "var(--s-6) var(--s-5)" }}>
            <AddParticipantSheet
              eventId={e.id}
              available={availablePeople}
            />
          </div>
        </div>
      )}

      {tab === "packet" && (
        <VendorPacket event={e} />
      )}

      {tab === "portal" && (
        <PortalTab event={e} />
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

          <ExpensesPanel
            eventId={e.id}
            expenses={e.expenses}
            collected={totals.paid}
            budget={totals.rate}
          />
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

      {tab === "notes" && (
        <div className="fade-in" style={{ padding: "var(--s-5)" }}>
          {e.event_notes.length === 0 && (
            <div className="muted" style={{ fontSize: 13, marginBottom: 12 }}>
              No notes yet.
            </div>
          )}
          {e.event_notes.map((n) => (
            <div
              key={n.id}
              className="card elev"
              style={{ padding: 16, marginBottom: 10 }}
            >
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--ink-4)",
                  fontWeight: 500,
                  marginBottom: 6,
                }}
              >
                {relTime(n.created_at)}
              </div>
              <div
                style={{
                  fontFamily: "var(--serif)",
                  fontSize: 15,
                  lineHeight: 1.55,
                  color: "var(--ink-2)",
                  whiteSpace: "pre-wrap",
                }}
              >
                {n.body}
              </div>
            </div>
          ))}
          <AddEventNoteForm eventId={e.id} />
        </div>
      )}
    </div>
  );
}

import { createTask } from "@/app/actions";
import { Icon as I } from "@/components/icons";

type PacketContract = {
  participant_id: string;
  title: string;
  status: string;
  share_token: string;
  sent_at: string | null;
  signed_at: string | null;
  created_at: string;
};

type PacketPortalMessage = {
  id: string;
  event_id: string;
  person_id: string;
  sender_kind: "portal" | "team";
  sender_name: string | null;
  body: string;
  created_at: string;
};

async function VendorPacket({ event }: { event: NonNullable<Awaited<ReturnType<typeof getEvent>>> }) {
  const supabase = createSupabase();
  const participantIds = event.participants.map((p) => p.id);
  const { data: contracts } = participantIds.length
    ? await supabase
        .from("contracts")
        .select("participant_id, title, status, share_token, sent_at, signed_at, created_at")
        .in("participant_id", participantIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  const latestByParticipant = new Map<string, PacketContract>();
  ((contracts ?? []) as PacketContract[]).forEach((contract) => {
    if (!latestByParticipant.has(contract.participant_id)) {
      latestByParticipant.set(contract.participant_id, contract);
    }
  });

  const signedCount = event.participants.filter(
    (p) => latestByParticipant.get(p.id)?.status === "signed" || p.contract === "signed",
  ).length;
  const sentCount = event.participants.filter((p) => {
    const status = latestByParticipant.get(p.id)?.status || p.contract;
    return status === "sent" || status === "signed";
  }).length;
  const openTasks = event.tasks.filter((task) => !task.done).slice(0, 6);
  const vendorRoles: RoleKind[] = ["venue", "vendor", "hmua", "stylist", "photographer"];
  const packetParticipants = [
    ...event.participants.filter((p) => vendorRoles.includes(p.role)),
    ...event.participants.filter((p) => !vendorRoles.includes(p.role)),
  ];
  return (
    <div className="fade-in packet-page" style={{ padding: "var(--s-5)" }}>
      <div
        className="card elev packet-sheet"
        style={{
          padding: 20,
          marginBottom: 16,
          background: "var(--paper)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 14,
            alignItems: "flex-start",
            flexWrap: "wrap",
            marginBottom: 18,
          }}
        >
          <div>
            <div className="eyebrow">Vendor packet</div>
            <h2
              style={{
                fontFamily: "var(--serif-display)",
                fontWeight: 400,
                fontSize: 30,
                lineHeight: 1.05,
                margin: "4px 0 8px",
              }}
            >
              {event.name}
            </h2>
            <div className="muted" style={{ fontSize: 13, lineHeight: 1.5 }}>
              {fmtDateFull(event.date)}
              {event.time_label ? ` · ${event.time_label}` : ""}
              {event.location ? ` · ${event.location}` : ""}
            </div>
          </div>
          <div className="packet-print">
            <PacketPrintButton />
          </div>
        </div>

        <div className="stat-grid" style={{ margin: 0 }}>
          <PacketStat label="People" value={String(event.participants.length)} />
          <PacketStat label="Contracts sent" value={`${sentCount}/${event.participants.length}`} />
          <PacketStat label="Signed" value={`${signedCount}/${event.participants.length}`} />
        </div>
      </div>

      <PacketSection title="Schedule & Location">
        <div className="card elev packet-card">
          <PacketLine icon={<Icon.calendar style={{ width: 16, height: 16 }} />} label="Date" value={fmtDateFull(event.date)} />
          <PacketLine icon={<Icon.clock />} label="Time" value={event.time_label || "TBD"} />
          <PacketLine icon={<Icon.pin />} label="Location" value={event.location || "TBD"} />
          {event.description && (
            <div style={{ padding: 14, borderTop: "1px solid var(--hair)" }}>
              <div className="form-label" style={{ marginBottom: 6 }}>Event brief</div>
              <div style={{ fontSize: 13, lineHeight: 1.55, color: "var(--ink-2)", whiteSpace: "pre-wrap" }}>
                {event.description}
              </div>
            </div>
          )}
        </div>
      </PacketSection>

      <PacketSection title="Vendor Roster">
        <div className="card elev packet-card">
          {packetParticipants.length === 0 ? (
            <div style={{ padding: 18, color: "var(--ink-3)", fontSize: 13 }}>
              No participants added yet.
            </div>
          ) : (
            packetParticipants.map((participant) => {
              const contract = latestByParticipant.get(participant.id);
              const contractStatus = contract?.status || participant.contract;
              return (
                <div
                  key={participant.id}
                  className="card-row"
                  style={{ cursor: "default", alignItems: "flex-start" }}
                >
                  <Avatar person={participant.person} size="sm" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        alignItems: "center",
                        flexWrap: "wrap",
                        marginBottom: 3,
                      }}
                    >
                      <span style={{ fontSize: 14, fontWeight: 600 }}>
                        {participant.person.name}
                      </span>
                      <span className={`pill role-${participant.role}`}>
                        {ROLE_META[participant.role]?.label || participant.role}
                      </span>
                      <StatusPill status={contractStatus} />
                    </div>
                    {participant.person.specialty && (
                      <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 5 }}>
                        {participant.person.specialty}
                      </div>
                    )}
                    <div
                      style={{
                        display: "flex",
                        gap: 10,
                        flexWrap: "wrap",
                        fontSize: 11.5,
                        color: "var(--ink-4)",
                      }}
                    >
                      {participant.person.email && <span>{participant.person.email}</span>}
                      {participant.person.phone && <span>{participant.person.phone}</span>}
                      {participant.person.instagram && <span>{participant.person.instagram}</span>}
                    </div>
                    {participant.role_note && (
                      <div style={{ marginTop: 6, fontSize: 12, color: "var(--ink-3)" }}>
                        {participant.role_note}
                      </div>
                    )}
                  </div>
                  {contract && (
                    <Link
                      className="icon-btn packet-screen-only"
                      href={`/sign/${contract.share_token}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Open contract"
                    >
                      <Icon.share />
                    </Link>
                  )}
                </div>
              );
            })
          )}
        </div>
      </PacketSection>

      <PacketSection title="Open Prep Items">
        <div className="card elev packet-card">
          {openTasks.length === 0 ? (
            <div style={{ padding: 18, color: "var(--ink-3)", fontSize: 13 }}>
              No open tasks.
            </div>
          ) : (
            openTasks.map((task) => (
              <div key={task.id} className="card-row" style={{ cursor: "default" }}>
                <Icon.check style={{ color: "var(--ink-4)" }} />
                <div style={{ flex: 1, fontSize: 13 }}>{task.title}</div>
                {task.due && (
                  <span className="muted" style={{ fontSize: 11 }}>
                    Due {fmtDate(task.due, { short: true })}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </PacketSection>

      {event.event_notes.length > 0 && (
        <PacketSection title="Internal Notes">
          <div className="card elev packet-card">
            {event.event_notes.slice(0, 3).map((note) => (
              <div key={note.id} style={{ padding: 14, borderBottom: "1px solid var(--hair)" }}>
                <div className="muted" style={{ fontSize: 11, marginBottom: 5 }}>
                  {relTime(note.created_at)}
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                  {note.body}
                </div>
              </div>
            ))}
          </div>
        </PacketSection>
      )}
    </div>
  );
}

async function PortalTab({ event }: { event: NonNullable<Awaited<ReturnType<typeof getEvent>>> }) {
  const supabase = createSupabase();
  const personIds = event.participants.map((p) => p.person_id);

  const [{ data: portalMessages }, { data: portalUsers }] = await Promise.all([
    supabase
      .from("portal_messages")
      .select("id, event_id, person_id, sender_kind, sender_name, body, created_at")
      .eq("event_id", event.id)
      .order("created_at", { ascending: true }),
    personIds.length
      ? supabase
          .from("portal_users")
          .select("person_id")
          .in("person_id", personIds)
          .eq("active", true)
      : Promise.resolve({ data: [] as { person_id: string }[] }),
  ]);

  const portalPersonIds = new Set((portalUsers ?? []).map((u) => u.person_id));

  const vendorRoles: RoleKind[] = ["venue", "vendor", "hmua", "stylist", "photographer"];
  const portalParticipants = [
    ...event.participants.filter((p) => vendorRoles.includes(p.role)),
    ...event.participants.filter((p) => !vendorRoles.includes(p.role)),
  ].filter((p) => portalPersonIds.has(p.person_id));

  const messagesByPerson = new Map<string, PacketPortalMessage[]>();
  ((portalMessages ?? []) as PacketPortalMessage[]).forEach((m) => {
    const list = messagesByPerson.get(m.person_id) ?? [];
    list.push(m);
    messagesByPerson.set(m.person_id, list);
  });

  const threads = portalParticipants.map((p) => ({
    personId: p.person_id,
    eventId: event.id,
    person: {
      name: p.person.name,
      initials: p.person.initials,
      tint: p.person.tint,
      ink: p.person.ink,
    },
    messages: (messagesByPerson.get(p.person_id) ?? []).map((m) => ({
      id: m.id,
      sender_kind: m.sender_kind,
      sender_name: m.sender_name,
      body: m.body,
      created_at: m.created_at,
    })),
  }));

  return (
    <div className="fade-in" style={{ padding: "var(--s-5)" }}>
      <PortalThreadList threads={threads} />
    </div>
  );
}

function PacketSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: 18 }}>
      <div className="section-label" style={{ marginTop: 0 }}>
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function PacketStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <div className="label">{label}</div>
      <div className="val tabnums">{value}</div>
    </div>
  );
}

function PacketLine({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="card-row" style={{ cursor: "default" }}>
      <span style={{ color: "var(--ink-4)" }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="form-label" style={{ marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 14, color: "var(--ink-2)" }}>{value}</div>
      </div>
    </div>
  );
}

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
