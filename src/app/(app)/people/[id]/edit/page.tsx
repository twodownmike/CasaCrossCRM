import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icons";
import { createClient } from "@/lib/supabase/server";
import { PersonForm } from "./person-form";

export const dynamic = "force-dynamic";

export default async function EditPersonPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data: p } = await supabase
    .from("people")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();
  if (!p) notFound();

  return (
    <div className="fade-in">
      <header className="app-header">
        <Link className="icon-btn" href={`/people/${params.id}`}>
          <Icon.back />
        </Link>
        <div
          style={{
            fontFamily: "var(--serif)",
            fontWeight: 500,
            fontSize: 15,
          }}
        >
          Edit contact
        </div>
        <div style={{ width: 36 }} />
      </header>
      <div className="page-head">
        <h1>{p.name}</h1>
      </div>
      <div style={{ padding: "0 var(--s-5) var(--s-7)" }}>
        <PersonForm person={p} />
      </div>
    </div>
  );
}
