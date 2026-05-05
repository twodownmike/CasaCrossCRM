import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/icons";
import { StatusPill } from "@/components/pill";
import { fmtDateFull, relTime } from "@/lib/format";
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
        <PortalLine icon={<Icon.users />} label="Your status" value={(participant as Participant).status} status={(participant as Participant).status} />
      </div>

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
