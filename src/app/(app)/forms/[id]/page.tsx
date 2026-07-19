import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/icons";
import { fmtDateFull, relTime } from "@/lib/format";
import { PublishToggle } from "./publish-toggle";
import { ShareLink } from "./share-link";
import { DeleteForm } from "./delete-form";

export const dynamic = "force-dynamic";

export default async function FormOverview({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const [{ data: f }, { data: fields }, { data: responses, count }] =
    await Promise.all([
      supabase.from("forms").select("*").eq("id", params.id).maybeSingle(),
      supabase
        .from("form_fields")
        .select("*")
        .eq("form_id", params.id)
        .order("position", { ascending: true }),
      supabase
        .from("form_responses")
        .select("*", { count: "exact" })
        .eq("form_id", params.id)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);
  if (!f) notFound();

  const totalResponses = count ?? 0;
  const fieldCount = (fields ?? []).filter(
    (field) => field.type !== "section",
  ).length;

  return (
    <div className="fade-in">
      <header className="app-header">
        <Link className="icon-btn" href="/forms">
          <Icon.back />
        </Link>
        <div
          style={{
            fontFamily: "var(--serif)",
            fontWeight: 500,
            fontSize: 15,
          }}
        >
          Form
        </div>
        <Link className="icon-btn" href={`/forms/${params.id}/edit`}>
          <Icon.doc />
        </Link>
      </header>

      <div className="page-head">
        <div className="page-head-text">
          <div className="eyebrow">
            {f.is_published ? "Published" : "Draft"}
          </div>
          <h1>{f.title}</h1>
          {f.description && <div className="sub">{f.description}</div>}
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat">
          <div className="label">Responses</div>
          <div className="val tabnums">{totalResponses}</div>
          <div className="delta">
            {responses && responses[0]
              ? `latest ${relTime(responses[0].created_at)}`
              : "no responses yet"}
          </div>
        </div>
        <div className="stat">
          <div className="label">Questions</div>
          <div className="val tabnums">{fieldCount}</div>
          <div className="delta">
            <Link href={`/forms/${params.id}/edit`} className="more">
              edit ›
            </Link>
          </div>
        </div>
      </div>

      <div style={{ padding: "var(--s-7) var(--s-5) 0" }}>
        <PublishToggle id={f.id} isPublished={f.is_published} />
      </div>

      {f.is_published && (
        <div style={{ padding: "var(--s-5) var(--s-5) 0" }}>
          <ShareLink slug={f.slug} />
        </div>
      )}

      <div className="section-label" style={{ marginTop: 28 }}>
        <h2>Recent responses</h2>
        {totalResponses > 0 && (
          <Link href={`/forms/${params.id}/responses`} className="more">
            All ›
          </Link>
        )}
      </div>
      <div style={{ padding: "0 var(--s-5)" }}>
        <div className="card elev">
          {(responses ?? []).length === 0 ? (
            <div
              style={{
                padding: 24,
                textAlign: "center",
                color: "var(--ink-3)",
                fontSize: 13,
              }}
            >
              No responses yet.
            </div>
          ) : (
            (responses ?? []).map((r) => (
              <Link
                key={r.id}
                href={`/forms/${params.id}/responses`}
                className="card-row"
              >
                <span
                  className="avatar"
                  style={{
                    background: "var(--terracotta-tint)",
                    color: "var(--terracotta)",
                  }}
                >
                  <Icon.mail />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: "var(--ink-2)" }}>
                    {summarize(r.data, fields ?? [])}
                  </div>
                  <div
                    style={{
                      fontSize: 11.5,
                      color: "var(--ink-4)",
                      marginTop: 4,
                    }}
                  >
                    {fmtDateFull(r.created_at.slice(0, 10))} ·{" "}
                    {relTime(r.created_at)}
                  </div>
                </div>
                <Icon.chev style={{ color: "var(--ink-4)" }} />
              </Link>
            ))
          )}
        </div>
      </div>

      <DeleteForm id={f.id} />
    </div>
  );
}

function summarize(
  data: Record<string, unknown>,
  fields: Array<{ field_key: string; label: string; type: string }>,
) {
  const first = fields.filter((field) => field.type !== "section").slice(0, 2);
  return first
    .map((f) => {
      const v = data[f.field_key];
      const display =
        v === null || v === undefined
          ? ""
          : typeof v === "boolean"
            ? v
              ? "yes"
              : "no"
            : Array.isArray(v)
              ? v.join(", ")
              : String(v);
      return `${f.label}: ${display || "—"}`;
    })
    .join(" · ");
}
