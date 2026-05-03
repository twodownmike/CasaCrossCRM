import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateTemplate, deleteTemplate } from "@/app/contracts-actions";
import { MERGE_FIELDS } from "@/lib/contracts";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function TemplateEdit({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data: t } = await supabase
    .from("contract_templates")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();
  if (!t) notFound();

  return (
    <div className="fade-in">
      <header className="app-header">
        <Link className="icon-btn" href="/contracts/templates">
          <Icon.back />
        </Link>
        <div
          style={{
            fontFamily: "var(--serif)",
            fontWeight: 500,
            fontSize: 15,
          }}
        >
          Edit template
        </div>
        <div style={{ width: 36 }} />
      </header>
      <div className="page-head">
        <h1>{t.name}</h1>
      </div>

      <div style={{ padding: "0 var(--s-5) var(--s-7)" }}>
        <form action={updateTemplate} className="form-grid">
          <input type="hidden" name="id" value={t.id} />
          <div>
            <label className="form-label">Template name</label>
            <input name="name" required className="input" defaultValue={t.name} />
          </div>
          <div>
            <label className="form-label">Internal description</label>
            <input
              name="description"
              className="input"
              defaultValue={t.description || ""}
            />
          </div>
          <div>
            <label className="form-label">Body (Markdown)</label>
            <textarea
              name="body_md"
              className="input textarea"
              rows={20}
              defaultValue={t.body_md}
              style={{
                minHeight: 360,
                fontFamily: "ui-monospace, Menlo, monospace",
                fontSize: 13,
              }}
            />
          </div>

          <details
            className="card elev"
            style={{ padding: 14, fontSize: 13 }}
          >
            <summary
              style={{
                cursor: "pointer",
                fontWeight: 500,
                color: "var(--ink-2)",
              }}
            >
              Available merge fields
            </summary>
            <ul style={{ margin: "12px 0 0", paddingLeft: 18 }}>
              {MERGE_FIELDS.map(([k, label]) => (
                <li key={k} style={{ marginBottom: 4 }}>
                  <code>{k}</code> — <span className="muted">{label}</span>
                </li>
              ))}
            </ul>
          </details>

          <button className="btn primary block" type="submit">
            Save changes
          </button>
        </form>

        <form
          action={deleteTemplate}
          style={{ marginTop: 14 }}
          onSubmit={(e) => {
            if (
              !confirm("Delete this template? Existing contracts that used it stay intact.")
            )
              e.preventDefault();
          }}
        >
          <input type="hidden" name="id" value={t.id} />
          <button
            className="btn block"
            type="submit"
            style={{ color: "var(--terracotta)" }}
          >
            Delete template
          </button>
        </form>
      </div>
    </div>
  );
}
