import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/icons";
import { Avatar } from "@/components/avatar";
import { StatusPill } from "@/components/pill";
import { ROLE_META, type RoleKind } from "@/lib/types";
import { ParticipantForm } from "./participant-form";
import { ContractsBlock } from "./contracts-block";
import { relTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ParticipantPage({
  params,
}: {
  params: { id: string; pid: string };
}) {
  const supabase = createClient();
  const { data: part } = await supabase
    .from("participants")
    .select("*")
    .eq("id", params.pid)
    .maybeSingle();
  if (!part) notFound();
  const { data: person } = await supabase
    .from("people")
    .select("*")
    .eq("id", part.person_id)
    .maybeSingle();
  if (!person) notFound();

  return (
    <div className="fade-in">
      <header className="app-header">
        <Link className="icon-btn" href={`/events/${params.id}?tab=roster`}>
          <Icon.back />
        </Link>
        <div
          style={{
            fontFamily: "var(--serif)",
            fontWeight: 500,
            fontSize: 15,
          }}
        >
          Booking
        </div>
        <div style={{ width: 36 }} />
      </header>

      <div
        style={{
          padding: "var(--s-7) var(--s-5) var(--s-5)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <Avatar person={person} size="xl" />
        <h1
          style={{
            fontFamily: "var(--serif-display)",
            fontWeight: 400,
            fontSize: 28,
            letterSpacing: "-0.01em",
            margin: "16px 0 4px",
          }}
        >
          {person.name}
        </h1>
        <div className="muted" style={{ fontSize: 13, marginBottom: 8 }}>
          {ROLE_META[person.role as RoleKind]?.label}
        </div>
        <Link
          href={`/people/${person.id}`}
          className="more"
          style={{ fontSize: 12, color: "var(--ink-3)" }}
        >
          View full profile ›
        </Link>
      </div>

      <div style={{ padding: "0 var(--s-5) 24px" }}>
        <ParticipantForm
          participant={part}
          eventId={params.id}
          personSpecialty={person.specialty}
        />
      </div>

      <ContractsSection
        participantId={params.pid}
        recipientName={person.name}
      />
    </div>
  );
}

async function ContractsSection({
  participantId,
  recipientName,
}: {
  participantId: string;
  recipientName: string;
}) {
  const supabase = createClient();
  const [{ data: contracts }, { data: templates }] = await Promise.all([
    supabase
      .from("contracts")
      .select("*")
      .eq("participant_id", participantId)
      .order("created_at", { ascending: false }),
    supabase
      .from("contract_templates")
      .select("id, name")
      .order("updated_at", { ascending: false }),
  ]);

  return (
    <>
      <div className="section-label" style={{ marginTop: 12 }}>
        <h2>Contracts</h2>
        <span className="muted" style={{ fontSize: 12 }}>
          {(contracts ?? []).length}
        </span>
      </div>
      <div style={{ padding: "0 var(--s-5)" }}>
        <div className="card elev">
          {(contracts ?? []).length === 0 ? (
            <div
              style={{
                padding: 24,
                textAlign: "center",
                color: "var(--ink-3)",
                fontSize: 13,
              }}
            >
              No contracts sent yet.
            </div>
          ) : (
            (contracts ?? []).map((c) => (
              <Link
                key={c.id}
                href={`/sign/${c.share_token}`}
                target="_blank"
                rel="noopener noreferrer"
                className="card-row"
              >
                <span
                  className="avatar"
                  style={{
                    background:
                      c.status === "signed"
                        ? "var(--sage-tint)"
                        : "var(--gold-tint)",
                    color:
                      c.status === "signed" ? "var(--sage)" : "#8a6c2e",
                  }}
                >
                  <Icon.doc />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <span style={{ fontSize: 14, fontWeight: 500 }}>
                      {c.title}
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
                      fontSize: 11.5,
                      color: "var(--ink-4)",
                      marginTop: 4,
                    }}
                  >
                    {c.signed_at
                      ? `Signed ${relTime(c.signed_at)} by ${c.signed_name || ""}`
                      : c.sent_at
                        ? `Sent ${relTime(c.sent_at)}`
                        : `Created ${relTime(c.created_at)}`}
                  </div>
                </div>
                <Icon.share style={{ color: "var(--ink-4)" }} />
              </Link>
            ))
          )}
        </div>
      </div>

      <div style={{ padding: "var(--s-5) var(--s-5) var(--s-7)" }}>
        <ContractsBlock
          participantId={participantId}
          recipientName={recipientName}
          templates={(templates ?? []) as Array<{ id: string; name: string }>}
        />
      </div>
    </>
  );
}
