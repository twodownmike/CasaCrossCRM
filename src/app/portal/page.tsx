import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/avatar";
import { Icon } from "@/components/icons";
import { StatusPill } from "@/components/pill";
import { daysUntil, daysUntilLabel, fmtDateFull } from "@/lib/format";
import type { EventRow, Participant, Person, Contract, FormAssignment } from "@/lib/types";

export const dynamic = "force-dynamic";

type PortalAccess = {
  id: string;
  person_id: string;
  email: string;
  display_name: string | null;
  first_name: string | null;
};

type PortalBooking = Participant & {
  event: EventRow;
  contracts: Contract[];
  forms: Array<FormAssignment & { form?: { title: string } | null }>;
};

export default async function PortalHome() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/portal");

  const { data: access, error: accessError } = await supabase
    .from("portal_users")
    .select("id, person_id, email, display_name, first_name")
    .eq("active", true)
    .limit(1)
    .maybeSingle();

  if (accessError || !access) {
    return (
      <div>
        <h1>
          Portal <em>access</em>
        </h1>
        <div className="notice warn">
          This email does not have portal access yet. Ask Casa Cross to invite
          or link this email to your profile.
        </div>
      </div>
    );
  }

  const [{ data: person }, { data: parts }] = await Promise.all([
    supabase.from("people").select("*").eq("id", access.person_id).maybeSingle(),
    supabase
      .from("participants")
      .select("*")
      .eq("person_id", access.person_id)
      .range(0, 999),
  ]);

  if (!person) {
    return (
      <div className="notice warn">
        Portal profile could not be loaded. Contact Casa Cross.
      </div>
    );
  }

  const participants = (parts ?? []) as Participant[];
  const eventIds = participants.map((p) => p.event_id);
  const participantIds = participants.map((p) => p.id);

  const [{ data: events }, { data: contracts }, { data: formAssignments }] = await Promise.all([
    eventIds.length
      ? supabase.from("events").select("*").in("id", eventIds)
      : Promise.resolve({ data: [] }),
    participantIds.length
      ? supabase
          .from("contracts")
          .select("*")
          .in("participant_id", participantIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    participantIds.length
      ? supabase
          .from("form_assignments")
          .select("*, form:forms(title)")
          .in("participant_id", participantIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);

  const eventsById = new Map<string, EventRow>();
  ((events ?? []) as EventRow[]).forEach((event) => eventsById.set(event.id, event));
  const contractsByParticipant = new Map<string, Contract[]>();
  ((contracts ?? []) as Contract[]).forEach((contract) => {
    const list = contractsByParticipant.get(contract.participant_id) ?? [];
    list.push(contract);
    contractsByParticipant.set(contract.participant_id, list);
  });
  const formsByParticipant = new Map<string, PortalBooking["forms"]>();
  ((formAssignments ?? []) as PortalBooking["forms"]).forEach((assignment) => {
    const list = formsByParticipant.get(assignment.participant_id) ?? [];
    list.push(assignment);
    formsByParticipant.set(assignment.participant_id, list);
  });

  const bookings: PortalBooking[] = participants
    .map((participant) => {
      const event = eventsById.get(participant.event_id);
      if (!event) return null;
      return {
        ...participant,
        event,
        contracts: contractsByParticipant.get(participant.id) ?? [],
        forms: formsByParticipant.get(participant.id) ?? [],
      };
    })
    .filter((booking): booking is PortalBooking => Boolean(booking))
    .sort((a, b) => a.event.date.localeCompare(b.event.date));
  const nextBooking = bookings.find((booking) => daysUntil(booking.event.date) >= 0);
  const unsignedContracts = bookings.flatMap((booking) =>
    booking.contracts
      .filter((contract) => contract.status !== "signed" && contract.status !== "void")
      .map((contract) => ({ booking, contract })),
  );
  const openForms = bookings.flatMap((booking) =>
    booking.forms
      .filter((assignment) => !assignment.completed_at)
      .map((assignment) => ({ booking, assignment })),
  );
  const [{ data: teamMessages }, { data: messageReads }] = await Promise.all([
    eventIds.length
      ? supabase
          .from("portal_messages")
          .select("event_id, person_id, created_at")
          .eq("sender_kind", "team")
          .in("event_id", eventIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    eventIds.length
      ? supabase
          .from("portal_thread_reads")
          .select("event_id, person_id, read_at")
          .eq("reader_kind", "portal")
          .eq("user_id", user.id)
      : Promise.resolve({ data: [] }),
  ]);
  const readAtByEvent = new Map(
    (messageReads ?? []).map((row) => [row.event_id, row.read_at]),
  );
  const unreadMessageEventIds = new Set<string>();
  (teamMessages ?? []).forEach((message) => {
    const readAt = readAtByEvent.get(message.event_id);
    if (!readAt || message.created_at > readAt) {
      unreadMessageEventIds.add(message.event_id);
    }
  });
  const unreadMessageBookings = bookings.filter((booking) =>
    unreadMessageEventIds.has(booking.event.id),
  );
  const actionCount =
    (nextBooking ? 1 : 0) +
    unsignedContracts.length +
    openForms.length +
    unreadMessageBookings.length;

  return (
    <div>
      <PortalHeader person={person as Person} access={access as PortalAccess} />

      <div className="section-label" style={{ marginTop: 28 }}>
        <h2>Next actions</h2>
        <span className="muted" style={{ fontSize: 12 }}>
          {actionCount}
        </span>
      </div>
      <div className="card elev">
        {actionCount === 0 ? (
          <div style={{ padding: 24, color: "var(--sage)", fontSize: 13 }}>
            You&apos;re all set. Casa Cross will add new details here when they
            are ready.
          </div>
        ) : (
          <>
            {unsignedContracts.slice(0, 3).map(({ booking, contract }) => (
              <Link
                key={contract.id}
                href={`/sign/${contract.share_token}`}
                className="card-row"
              >
                <Icon.doc style={{ color: "var(--terracotta)" }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>
                    Sign {contract.title}
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--ink-4)", marginTop: 3 }}>
                    {booking.event.name}
                  </div>
                </div>
                <Icon.chev style={{ color: "var(--ink-4)" }} />
              </Link>
            ))}
            {unreadMessageBookings.slice(0, 3).map((booking) => (
              <Link
                key={`message-${booking.event.id}`}
                href={`/portal/events/${booking.event.id}#messages`}
                className="card-row"
              >
                <Icon.chat style={{ color: "var(--terracotta)" }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>
                    New message from Casa Cross
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--ink-4)", marginTop: 3 }}>
                    {booking.event.name}
                  </div>
                </div>
                <Icon.chev style={{ color: "var(--ink-4)" }} />
              </Link>
            ))}
            {openForms.slice(0, 3).map(({ booking, assignment }) => (
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
                    {booking.event.name}
                  </div>
                </div>
                <Icon.chev style={{ color: "var(--ink-4)" }} />
              </Link>
            ))}
            {nextBooking && (
              <Link
                href={`/portal/events/${nextBooking.event.id}`}
                className="card-row"
              >
                <Icon.calendar style={{ color: "var(--slate)" }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>
                    Review {nextBooking.event.name}
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--ink-4)", marginTop: 3 }}>
                    {daysUntilLabel(nextBooking.event.date) ||
                      fmtDateFull(nextBooking.event.date)}
                  </div>
                </div>
                <Icon.chev style={{ color: "var(--ink-4)" }} />
              </Link>
            )}
          </>
        )}
      </div>

      <div className="section-label" style={{ marginTop: 28 }}>
        <h2>Your events</h2>
        <span className="muted" style={{ fontSize: 12 }}>
          {bookings.length}
        </span>
      </div>

      <div className="card elev">
        {bookings.length === 0 ? (
          <div style={{ padding: 24, color: "var(--ink-3)", fontSize: 13 }}>
            No event assignments are visible yet.
          </div>
        ) : (
          bookings.map((booking) => (
            <Link
              key={booking.id}
              href={`/portal/events/${booking.event.id}`}
              className="card-row"
              style={{ alignItems: "flex-start" }}
            >
              <span
                className="avatar"
                style={{
                  background: "var(--sage-tint)",
                  color: "var(--sage)",
                }}
              >
                <Icon.calendar style={{ width: 16, height: 16 }} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  {booking.event.name}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--ink-3)",
                    marginTop: 3,
                    lineHeight: 1.4,
                  }}
                >
                  {fmtDateFull(booking.event.date)}
                  {booking.event.time_label ? ` · ${booking.event.time_label}` : ""}
                  {booking.event.location ? ` · ${booking.event.location}` : ""}
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                  <StatusPill status={booking.contract} />
                  {booking.contracts[0] && (
                    <StatusPill status={booking.contracts[0].status} />
                  )}
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

function PortalHeader({
  person,
  access,
}: {
  person: Person;
  access: PortalAccess;
}) {
  return (
    <div style={{ textAlign: "center" }}>
      <Avatar person={person} size="xl" />
      <h1 style={{ marginTop: 16 }}>
        Welcome, <em>{person.preferred_name || person.name}</em>
      </h1>
      <div className="sub" style={{ marginBottom: 10 }}>
        Your Casa Cross assignments, contract links, and event details.
      </div>
      <div className="muted" style={{ fontSize: 12 }}>
        Signed in as {access.email}
      </div>
    </div>
  );
}
