import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/icons";
import { relTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function FormsPage() {
  const supabase = createClient();
  const { data: forms } = await supabase
    .from("forms")
    .select("*")
    .order("updated_at", { ascending: false });

  const ids = (forms ?? []).map((f) => f.id);
  const counts = new Map<string, number>();
  if (ids.length > 0) {
    const { data: responses } = await supabase
      .from("form_responses")
      .select("form_id")
      .in("form_id", ids);
    for (const r of responses ?? []) {
      counts.set(r.form_id, (counts.get(r.form_id) ?? 0) + 1);
    }
  }

  return (
    <div className="fade-in">
      <div className="page-head">
        <div className="page-head-text">
          <div className="eyebrow">Forms</div>
          <h1>
            Custom <em>forms</em>
          </h1>
          <div className="sub">
            Build any form, share the link, collect responses.
          </div>
        </div>
        <div className="page-head-actions">
          <Link href="/forms/new" className="btn primary">
            <Icon.plus /> New form
          </Link>
        </div>
      </div>

      <div style={{ padding: "0 var(--s-5)" }}>
        <div className="card elev">
          {(forms ?? []).map((f) => {
            const count = counts.get(f.id) ?? 0;
            return (
              <Link
                key={f.id}
                href={`/forms/${f.id}`}
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
                    background: f.is_published
                      ? "var(--sage-tint)"
                      : "var(--hair-2)",
                    color: f.is_published ? "var(--sage)" : "var(--ink-3)",
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
                      {f.title}
                    </span>
                    <span
                      className={`pill ${f.is_published ? "confirmed" : "pending"}`}
                    >
                      <span className="dot" />
                      {f.is_published ? "Published" : "Draft"}
                    </span>
                  </div>
                  {f.description && (
                    <div
                      style={{
                        fontSize: 12.5,
                        color: "var(--ink-3)",
                        marginTop: 4,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {f.description}
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: 11.5,
                      color: "var(--ink-4)",
                      marginTop: 6,
                    }}
                  >
                    {count} response{count === 1 ? "" : "s"} · updated{" "}
                    {relTime(f.updated_at)}
                  </div>
                </div>
                <Icon.chev style={{ color: "var(--ink-4)", marginTop: 8 }} />
              </Link>
            );
          })}
          {(forms ?? []).length === 0 && (
            <div
              style={{
                padding: 36,
                textAlign: "center",
                color: "var(--ink-3)",
                fontSize: 13,
              }}
            >
              No forms yet. Click <strong>New form</strong> to build your first
              one.
            </div>
          )}
        </div>
      </div>

      <div style={{ height: 24 }} />
    </div>
  );
}
