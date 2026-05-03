import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/icons";
import { Avatar } from "@/components/avatar";
import { ROLE_META, type RoleKind } from "@/lib/types";
import { ParticipantForm } from "./participant-form";

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
        <Link className="icon-btn" href={`/events/${params.id}?tab=money`}>
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
      </div>

      <div style={{ padding: "0 var(--s-5) var(--s-7)" }}>
        <ParticipantForm
          participant={part}
          eventId={params.id}
        />
      </div>
    </div>
  );
}
