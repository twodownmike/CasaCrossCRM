import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icons";
import { createClient } from "@/lib/supabase/server";
import { EventForm } from "./event-form";

export const dynamic = "force-dynamic";

export default async function EditEventPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data: e } = await supabase
    .from("events")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();
  if (!e) notFound();

  return (
    <div className="fade-in">
      <header className="app-header">
        <Link className="icon-btn" href={`/events/${params.id}`}>
          <Icon.back />
        </Link>
        <div
          style={{
            fontFamily: "var(--serif)",
            fontWeight: 500,
            fontSize: 15,
          }}
        >
          Edit event
        </div>
        <div style={{ width: 36 }} />
      </header>
      <div className="page-head">
        <div className="eyebrow">Studio</div>
        <h1>{e.name}</h1>
      </div>
      <div style={{ padding: "0 var(--s-5) var(--s-7)" }}>
        <EventForm event={e} />
      </div>
    </div>
  );
}
