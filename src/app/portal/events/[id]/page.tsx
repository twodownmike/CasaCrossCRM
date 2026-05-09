import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/icons";
import { StatusPill } from "@/components/pill";
import { daysUntilLabel, fmtDateFull, relTime } from "@/lib/format";
import { sendPortalMessage } from "@/app/portal-actions";
import { PortalThreadReadMarker } from "@/app/portal-thread-read-marker";
import { ROLE_META, type Contract, type EventRow, type FormAssignment, type Participant } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PortalEventPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/portal/events/${params.id}`);

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();
  if (!event) notFound();

  const { data: participant } = await supabase
    .from("participants")
    .select("*")
    .eq("event_id", params.id)
    .maybeSingle();
  if (!participant) notFound();

  const { data: contracts } = await supabase
    .from("contracts")
    .select("*")
    .eq("participant_id", participant.id)
    .order("created_at", { ascending: false });
  const { data: messages } = await supabase
    .from("portal_messages")
    .select("*")
    .eq("event_id", params.id)
    .order("created_at", { ascending: true });
  const { data: formAssignments } = await supabase
    .from("form_assignments")
    .select("*, form:forms(title)")
    .eq("participant_id", participant.id)
    .order("created_at", { ascending: false });

  const contractRows = (contracts ?? []) as Contract[];
  const eventRow = event as EventRow;
  const participantRow = participant as Participant;
  const unsignedContracts = contractRows.filter(
    (contract) => contract.status !== "signed" && contract.status !== "void",
  );
  const assignedForms = (formAssignments ?? []) as Array<
    FormAssignment & { form?: { title: string } | null }
  >;
  const openForms = assignedForms.filter((assignment) => !assignment.completed_at);
  const latestUnsigned = unsignedContracts[0];
  const todoCount = (latestUnsigned ? 1 : 0) + openForms.length;
  const signedContracts = contractRows.filter((contract) => contract.status === "signed").length;
  const eventTiming = daysUntilLabel(eventRow.date) || fmtDateFull(eventRow.date);
  const mapHref = eventRow.location
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(eventRow.location)}`
    : null;
  const roleLabel =
    participantRow.role_note || ROLE_META[participantRow.role]?.label || participantRow.role;

  return (
    <div>
      <PortalThreadReadMarker
        eventId={params.id}
        personId={participantRow.person_id}
        kind="portal"
      />
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
          Event portal
        </div>
        <div style={{ width: 36 }} />
      </header>

      <div
        className="card elev"
        style={{
          overflow: "hidden",
          marginTop: 8,
          background: "var(--paper)",
        }}
      >
        <div
          className={eventRow.cover_image_url ? "" : `cover-${eventRow.cover || "modern"}`}
          style={{
            height: 174,
            backgroundImage: eventRow.cover_image_url
              ? `url(${eventRow.cover_image_url})`
              : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div style={{ padding: 18 }}>
          <div className="eyebrow">Assignment</div>
          <h1 style={{ marginTop: 4 }}>{eventRow.name}</h1>
          <div className="sub" style={{ marginBottom: 14 }}>
            {eventTiming}
            {eventRow.time_label ? ` · ${eventRow.time_label}` : ""}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <a className="btn sm" href="#messages">
              <Icon.chat /> Message
            </a>
            {mapHref && (
              <a
                className="btn sm"
                href={mapHref}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon.pin /> Directions
              </a>
            )}
            {latestUnsigned && (
              <Link className="btn sm" href={`/sign/${latestUnsigned.share_token}`}>
                <Icon.doc /> Sign
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="card elev" style={{ marginTop: 18 }}>
        <PortalLine icon={<Icon.calendar style={{ width: 16, height: 16 }} />} label="Date" value={fmtDateFull(eventRow.date)} />
        <PortalLine icon={<Icon.clock />} label="Time" value={eventRow.time_label || "TBD"} />
        <PortalLine icon={<Icon.pin />} label="Location" value={eventRow.location || "TBD"} />
        <PortalLine icon={<Icon.users />} label="Your role" value={roleLabel} />
      </div>

      <section style={{ marginTop: 22 }}>
        <div className="section-label" style={{ marginTop: 0 }}>
          <h2>Readiness</h2>
        </div>
        <div className="card elev">
          <ReadinessLine
            done={Boolean(eventRow.time_label)}
            label="Schedule"
            detail={eventRow.time_label || "Casa Cross will confirm the call time."}
          />
          <ReadinessLine
            done={Boolean(eventRow.location)}
            label="Location"
            detail={eventRow.location || "Location details are not posted yet."}
          />
          <ReadinessLine
            done={unsignedContracts.length === 0}
            label="Contracts"
            detail={
              contractRows.length === 0
                ? "No contract is posted yet."
                : `${signedContracts}/${contractRows.length} signed`
            }
          />
          <ReadinessLine
            done={Boolean(eventRow.portal_brief)}
            label="Brief"
            detail={eventRow.portal_brief ? "Event notes are ready." : "Briefing notes are coming soon."}
          />
        </div>
      </section>

      <section style={{ marginTop: 22 }}>
        <div className="section-label" style={{ marginTop: 0 }}>
          <h2>Event brief</h2>
        </div>
        <div
          className="card elev"
          style={{
            padding: 16,
            fontFamily: "var(--serif)",
            fontSize: 15,
            lineHeight: 1.6,
            whiteSpace: "pre-wrap",
            color: eventRow.portal_brief ? "var(--ink-2)" : "var(--ink-3)",
          }}
        >
          {eventRow.portal_brief ||
            "Casa Cross will add arrival notes, creative direction, and any day-of details here when they are ready."}
        </div>
      </section>

      <section style={{ marginTop: 22 }}>
        <div className="section-label" style={{ marginTop: 0 }}>
          <h2>To-do</h2>
          <span className="muted" style={{ fontSize: 12 }}>
            {todoCount}
          </span>
        </div>
        <div className="card elev">
          {todoCount === 0 ? (
            <div style={{ padding: 20, fontSize: 13, color: "var(--sage)" }}>
              You&apos;re all set for now.
            </div>
          ) : (
            <>
              {latestUnsigned && (
                <Link
                  href={`/sign/${latestUnsigned.share_token}`}
                  className="card-row"
                >
                  <Icon.doc style={{ color: "var(--terracotta)" }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>
                      Sign {latestUnsigned.title}
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--ink-4)", marginTop: 3 }}>
                      Required before the event.
                    </div>
                  </div>
                  <Icon.chev style={{ color: "var(--ink-4)" }} />
                </Link>
              )}
              {openForms.map((assignment) => (
                <Link
                  key={assignment.id}
                  href={`/fa/${assignment.share_token}`}
                  className="card-row"
                >
                  <Icon.doc style={{ color: "var(--gold)" }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>
                      Complete {assignment.form?.title || "form"}
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--ink-4)", marginTop: 3 }}>
                      Requested by Casa Cross.
                    </div>
                  </div>
                  <Icon.chev style={{ color: "var(--ink-4)" }} />
                </Link>
              ))}
            </>
          )}
        </div>
      </section>

      {assignedForms.length > 0 && (
        <section style={{ marginTop: 22 }}>
          <div className="section-label" style={{ marginTop: 0 }}>
            <h2>Forms</h2>
            <span className="muted" style={{ fontSize: 12 }}>
              {assignedForms.length}
            </span>
          </div>
          <div className="card elev">
            {assignedForms.map((assignment) => (
              <Link
                key={assignment.id}
                href={`/fa/${assignment.share_token}`}
                className="card-row"
              >
                <Icon.doc style={{ color: "var(--ink-4)" }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>
                    {assignment.form?.title || "Form"}
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--ink-4)", marginTop: 3 }}>
                    {assignment.completed_at
                      ? `Completed ${relTime(assignment.completed_at)}`
                      : assignment.sent_at
                        ? `Sent ${relTime(assignment.sent_at)}`
                        : `Assigned ${relTime(assignment.created_at)}`}
                  </div>
                </div>
                <StatusPill status={assignment.completed_at ? "signed" : "sent"} />
              </Link>
            ))}
          </div>
        </section>
      )}

      <section style={{ marginTop: 22 }}>
        <div className="section-label" style={{ marginTop: 0 }}>
          <h2>Your contracts</h2>
          <span className="muted" style={{ fontSize: 12 }}>
            {(contracts ?? []).length}
          </span>
        </div>
        <div className="card elev">
          {(contracts ?? []).length === 0 ? (
            <div style={{ padding: 24, color: "var(--ink-3)", fontSize: 13 }}>
              No contract links are available yet.
            </div>
          ) : (
            ((contracts ?? []) as Contract[]).map((contract) => (
              <Link
                key={contract.id}
                href={`/sign/${contract.share_token}`}
                className="card-row"
              >
                <Icon.doc style={{ color: "var(--ink-4)" }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>
                    {contract.title}
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--ink-4)", marginTop: 3 }}>
                    {contract.signed_at
                      ? `Signed ${relTime(contract.signed_at)}`
                      : contract.opened_at
                        ? `Opened ${relTime(contract.opened_at)}`
                      : contract.sent_at
                        ? `Sent ${relTime(contract.sent_at)}`
                        : `Created ${relTime(contract.created_at)}`}
                  </div>
                </div>
                <StatusPill status={contractDisplayStatus(contract)} />
              </Link>
            ))
          )}
        </div>
      </section>

      <section id="messages" style={{ marginTop: 22 }}>
        <div className="section-label" style={{ marginTop: 0 }}>
          <h2>Messages</h2>
          <span className="muted" style={{ fontSize: 12 }}>
            {(messages ?? []).length}
          </span>
        </div>
        <div className="card elev" style={{ padding: 14 }}>
          {(messages ?? []).length === 0 ? (
            <div style={{ padding: 10, color: "var(--ink-3)", fontSize: 13 }}>
              No messages yet. Send Casa Cross a note about this event.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {(messages ?? []).map((message) => {
                const mine = message.sender_kind === "portal";
                return (
                  <div
                    key={message.id}
                    style={{
                      display: "flex",
                      justifyContent: mine ? "flex-end" : "flex-start",
                    }}
                  >
                    <div style={{ maxWidth: "82%" }}>
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--ink-4)",
                          marginBottom: 3,
                          textAlign: mine ? "right" : "left",
                        }}
                      >
                        {mine ? "You" : "Casa Cross"} · {relTime(message.created_at)}
                      </div>
                      <div
                        style={{
                          padding: "10px 13px",
                          borderRadius: mine
                            ? "16px 16px 4px 16px"
                            : "16px 16px 16px 4px",
                          background: mine ? "var(--ink)" : "var(--hair-2)",
                          color: mine ? "white" : "var(--ink)",
                          fontSize: 14,
                          lineHeight: 1.45,
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {message.body}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <form action={sendPortalMessage} className="form-grid" style={{ marginTop: 14 }}>
            <input type="hidden" name="event_id" value={params.id} />
            <textarea
              name="body"
              required
              className="input textarea"
              placeholder="Message Casa Cross about this event..."
              style={{ minHeight: 86 }}
            />
            <button className="btn primary block" type="submit">
              <Icon.send /> Send message
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

function contractDisplayStatus(contract: Contract) {
  if (contract.status === "signed") return "signed";
  if (contract.status === "sent" && contract.opened_at) return "opened";
  return contract.status;
}

function ReadinessLine({
  done,
  label,
  detail,
}: {
  done: boolean;
  label: string;
  detail: string;
}) {
  return (
    <div className="card-row" style={{ cursor: "default" }}>
      <span
        style={{
          width: 26,
          height: 26,
          borderRadius: "50%",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          background: done ? "var(--sage-tint)" : "var(--gold-tint)",
          color: done ? "var(--sage)" : "var(--gold)",
        }}
      >
        {done ? <Icon.check /> : <Icon.clock />}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 11.5, color: "var(--ink-4)", marginTop: 3 }}>
          {detail}
        </div>
      </div>
    </div>
  );
}

function PortalLine({
  icon,
  label,
  value,
  status,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  status?: string;
}) {
  return (
    <div className="card-row" style={{ cursor: "default" }}>
      <span style={{ color: "var(--ink-4)" }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="form-label" style={{ marginBottom: 2 }}>
          {label}
        </div>
        {status ? (
          <StatusPill status={status} />
        ) : (
          <div style={{ fontSize: 14 }}>{value}</div>
        )}
      </div>
    </div>
  );
}
