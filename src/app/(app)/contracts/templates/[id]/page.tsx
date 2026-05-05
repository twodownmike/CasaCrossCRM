import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateTemplate } from "@/app/contracts-actions";
import { MERGE_FIELDS } from "@/lib/contracts";
import { Icon } from "@/components/icons";
import { PdfUploader } from "@/components/pdf-uploader";
import { RichTextEditor } from "@/components/rich-text-editor";
import { DeleteTemplateForm } from "./delete-template-form";

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
            <label className="form-label">PDF (optional)</label>
            <PdfUploader initialUrl={t.pdf_url} />
          </div>
          <div>
            <label className="form-label">Or — Body</label>
            <RichTextEditor
              name="body_md"
              initialValue={t.body_md ?? ""}
              mergeFields={MERGE_FIELDS}
            />
            <p
              className="muted"
              style={{ fontSize: 11, marginTop: 8, lineHeight: 1.4 }}
            >
              If a PDF is attached, the body is shown as a preface only —
              the PDF is what people sign.
            </p>
          </div>

          <button className="btn primary block" type="submit">
            Save changes
          </button>
        </form>

        <DeleteTemplateForm id={t.id} />
      </div>
    </div>
  );
}
