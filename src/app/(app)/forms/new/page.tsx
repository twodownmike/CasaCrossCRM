import Link from "next/link";
import { createForm } from "@/app/forms-actions";
import { Icon } from "@/components/icons";

export default function NewFormPage() {
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
          New form
        </div>
        <div style={{ width: 36 }} />
      </header>
      <div className="page-head">
        <div className="eyebrow">Forms</div>
        <h1>
          Start a <em>form</em>
        </h1>
        <div className="sub">
          Give it a title — you&apos;ll add fields next.
        </div>
      </div>
      <div style={{ padding: "0 var(--s-5) var(--s-7)" }}>
        <form action={createForm} className="form-grid">
          <div>
            <label className="form-label">Title</label>
            <input
              name="title"
              required
              className="input"
              placeholder="Vendor application — Spring 2026"
              autoFocus
            />
          </div>
          <div>
            <label className="form-label">Description (optional)</label>
            <textarea
              name="description"
              className="input textarea"
              placeholder="A short paragraph shown above the form."
            />
          </div>
          <button className="btn primary block" type="submit">
            Continue to fields →
          </button>
          <Link
            href="/forms"
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
