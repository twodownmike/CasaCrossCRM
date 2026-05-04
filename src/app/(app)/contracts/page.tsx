import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/icons";
import { StatusPill } from "@/components/pill";
import { relTime } from "@/lib/format";
import { NewContractButton } from "./new-contract-button";

export const dynamic = "force-dynamic";

export default async function ContractsPage() {
  const supabase = createClient();
  const { data: contracts } = await supabase
    .from("contracts")
    .select("*")
    .order("created_at", { ascending: false });

  // For the per-row labels (existing contracts):
  const contractEventIds = Array.from(
    new Set((contracts ?? []).map((c) => c.event_id)),
  );
  const contractPartIds = Array.from(
    new Set((contracts ?? []).map((c) => c.participant_id)),
  );

  // For the New Contract picker: every event + every active participant.
  const [
    { data: rowEvents },
    { data: rowParts },
    { data: allEvents },
    { data: allParticipants },
    { data: allPeople },
    { data: templates },
  ] = await Promise.all([
    contractEventIds.length
      ? supabase.from("events").select("id, name").in("id", contractEventIds)
      : Promise.resolve({ data: [] as Array<{ id: string; name: string }> }),
    contractPartIds.length
      ? supabase
          .from("participants")
          .select("id, person_id")
          .in("id", contractPartIds)
      : Promise.resolve(
          { data: [] as Array<{ id: string; person_id: string }> },
        ),
    supabase
      .from("events")
      .select("id, name, date")
      .order("date", { ascending: false }),
    supabase
      .from("participants")
      .select("id, event_id, person_id, role, rate")
      .range(0, 9999),
    supabase
      .from("people")
      .select("id, name, preferred_name, legal_name")
      .range(0, 9999),
    supabase
      .from("contract_templates")
      .select("id, name")
      .order("updated_at", { ascending: false }),
  ]);

  const personIds = (rowParts ?? []).map((p) => p.person_id);
  const { data: rowPeople } = personIds.length
    ? await supabase.from("people").select("id, name").in("id", personIds)
    : { data: [] as Array<{ id: string; name: string }> };

  const eventName = new Map(
    (rowEvents ?? []).map((e) => [e.id, e.name] as const),
  );
  const personByPart = new Map<string, string>();
  for (const p of rowParts ?? []) {
    const person = (rowPeople ?? []).find((pp) => pp.id === p.person_id);
    if (person) personByPart.set(p.id, person.name);
  }

  // Build the picker payload: events with embedded participants + person names
  const peopleById = new Map(
    (allPeople ?? []).map(
      (p) =>
        [
          p.id,
          {
            name:
              p.preferred_name || p.legal_name || p.name,
          },
        ] as const,
    ),
  );

  const pickerEvents = (allEvents ?? [])
    .map((e) => {
      const eventParts = (allParticipants ?? [])
        .filter((p) => p.event_id === e.id)
        .map((p) => ({
          id: p.id,
          name: peopleById.get(p.person_id)?.name || "Unknown",
          role: p.role,
          rate: Number(p.rate ?? 0),
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
      return { ...e, participants: eventParts };
    })
    .filter((e) => e.participants.length > 0);

  return (
    <div className="fade-in">
      <div className="page-head">
        <div className="page-head-text">
          <div className="eyebrow">E-sign</div>
          <h1>
            All <em>contracts</em>
          </h1>
          <div className="sub">
            Booking agreements you&apos;ve sent to participants.
          </div>
        </div>
        <div className="page-head-actions">
          <Link href="/contracts/templates" className="btn">
            Templates
          </Link>
          <NewContractButton
            events={pickerEvents}
            templates={(templates ?? []) as Array<{ id: string; name: string }>}
          />
        </div>
      </div>

      <div style={{ padding: "0 var(--s-5)" }}>
        <div className="card elev">
          {(contracts ?? []).map((c) => (
            <Link
              key={c.id}
              href={`/contracts/${c.id}`}
              className="card-row"
              style={{
                alignItems: "flex-start",
                paddingTop: 14,
                paddingBottom: 14,
              }}
            >
              <span
                className="avatar"
                style={{
                  background:
                    c.status === "signed"
                      ? "var(--sage-tint)"
                      : c.status === "sent"
                        ? "var(--gold-tint)"
                        : c.status === "void"
                          ? "var(--hair-2)"
                          : "var(--terracotta-tint)",
                  color:
                    c.status === "signed"
                      ? "var(--sage)"
                      : c.status === "sent"
                        ? "#8a6c2e"
                        : c.status === "void"
                          ? "var(--ink-3)"
                          : "var(--terracotta)",
                }}
              >
                <Icon.doc />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 500 }}>
                    {personByPart.get(c.participant_id) || "Unknown"}
                  </span>
                  <StatusPill
                    status={
                      c.status === "signed"
                        ? "signed"
                        : c.status === "sent"
                          ? "sent"
                          : c.status === "void"
                            ? "wrapped"
                            : "unsent"
                    }
                  />
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--ink-3)",
                    marginTop: 4,
                  }}
                >
                  {c.title} · {eventName.get(c.event_id) || "—"}
                </div>
                <div
                  style={{
                    fontSize: 11.5,
                    color: "var(--ink-4)",
                    marginTop: 4,
                  }}
                >
                  {c.signed_at
                    ? `Signed ${relTime(c.signed_at)}`
                    : c.sent_at
                      ? `Sent ${relTime(c.sent_at)}`
                      : `Created ${relTime(c.created_at)}`}
                </div>
              </div>
              <Icon.chev style={{ color: "var(--ink-4)", marginTop: 8 }} />
            </Link>
          ))}
          {(contracts ?? []).length === 0 && (
            <div
              style={{
                padding: 36,
                textAlign: "center",
                color: "var(--ink-3)",
                fontSize: 13,
              }}
            >
              No contracts yet. Tap{" "}
              <strong>New contract</strong> above to send your first one.
            </div>
          )}
        </div>
      </div>

      <div style={{ height: 24 }} />
    </div>
  );
}
