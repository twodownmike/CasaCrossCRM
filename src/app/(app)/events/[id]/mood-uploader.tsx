"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/icons";
import { addMoodImage, removeMoodImage } from "@/app/actions";
import type { MoodImage } from "@/lib/types";

const MAX_BYTES = 8 * 1024 * 1024;

export function MoodUploader({
  eventId,
  images,
}: {
  eventId: string;
  images: MoodImage[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;
    setError(null);

    for (const file of files) {
      if (file.size > MAX_BYTES) {
        setError(`${file.name} is over 8 MB — skipped.`);
        continue;
      }
      if (!file.type.startsWith("image/")) {
        setError(`${file.name} isn't an image — skipped.`);
        continue;
      }
      setBusy(true);
      try {
        const supabase = createClient();
        const ext = file.name.split(".").pop() || "jpg";
        const path = `mood/${eventId}/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("event-covers")
          .upload(path, file, {
            cacheControl: "31536000",
            contentType: file.type || "image/jpeg",
            upsert: false,
          });
        if (upErr) throw upErr;
        const { data } = supabase.storage
          .from("event-covers")
          .getPublicUrl(path);

        const f = new FormData();
        f.set("event_id", eventId);
        f.set("url", data.publicUrl);
        await addMoodImage(f);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      }
    }
    setBusy(false);
    router.refresh();
  }

  function remove(id: string) {
    if (!confirm("Remove this image from the mood board?")) return;
    const f = new FormData();
    f.set("id", id);
    f.set("event_id", eventId);
    start(async () => {
      await removeMoodImage(f);
      router.refresh();
    });
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <div
          style={{
            fontFamily: "var(--serif)",
            fontWeight: 500,
            fontSize: 15,
          }}
        >
          Inspiration
        </div>
        <label
          className="btn sm"
          style={{ cursor: "pointer", margin: 0 }}
        >
          <Icon.plus /> {busy ? "Uploading…" : "Add images"}
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={onPick}
            style={{ display: "none" }}
            disabled={busy || pending}
          />
        </label>
      </div>

      {error && (
        <div className="notice warn" style={{ marginBottom: 12 }}>
          {error}
        </div>
      )}

      {images.length === 0 ? (
        <div
          style={{
            border: "1px dashed var(--hair)",
            borderRadius: "var(--r-3)",
            padding: 36,
            textAlign: "center",
            color: "var(--ink-3)",
            fontSize: 13,
          }}
        >
          No inspiration yet. Add reference photos for the team.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
            gap: 10,
          }}
        >
          {images.map((img) => (
            <div
              key={img.id}
              style={{
                aspectRatio: "1",
                borderRadius: "var(--r-3)",
                backgroundImage: `url(${img.url})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                position: "relative",
                border: "1px solid var(--hair)",
              }}
            >
              <button
                type="button"
                onClick={() => remove(img.id)}
                aria-label="Remove image"
                style={{
                  position: "absolute",
                  top: 6,
                  right: 6,
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  border: "none",
                  background: "rgba(20,18,14,0.55)",
                  color: "white",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  backdropFilter: "blur(6px)",
                }}
                disabled={pending}
              >
                <Icon.close />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
