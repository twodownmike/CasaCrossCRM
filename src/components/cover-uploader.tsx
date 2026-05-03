"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/icons";

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

export function CoverUploader({
  initialUrl,
  fallbackCover,
}: {
  initialUrl?: string | null;
  fallbackCover?: string | null;
}) {
  const [url, setUrl] = useState(initialUrl || "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    if (file.size > MAX_BYTES) {
      setError("Image too large — keep it under 8 MB.");
      return;
    }
    if (!ALLOWED.includes(file.type) && !file.type.startsWith("image/")) {
      setError("That file isn't an image.");
      return;
    }

    setPending(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("event-covers")
        .upload(path, file, {
          cacheControl: "31536000",
          contentType: file.type || "image/jpeg",
          upsert: false,
        });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("event-covers").getPublicUrl(path);
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

  const previewBg = url
    ? `url(${url})`
    : undefined;

  return (
    <div>
      <label className="form-label">Cover image</label>
      <input type="hidden" name="cover_image_url" value={url} />
      <div
        className={url ? "" : `cover-${fallbackCover || "modern"}`}
        style={{
          height: 160,
          borderRadius: "var(--r-3)",
          border: "1px solid var(--hair)",
          backgroundImage: previewBg,
          backgroundSize: "cover",
          backgroundPosition: "center",
          marginBottom: 10,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {pending && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(20,18,14,0.55)",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
            }}
          >
            Uploading…
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <label
          className="btn"
          style={{ flex: 1, justifyContent: "center", cursor: "pointer" }}
        >
          <Icon.doc /> {url ? "Replace photo" : "Upload photo"}
          <input
            type="file"
            accept="image/*"
            onChange={onPick}
            style={{ display: "none" }}
            disabled={pending}
          />
        </label>
        {url && (
          <button
            type="button"
            className="btn"
            onClick={clear}
            style={{ color: "var(--terracotta)" }}
            disabled={pending}
          >
            Remove
          </button>
        )}
      </div>
      {!url && (
        <p
          className="muted"
          style={{ fontSize: 12, marginTop: 8, lineHeight: 1.4 }}
        >
          Or pick a gradient cover below if you don&apos;t have a photo yet.
        </p>
      )}
      {error && (
        <div className="notice warn" style={{ marginTop: 10 }}>
          {error}
        </div>
      )}
    </div>
  );
}
