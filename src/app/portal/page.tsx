import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/avatar";
import { Icon } from "@/components/icons";
import { StatusPill } from "@/components/pill";
import { daysUntil, daysUntilLabel, fmtDateFull } from "@/lib/format";
import type { EventRow, Participant, Person, Contract } from "@/lib/types";

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

  const [{ data: events }, { data: contracts }] = await Promise.all([
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
  ]);

  const eventsById = new Map<string, EventRow>();
  ((events ?? []) as EventRow[]).forEach((event) => eventsById.set(event.id, event));
  const contractsByParticipant = new Map<string, Contract[]>();
  ((contracts ?? []) as Contract[]).forEach((contract) => {
    const list = contractsByParticipant.get(contract.participant_id) ?? [];
    list.push(contract);
    contractsByParticipant.set(contract.participant_id, list);
  });

  const bookings: PortalBooking[] = participants
    .map((participant) => {
      const event = eventsById.get(participant.event_id);
      if (!event) return null;
      return {
        ...participant,
        event,
        contracts: contractsByParticipant.get(participant.id) ?? [],
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
  const actionCount = (nextBooking ? 1 : 0) + unsignedContracts.length;

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
