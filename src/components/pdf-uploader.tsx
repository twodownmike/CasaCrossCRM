"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/icons";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export function PdfUploader({ initialUrl }: { initialUrl?: string | null }) {
  const [url, setUrl] = useState(initialUrl || "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    if (file.size > MAX_BYTES) {
      setError("PDF must be under 10 MB.");
      return;
    }
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Please upload a PDF file.");
      return;
    }
    setPending(true);
    try {
      const supabase = createClient();
      const path = `contracts/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}.pdf`;
      const { error: upErr } = await supabase.storage
        .from("event-covers")
        .upload(path, file, {
          cacheControl: "31536000",
          contentType: "application/pdf",
          upsert: false,
        });
      if (upErr) throw upErr;
      const { data } = supabase.storage
        .from("event-covers")
        .getPublicUrl(path);
      setUrl(data.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setPending(false);
      e.target.value = "";
    }
  }

  function clear() {
    setUrl("");
    setError(null);
  }

  return (
    <div>
      <input type="hidden" name="pdf_url" value={url} />
      {url ? (
        <div
          className="card elev"
          style={{
            padding: 14,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span
            className="avatar"
            style={{
              background: "var(--terracotta-tint)",
              color: "var(--terracotta)",
            }}
          >
            <Icon.doc />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 500 }}>PDF attached</div>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 12,
                color: "var(--ink-3)",
                wordBreak: "break-all",
              }}
            >
              View
            </a>
          </div>
          <label
            className="btn sm"
            style={{ cursor: pending ? "wait" : "pointer", margin: 0 }}
          >
            {pending ? "…" : "Replace"}
            <input
              type="file"
              accept="application/pdf,.pdf"
              onChange={onPick}
              style={{ display: "none" }}
              disabled={pending}
            />
          </label>
          <button
            type="button"
            className="btn sm"
            onClick={clear}
            disabled={pending}
            style={{ color: "var(--terracotta)" }}
          >
            Remove
          </button>
        </div>
      ) : (
        <label
          className="btn block"
          style={{ cursor: pending ? "wait" : "pointer", margin: 0 }}
        >
          <Icon.doc /> {pending ? "Uploading…" : "Upload PDF"}
          <input
            type="file"
            accept="application/pdf,.pdf"
            onChange={onPick}
            style={{ display: "none" }}
            disabled={pending}
          />
        </label>
      )}
      {error && (
        <div className="notice warn" style={{ marginTop: 10 }}>
          {error}
        </div>
      )}
      <p
        className="muted"
        style={{ fontSize: 11, marginTop: 8, lineHeight: 1.5 }}
      >
        When a PDF is attached, the signing page renders the PDF in place of
        the markdown body. Up to 10 MB. Merge fields aren&apos;t auto-filled
        into the PDF — keep that for plain-text contracts.
      </p>
    </div>
  );
}
