import Link from "next/link";
import { createTemplate } from "@/app/contracts-actions";
import { DEFAULT_TEMPLATE_BODY, MERGE_FIELDS } from "@/lib/contracts";
import { Icon } from "@/components/icons";
import { PdfUploader } from "@/components/pdf-uploader";
import { RichTextEditor } from "@/components/rich-text-editor";

export default function NewTemplatePage() {
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
          New template
        </div>
        <div style={{ width: 36 }} />
      </header>
      <div className="page-head">
        <div className="eyebrow">Templates</div>
        <h1>
          Create a <em>template</em>
        </h1>
        <div className="sub">
          Use the editor below. Insert merge fields like{" "}
          <code>{"{{participant_name}}"}</code> to personalise each contract.
        </div>
      </div>

      <div style={{ padding: "0 var(--s-5) var(--s-7)" }}>
        <form action={createTemplate} className="form-grid">
          <div>
            <label className="form-label">Template name</label>
            <input
              name="name"
              required
              className="input"
              placeholder="Standard booking agreement"
            />
          </div>
          <div>
            <label className="form-label">Internal description</label>
            <input
              name="description"
              className="input"
              placeholder="What this template is for"
            />
          </div>

          <div>
            <label className="form-label">Upload a PDF (optional)</label>
            <PdfUploader />
          </div>

          <div>
            <label className="form-label">Or — Body</label>
            <RichTextEditor
              name="body_md"
              initialValue={DEFAULT_TEMPLATE_BODY}
              mergeFields={MERGE_FIELDS}
            />
            <p
              className="muted"
              style={{ fontSize: 11, marginTop: 8, lineHeight: 1.4 }}
            >
              If a PDF is attached above, the body is shown as a preface only
              — the PDF is what people sign.
            </p>
          </div>

          <button className="btn primary block" type="submit">
            Save template
          </button>
          <Link
            href="/contracts/templates"
            className="cancel-link"
            style={{ textAlign: "center" }}
          >
            Cancel
          </Link>
        </form>
      </div>
    </div>
  );
}
