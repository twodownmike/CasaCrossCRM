import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/icons";
import { relTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const supabase = createClient();
  const { data: templates } = await supabase
    .from("contract_templates")
    .select("*")
    .order("updated_at", { ascending: false });

  return (
    <div className="fade-in">
      <header className="app-header">
        <Link className="icon-btn" href="/contracts">
          <Icon.back />
        </Link>
        <div
          style={{
            fontFamily: "var(--serif)",
            fontWeight: 500,
            fontSize: 15,
          }}
        >
          Templates
        </div>
        <div style={{ width: 36 }} />
      </header>
      <div className="page-head">
        <div className="page-head-text">
          <div className="eyebrow">Templates</div>
          <h1>
            Contract <em>templates</em>
          </h1>
          <div className="sub">
            Reusable boilerplate with merge fields like{" "}
            <code>{"{{participant_name}}"}</code>.
          </div>
        </div>
        <div className="page-head-actions">
          <Link href="/contracts/templates/new" className="btn primary">
            <Icon.plus /> New template
          </Link>
        </div>
      </div>

      <div style={{ padding: "0 var(--s-5)" }}>
        <div className="card elev">
          {(templates ?? []).map((t) => (
            <Link
              key={t.id}
              href={`/contracts/templates/${t.id}`}
              className="card-row"
            >
              <span
                className="avatar"
                style={{
                  background: "var(--hair-2)",
                  color: "var(--ink-3)",
                }}
              >
                <Icon.doc />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{t.name}</div>
                {t.description && (
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--ink-3)",
                      marginTop: 2,
                    }}
                  >
                    {t.description}
                  </div>
                )}
                <div
                  style={{
                    fontSize: 11.5,
                    color: "var(--ink-4)",
                    marginTop: 6,
                  }}
                >
                  Updated {relTime(t.updated_at)}
                </div>
              </div>
              <Icon.chev style={{ color: "var(--ink-4)" }} />
            </Link>
          ))}
          {(templates ?? []).length === 0 && (
            <div
              style={{
                padding: 36,
                textAlign: "center",
                color: "var(--ink-3)",
                fontSize: 13,
              }}
            >
              No templates yet — create your first one.
            </div>
          )}
        </div>
      </div>

      <div style={{ height: 24 }} />
    </div>
  );
}
