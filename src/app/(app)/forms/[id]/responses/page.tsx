import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/icons";
import { fmtDateFull, relTime } from "@/lib/format";
import { ResponseRow } from "./response-row";

export const dynamic = "force-dynamic";

export default async function FormResponses({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const [{ data: f }, { data: fields }, { data: responses }] =
    await Promise.all([
      supabase.from("forms").select("*").eq("id", params.id).maybeSingle(),
      supabase
        .from("form_fields")
        .select("*")
        .eq("form_id", params.id)
        .order("position", { ascending: true }),
      supabase
        .from("form_responses")
        .select("*")
        .eq("form_id", params.id)
        .order("created_at", { ascending: false }),
    ]);
  if (!f) notFound();

  return (
    <div className="fade-in">
      <header className="app-header">
        <Link className="icon-btn" href={`/forms/${f.id}`}>
          <Icon.back />
        </Link>
        <div
          style={{
            fontFamily: "var(--serif)",
            fontWeight: 500,
            fontSize: 15,
          }}
        >
          Responses
        </div>
        <div style={{ width: 36 }} />
      </header>

      <div className="page-head">
        <div className="eyebrow">{f.title}</div>
        <h1>
          {(responses ?? []).length} response
          {(responses ?? []).length === 1 ? "" : "s"}
        </h1>
      </div>

      <div
        style={{
          padding: "0 var(--s-5)",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {(responses ?? []).length === 0 ? (
          <div className="empty">
            <h3>Nothing yet</h3>
            <div>Share the form link to start collecting responses.</div>
          </div>
        ) : (
          (responses ?? []).map((r) => (
            <div key={r.id} className="card elev" style={{ padding: 16 }}>
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--ink-4)",
                  fontWeight: 500,
                  marginBottom: 12,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>
                  {fmtDateFull(r.created_at.slice(0, 10))} ·{" "}
                  {relTime(r.created_at)}
                </span>
                <ResponseRow id={r.id} formId={f.id} />
              </div>
              <dl
                style={{
                  display: "grid",
                  gridTemplateColumns: "max-content 1fr",
                  gap: "8px 18px",
                  margin: 0,
                }}
              >
                {(fields ?? []).map((field) => {
                  const v = (r.data as Record<string, unknown>)[
                    field.field_key
                  ];
                  const display =
                    v === null || v === undefined || v === ""
                      ? "—"
                      : typeof v === "boolean"
                        ? v
                          ? "Yes"
                          : "No"
                        : String(v);
                  return (
                    <div
                      key={field.id}
                      style={{ display: "contents", fontSize: 13 }}
                    >
                      <dt
                        style={{
                          color: "var(--ink-3)",
                          fontWeight: 500,
                        }}
                      >
                        {field.label}
                      </dt>
                      <dd
                        style={{
                          margin: 0,
                          color: "var(--ink-2)",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                        }}
                      >
                        {display}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </div>
          ))
        )}
      </div>

      <div style={{ height: 24 }} />
    </div>
  );
}
