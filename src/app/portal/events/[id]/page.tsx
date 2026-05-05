import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/icons";
import { StatusPill } from "@/components/pill";
import { fmtDateFull, fmtMoney, relTime } from "@/lib/format";
import { sendPortalMessage } from "@/app/portal-actions";
import type { Contract, EventRow, Participant } from "@/lib/types";

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

  const contractRows = (contracts ?? []) as Contract[];
  const participantRow = participant as Participant;
  const remaining = Math.max(
    0,
    Number(participantRow.rate ?? 0) - Number(participantRow.paid ?? 0),
  );
  const unsignedContracts = contractRows.filter(
    (contract) => contract.status !== "signed" && contract.status !== "void",
  );
  const latestUnsigned = unsignedContracts[0];
  const todoCount = (remaining > 0 ? 1 : 0) + (latestUnsigned ? 1 : 0);

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
          Event portal
        </div>
        <div style={{ width: 36 }} />
      </header>

      <div className="page-head" style={{ paddingLeft: 0, paddingRight: 0 }}>
        <div className="page-head-text">
          <div className="eyebrow">Assignment</div>
          <h1>{(event as EventRow).name}</h1>
          <div className="sub">
            {fmtDateFull((event as EventRow).date)}
            {(event as EventRow).time_label ? ` · ${(event as EventRow).time_label}` : ""}
          </div>
        </div>
      </div>

      <div className="card elev">
        <PortalLine icon={<Icon.calendar style={{ width: 16, height: 16 }} />} label="Date" value={fmtDateFull((event as EventRow).date)} />
        <PortalLine icon={<Icon.clock />} label="Time" value={(event as EventRow).time_label || "TBD"} />
        <PortalLine icon={<Icon.pin />} label="Location" value={(event as EventRow).location || "TBD"} />
        <PortalLine icon={<Icon.users />} label="Your status" value={participantRow.status} status={participantRow.status} />
      </div>

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
              {remaining > 0 && (
                <div className="card-row" style={{ cursor: "default" }}>
                  <Icon.dollar style={{ color: "var(--terracotta)" }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>
                      Payment remaining: {fmtMoney(remaining)}
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--ink-4)", marginTop: 3 }}>
                      Message Casa Cross here if you need payment instructions.
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {(event as EventRow).description && (
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
            }}
          >
            {(event as EventRow).description}
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
                      : contract.sent_at
                        ? `Sent ${relTime(contract.sent_at)}`
                        : `Created ${relTime(contract.created_at)}`}
                  </div>
                </div>
                <StatusPill status={contract.status} />
              </Link>
            ))
          )}
        </div>
      </section>

      <section style={{ marginTop: 22 }}>
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
