import Link from "next/link";
import { createTemplate } from "@/app/contracts-actions";
import { DEFAULT_TEMPLATE_BODY, MERGE_FIELDS } from "@/lib/contracts";
import { Icon } from "@/components/icons";
import { PdfUploader } from "@/components/pdf-uploader";

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
          Edit the body in markdown. Insert merge fields with{" "}
          <code>{"{{double_braces}}"}</code>.
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
            <label className="form-label">Or — Body (Markdown)</label>
            <textarea
              name="body_md"
              className="input textarea"
              rows={20}
              defaultValue={DEFAULT_TEMPLATE_BODY}
              style={{ minHeight: 320, fontFamily: "ui-monospace, Menlo, monospace", fontSize: 13 }}
            />
            <p
              className="muted"
              style={{ fontSize: 11, marginTop: 6, lineHeight: 1.4 }}
            >
              If a PDF is attached above, the markdown body is shown as a
              preface only — the PDF is what people sign.
            </p>
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
