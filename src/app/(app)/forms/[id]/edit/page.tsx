import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/icons";
import { FormMetaEditor } from "./form-meta-editor";
import { FieldList, FormPreview } from "./field-list";
import { AddFieldButton } from "./add-field-button";

export const dynamic = "force-dynamic";

export default async function FormEditorPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const [{ data: f }, { data: fields }] = await Promise.all([
    supabase.from("forms").select("*").eq("id", params.id).maybeSingle(),
    supabase
      .from("form_fields")
      .select("*")
      .eq("form_id", params.id)
      .order("position", { ascending: true }),
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
          Edit form
        </div>
        <div style={{ width: 36 }} />
      </header>

      <div className="page-head">
        <div className="page-head-text">
          <div className="eyebrow">Editing</div>
          <h1>{f.title}</h1>
        </div>
      </div>

      <div style={{ padding: "0 var(--s-5)" }}>
        <FormMetaEditor
          id={f.id}
          title={f.title}
          description={f.description}
          thankYou={f.thank_you_message}
        />
      </div>

      <div className="section-label" style={{ marginTop: 28 }}>
        <h2>Fields</h2>
        <span className="muted" style={{ fontSize: 12 }}>
          {(fields ?? []).length}
        </span>
      </div>

      <div style={{ padding: "0 var(--s-5)" }}>
        {(fields ?? []).length === 0 ? (
          <div
            style={{
              border: "1px dashed var(--hair)",
              borderRadius: "var(--r-3)",
              padding: 28,
              textAlign: "center",
              color: "var(--ink-3)",
              fontSize: 13,
            }}
          >
            No fields yet. Add the first one below.
          </div>
        ) : (
          <FieldList formId={f.id} fields={fields ?? []} />
        )}
      </div>

      <div style={{ padding: "var(--s-5)" }}>
        <AddFieldButton formId={f.id} />
      </div>

      <div className="section-label">
        <h2>Preview</h2>
      </div>

      <div style={{ padding: "0 var(--s-5) var(--s-7)" }}>
        <FormPreview
          title={f.title}
          description={f.description}
          fields={fields ?? []}
        />
      </div>
    </div>
  );
}
