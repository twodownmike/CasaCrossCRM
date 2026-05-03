import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/icons";
import { StatusPill } from "@/components/pill";
import { relTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ContractsPage() {
  const supabase = createClient();
  const { data: contracts } = await supabase
    .from("contracts")
    .select("*")
    .order("created_at", { ascending: false });

  const eventIds = Array.from(
    new Set((contracts ?? []).map((c) => c.event_id)),
  );
  const partIds = Array.from(
    new Set((contracts ?? []).map((c) => c.participant_id)),
  );

  const [{ data: events }, { data: parts }] = await Promise.all([
    eventIds.length
      ? supabase.from("events").select("id, name").in("id", eventIds)
      : Promise.resolve({ data: [] as Array<{ id: string; name: string }> }),
    partIds.length
      ? supabase
          .from("participants")
          .select("id, person_id")
          .in("id", partIds)
      : Promise.resolve(
          { data: [] as Array<{ id: string; person_id: string }> },
        ),
  ]);
  const personIds = (parts ?? []).map((p) => p.person_id);
  const { data: people } = personIds.length
    ? await supabase
        .from("people")
        .select("id, name")
        .in("id", personIds)
    : { data: [] as Array<{ id: string; name: string }> };

  const eventName = new Map(
    (events ?? []).map((e) => [e.id, e.name] as const),
  );
  const personByPart = new Map<string, string>();
  for (const p of parts ?? []) {
    const person = (people ?? []).find((pp) => pp.id === p.person_id);
    if (person) personByPart.set(p.id, person.name);
  }

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
        </div>
      </div>

      <div style={{ padding: "0 var(--s-5)" }}>
        <div className="card elev">
          {(contracts ?? []).map((c) => (
            <Link
              key={c.id}
              href={`/sign/${c.share_token}`}
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
              No contracts yet. Send one from a participant&apos;s booking
              page.
            </div>
          )}
        </div>
      </div>

      <div style={{ height: 24 }} />
    </div>
  );
}
