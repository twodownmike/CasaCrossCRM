"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";
import { PdfUploader } from "@/components/pdf-uploader";
import { mdToHtml } from "@/lib/contracts";
import {
  updateContract,
  sendDraftContract,
  recallContract,
  voidContract,
  deleteContract,
  saveContractAsTemplate,
} from "@/app/contracts-actions";

export function ContractEditor({
  id,
  title,
  bodyMd,
  pdfUrl,
  status,
}: {
  id: string;
  title: string;
  bodyMd: string;
  pdfUrl: string | null;
  status: "draft" | "sent" | "signed" | "void";
}) {
  const router = useRouter();
  const [t, setT] = useState(title);
  const [b, setB] = useState(bodyMd);
  const [pdf, setPdf] = useState(pdfUrl || "");
  const [preview, setPreview] = useState(false);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<
    | { kind: "ok"; text: string }
    | { kind: "err"; text: string }
    | null
  >(null);

  const dirty =
    t !== title || b !== bodyMd || (pdf || "") !== (pdfUrl || "");

  function save() {
    setMsg(null);
    const f = new FormData();
    f.set("id", id);
    f.set("title", t);
    f.set("body_md", b);
    f.set("pdf_url", pdf);
    start(async () => {
      const r = await updateContract(f);
      if (!r.ok) {
        setMsg({ kind: "err", text: r.error });
        return;
      }
      setMsg({ kind: "ok", text: "Saved." });
      router.refresh();
    });
  }

  function send() {
    if (dirty && !confirm("Unsaved changes will be lost. Save first?"))
      return;
    const f = new FormData();
    f.set("id", id);
    start(async () => {
      await sendDraftContract(f);
      router.refresh();
    });
  }

  function recall() {
    if (
      !confirm(
        "Recall this contract? The signing link will reject signatures until you send it again. The participant's status will reset to 'unsent'.",
      )
    )
      return;
    const f = new FormData();
    f.set("id", id);
    start(async () => {
      await recallContract(f);
      router.refresh();
    });
  }

  function voidIt() {
    if (
      !confirm(
        "Void this contract? It can no longer be signed. Useful when something fundamental changed.",
      )
    )
      return;
    const f = new FormData();
    f.set("id", id);
    start(async () => {
      await voidContract(f);
      router.refresh();
    });
  }

  function remove() {
    if (
      !confirm(
        "Delete this contract entirely? This can't be undone. The participant's status will reset to 'unsent'.",
      )
    )
      return;
    const f = new FormData();
    f.set("id", id);
    start(async () => {
      await deleteContract(f);
    });
  }

  function saveAsTemplate() {
    const name = window.prompt(
      "Name this template — what should it be called when you re-use it later?",
      t,
    );
    if (!name?.trim()) return;
    const f = new FormData();
    f.set("name", name.trim());
    f.set("body_md", b);
    if (pdf) f.set("pdf_url", pdf);
    start(async () => {
      const r = await saveContractAsTemplate(f);
      if (!r.ok) {
        setMsg({ kind: "err", text: r.error });
        return;
      }
      setMsg({
        kind: "ok",
        text: `Template "${name.trim()}" saved.`,
      });
    });
  }

  return (
    <div>
      <div
        className="card elev"
        style={{ padding: 18, marginBottom: 16 }}
      >
        <div className="form-grid">
          <div>
            <label className="form-label">Title</label>
            <input
              className="input"
              value={t}
              onChange={(e) => setT(e.target.value)}
            />
          </div>

          <div>
            <label className="form-label">PDF (optional)</label>
            <PdfUploader
              initialUrl={pdf || null}
              onChange={(next) => setPdf(next)}
            />
          </div>

          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 6,
              }}
            >
              <label className="form-label" style={{ marginBottom: 0 }}>
                {pdf ? "Preface (Markdown, optional)" : "Body (Markdown)"}
              </label>
              <button
                type="button"
                className="cancel-link"
                onClick={() => setPreview((v) => !v)}
              >
                {preview ? "Edit" : "Preview"}
              </button>
            </div>
            {preview ? (
              <div
                className="sign-body"
                style={{ minHeight: 200 }}
                dangerouslySetInnerHTML={{
                  __html: mdToHtml(b || "_(Empty)_"),
                }}
              />
            ) : (
              <textarea
                className="input textarea"
                value={b}
                onChange={(e) => setB(e.target.value)}
                rows={18}
                style={{
                  minHeight: 320,
                  fontFamily: "ui-monospace, Menlo, monospace",
                  fontSize: 13,
                }}
              />
            )}
            <p
              className="muted"
              style={{ fontSize: 11, marginTop: 6, lineHeight: 1.4 }}
            >
              Merge fields like {"{{participant_name}}"} were filled in
              when the contract was generated — edits here are
              participant-specific.
            </p>
          </div>

          {msg && (
            <div className={`notice ${msg.kind === "err" ? "warn" : ""}`}>
              {msg.text}
            </div>
          )}

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              className="btn primary"
              type="button"
              onClick={save}
              disabled={pending || !dirty}
            >
              {pending ? "Saving…" : dirty ? "Save changes" : "Saved"}
            </button>
            {status === "draft" && (
              <button
                className="btn primary"
                type="button"
                onClick={send}
                disabled={pending}
                style={{
                  background: "var(--terracotta)",
                  borderColor: "var(--terracotta)",
                }}
              >
                <Icon.send /> Send to participant
              </button>
            )}
            {status === "sent" && (
              <button
                className="btn"
                type="button"
                onClick={recall}
                disabled={pending}
              >
                Recall to draft
              </button>
            )}
            <button
              className="btn"
              type="button"
              onClick={saveAsTemplate}
              disabled={pending || (!b.trim() && !pdf)}
              title="Reuse this body as a template for future contracts"
            >
              <Icon.doc /> Save as template
            </button>
            <button
              className="btn"
              type="button"
              onClick={voidIt}
              disabled={pending}
              style={{ color: "var(--terracotta)" }}
            >
              Void
            </button>
            <button
              className="btn"
              type="button"
              onClick={remove}
              disabled={pending}
              style={{ color: "var(--terracotta)" }}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
